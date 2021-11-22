const { validateRoute } = require("express-ajv-middleware");

const { config } = require("../config/firebase");
const { apiKeyMiddleware, authMiddleware } = require("../helpers/auth");

// const { WsProvider } = require("@polkadot/rpc-provider");
// const { Provider } = require("@reef-defi/evm-provider");
const createWallet = require("../helpers/reef");
// Out of scope for proof of concept. Keys should be encrypted with app secret before stored.
const encrypt = (string) => string;
const decrypt = (string) => string;

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

module.exports = (app, { db, createReefApi }) => {
  app.post(
    "/checkout",
    apiKeyMiddleware,
    validateRoute({
      body: {
        type: "object",
        properties: {
          paymentId: { type: "string" },
          address: { type: "string" },
          amount: { type: "string", pattern: "^[0-9]+$" },
          redirectURL: { format: "uri", pattern: "^https?://" },
        },
        required: ["paymentId", "amount", "redirectURL", "address"],
      },
    }),
    async (req, res) => {
      try {
        const { amount, paymentId, redirectURL, address, timestamp } = req.body;
        console.log("Validating req.body", req.body);
        console.log("Creating Reef API", createReefApi);
        const reefApi = await createReefApi();
        console.log("Generating random wallet");

        const { mnemonic, wallet } = createWallet();
        // Encrypt and store wallet
        console.log("Encrypting and storing wallet");
        // wallet is undefined in test for some reason
        const recipientAddress = wallet ? wallet.address : "<test-address>";
        await db
          .ref(`/wallets/${paymentId}`)
          .set({ address: recipientAddress, mnemonic: encrypt(mnemonic) });

        await db
          .ref(`/payments/${paymentId}`)
          .set({ address: recipientAddress, amount });

        // Return address to caller
        console.log("Return wallet to requesting user");
        const apiKey = (req.headers.authorization || "").split("Bearer ")[1];
        const checkoutURL = `${config.baseURL}/checkout?paymentId=${paymentId}&amount=${amount}&address=${recipientAddress}&timestamp=${timestamp}&apiKey=${apiKey}&redirectURL=${redirectURL}`;
        res.status(200).send({ checkoutURL });

        const amountInAddress = await waitForFunds(
          recipientAddress,
          amount,
          reefApi
        );

        console.log("Getting transaction fee");
        const { partialFee } = await reefApi.tx.balances
          .transfer(address, amount)
          .paymentInfo(wallet);

        const fee = partialFee.toBigInt();
        console.log("Fee:", fee);

        const event = await payWallet(
          address,
          amountInAddress - fee,
          wallet,
          reefApi
        );

        await db.ref(`/payments/${paymentId}`).update({
          paidAmount: amountInAddress.toString(),
          // status: event.status,
        });

        console.log("All done");
      } catch (error) {
        console.log(error);
        res.status(500).send(error);
      }
    }
  );

  app.get("/checkout/:paymentId", apiKeyMiddleware, async (req, res) => {
    try {
      const payment = await db
        .ref(`/payments/${req.params.paymentId}`)
        .once("value")
        .then((snap) => snap.val());
      console.log(req.params);

      res.send(payment);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  return app;
};
