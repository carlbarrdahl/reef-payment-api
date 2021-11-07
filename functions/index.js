const functions = require("firebase-functions");
const admin = require("firebase-admin");

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios").default;

const { WsProvider } = require("@polkadot/rpc-provider");
const { Provider } = require("@reef-defi/evm-provider");
const { Keyring } = require("@polkadot/api");
const { mnemonicGenerate } = require("@polkadot/util-crypto");

const app = express();

app.use(cors({ origin: true }));
// app.use(require("express-pino-logger")());

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://reef-payment-api-default-rtdb.firebaseio.com",
});

// For Merchant admin UI
async function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || "").split("Bearer ")[1];
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

/*
API key management

Merchants can create and view API key.
*/
app.post("/key", authMiddleware, async (req, res) => {
  console.log("Creating API key for user:", req.user.uid);
  try {
    const key = createKey();

    await admin.database().ref(`/users/${req.user.uid}/key`).set(key);
    await admin.database().ref(`/tokens/${key}`).set(req.user.uid);

    res.status(201).send({ key });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/key", authMiddleware, async (req, res) => {
  console.log("Getting API key for user: ", req.user.uid);
  const key = await admin
    .database()
    .ref(`/users/${req.user.uid}/key`)
    .once("value")
    .then((snap) => snap.val());

  console.log("API key found");

  return res.send({ key });
});

// Out of scope for proof of concept. Keys should be encrypted with app secret before stored.
const encrypt = (string) => string;
const decrypt = (string) => string;

function createKey() {
  return crypto.randomBytes(20).toString("hex");
}

/*
Wallet address management

Merchants store the wallet address they want funds transfered to.
*/
app.post("/wallet", authMiddleware, async (req, res) => {
  try {
    const { wallet } = req.body || {};
    console.log("Saving wallet address for user:", req.user.uid, wallet);
    if (!wallet) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    await admin.database().ref(`/users/${req.user.uid}/wallet`).set(wallet);

    console.log("Wallet address saved");

    res.status(201).send({ wallet });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/wallet", authMiddleware, async (req, res) => {
  console.log("Getting wallet address for user:", req.user.uid);
  const wallet = await admin
    .database()
    .ref(`/users/${req.user.uid}/wallet`)
    .once("value");

  return res.send({ wallet: wallet.val() });
});

/*
Payment API

Merchant store sends a request and receive a newly generated wallet address.
This address is shown in their UI and user sends payment to this address.
When payment is made the webhook on merchant server is triggered.
*/
app.post("/pay", async (req, res) => {
  console.log("Creating payment");
  try {
    const { amount, webhookURL } = req.body || {};
    if (isNaN(amount) || !webhookURL) {
      return res.status(400).json({ error: "Invalid wallet" });
    }

    // Validate api key token
    console.log("Verifying API key");
    const token = (req.headers.authorization || "").split("Bearer ")[1];
    const uid = await admin
      .database()
      .ref(`/tokens/${token}`)
      .once("value")
      .then((snap) => snap.val());

    console.log("API key found for merchant:", uid);
    if (!uid) {
      return res.status(401).send({ error: "Invalid API key" });
    }

    console.log("Getting configured merchant wallet address");
    const address = await admin
      .database()
      .ref(`/users/${uid}/wallet`)
      .once("value")
      .then((snap) => snap.val());
    console.log("Wallet address found:", address);

    console.log("Create Reef client");
    const provider = new Provider({
      provider: new WsProvider("wss://rpc-testnet.reefscan.com/ws"),
    });
    await provider.api.isReadyOrError;

    console.log("Generating random wallet");
    const tempWallet = createRandomWallet();

    // Return address to caller
    console.log("Return wallet to requesting user");
    res.status(200).send({
      amount,
      address: tempWallet.address,
    });

    const amountInAddress = await waitForFunds(
      tempWallet.address,
      amount,
      provider.api
    );
    console.log("Getting transaction fee");
    const { partialFee } = await provider.api.tx.balances
      .transfer(address, amount)
      .paymentInfo(tempWallet);

    const fee = partialFee.toBigInt();
    console.log("Fee:", fee);

    const event = await payWallet(
      address,
      amountInAddress - fee,
      tempWallet,
      provider.api
    );
    await callWebhook(webhookURL, { address: tempWallet.address, event });

    console.log("All done!");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Watches an address for changes and compares new balance with requested amount
async function waitForFunds(address, amount, api) {
  console.log("Watching for changes in created wallet:", address);
  return new Promise(async (resolve, reject) => {
    const unsub = await api.query.system.account(
      address,
      async ({ data: { free } }) => {
        const balance = free.toBigInt();
        console.log("Balance changed:", balance);
        console.log("Verify it's same as payment amount:", BigInt(amount));
        if (balance >= BigInt(amount)) {
          unsub();
          resolve(balance);
        } else {
          console.log("Balance is less than expected amount");
          console.log("Waiting for more transfers...");
        }
      }
    );
  });
}

// Sends payment to wallet
async function payWallet(address, amount, wallet, api) {
  return new Promise(async (resolve, reject) => {
    console.log(`Transfering: ${amount} to ${address} from ${wallet.address}`);
    const unsub = await api.tx.balances
      .transfer(address, amount)
      .signAndSend(wallet, async (result) => {
        console.log(`Current status is ${result.status}`);
        if (result.status.isInBlock) {
          console.log(`tx included at blockHash ${result.status.asInBlock}`);
          resolve(result);
          unsub();
        }
      });
  });
}

async function callWebhook(url, data) {
  return axios
    .post(url, data)
    .then(() => console.log("Webhook called successfully!"))
    .catch((err) => console.log("Error calling webhook", err));
}

function createRandomWallet() {
  const keyring = new Keyring({ type: "sr25519" });
  return keyring.addFromMnemonic(mnemonicGenerate());
}

/*
Merchant demo

These two endpoints should be in Merchants system.
They update their internal database when webhook is called (payment received)
and returns payment info when queried so we can update UI

*/
app.post("/merchant/webhook", async (req, res) => {
  console.log("Webhook called successfully with data:");
  console.log(JSON.stringify(req.body, null, 2));

  // Update merchant db with payment info
  await admin
    .database()
    .ref(`/payments/${req.body.address}`)
    .set(req.body.event);
  res.send({ status: "ok" });
});

app.get("/merchant/store", async (req, res) => {
  // Get payment info from merchant db so UI can be updated wen received
  const payment = await admin
    .database()
    .ref(`/payments/${req.query.address}`)
    .once("value")
    .then((snap) => snap.val());
  res.send(payment || {});
});

exports.api = functions
  .runWith({
    timeoutSeconds: 3 * 60,
    memory: "1GB",
  })
  .https.onRequest(app);
