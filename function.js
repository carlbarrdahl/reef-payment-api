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

const config = require("./config");

const app = express();

app.use(cors({ origin: true }));
// app.use(require("express-pino-logger")());

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: config.firebase.databaseURL,
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
      provider: new WsProvider(config.network.networkURL),
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

    await waitForFunds(tempWallet.address, amount, provider.api);
    const event = await payWallet(address, amount, tempWallet, provider.api);
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
      async ({ data: { free: balance } }) => {
        console.log("Balance changed:", balance.toHuman(), balance.toString());
        console.log("Verify it's same as payment amount:", amount);
        if (balance.toString() === amount) {
          unsub();
          resolve();
        }
      }
    );
  });
}

// Sends payment to wallet
async function payWallet(address, amount, wallet, api) {
  return new Promise(async (resolve, reject) => {
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

exports.api = functions.https.onRequest(app);
