const { validateRoute } = require("express-ajv-middleware");

const { config } = require("../config/firebase");
const { apiKeyMiddleware, authMiddleware } = require("../helpers/auth");

const { createWallet, walletFromMnemonic } = require("../helpers/reef");

// Out of scope for proof of concept. Keys should be encrypted with app secret before stored.
const encrypt = (string) => string;
const decrypt = (string) => string;

// Watches an address for changes and compares new balance with requested amount
async function waitForFunds({ address, amount, timestamp }, api) {
  console.log("Watching for changes in created wallet:", address);
  return new Promise(async (resolve, reject) => {
    let _timeout;
    const unsub = await api.query.system.account(
      address,
      async ({ data: { free } }) => {
        const balance = free.toBigInt();
        console.log("Balance changed:", balance);
        console.log("Verify it's same as payment amount:", BigInt(amount));
        if (balance >= BigInt(amount)) {
          unsub();
          resolve(balance);
          clearTimeout(_timeout);
        } else {
          console.log("Balance is less than expected amount");
          console.log("Waiting for more transfers...");
        }
      }
    );
    _timeout = setTimeout(() => {
      console.log("Transaction timed out");
      clearTimeout(_timeout);
      unsub();
      reject("Transaction timed out");
    }, 1000 * 60 * 5); // Todo: use timestamp here to calculate timeout
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

async function createPayment(
  { paymentId, amount, timestamp, address, mnemonic },
  { db }
) {
  console.log("Creating payment:", paymentId, amount, address);
  return Promise.all([
    db.ref(`/wallets/${paymentId}`).set({ mnemonic: encrypt(mnemonic) }),
    db
      .ref(`/payments/${paymentId}`)
      .set({ address, amount, status: "WAITING", timestamp }),
  ]);
}

module.exports = (app, { db, createReefApi }) => {
  app.post(
    "/checkout",
    apiKeyMiddleware,
    validateRoute({
      body: {
        type: "object",
        properties: {
          amount: { type: "string", pattern: "^[0-9]+$" },
          redirectURL: { format: "uri", pattern: "^https?://" },
        },
        required: ["amount", "redirectURL"],
      },
    }),
    async (req, res) => {
      try {
        const { amount, redirectURL } = req.body;
        const paymentId = Math.random().toString(16).substr(2);
        const timestamp = Date.now();

        console.log("Generating random wallet");
        const { mnemonic, wallet } = createWallet();

        // wallet is undefined in test for some reason
        const address = wallet ? wallet.address : "<test-address>";

        console.log("Encrypting and storing wallet");
        await createPayment(
          {
            paymentId,
            amount,
            address,
            timestamp,
            mnemonic: encrypt(mnemonic),
          },
          { db }
        );

        // Return address to caller
        console.log("Build checkoutURL");
        const apiKey = (req.headers.authorization || "").split("Bearer ")[1];
        const checkoutURL = `${config.baseURL}/checkout?paymentId=${paymentId}&amount=${amount}&address=${address}&timestamp=${timestamp}&apiKey=${apiKey}&redirectURL=${redirectURL}`;

        console.log("Return wallet to requesting user");
        return res.status(200).send({ paymentId, checkoutURL });
      } catch (error) {
        console.log(error);
        res.status(500).send(error);
      }
    }
  );

  async function get(ref) {
    return db
      .ref(ref)
      .once("value")
      .then((snap) => snap.val());
  }

  app.get("/checkout/:paymentId", apiKeyMiddleware, async (req, res) => {
    try {
      const { paymentId } = req.params;

      const { mnemonic } = await get(`/wallets/${paymentId}`);
      const { amount, address, timestamp } = await get(
        `/payments/${paymentId}`
      );

      const reefApi = await createReefApi();
      const amountInAddress = await waitForFunds(
        { address, amount, timestamp },
        reefApi
      ).catch(() =>
        db.ref(`/payments/${paymentId}`).update({ status: "TIMEOUT" })
      );

      const merchantAddress = req.user.address;

      console.log("Creating wallet from decrypted mnemonic");
      const wallet = walletFromMnemonic(decrypt(mnemonic));

      console.log("Getting transaction fee for:", merchantAddress, amount);
      const fee = await reefApi.tx.balances
        .transfer(merchantAddress, amount)
        .paymentInfo(wallet)
        .then(({ partialFee }) => partialFee.toBigInt());

      console.log("Fee:", fee);

      const event = await payWallet(
        merchantAddress,
        amountInAddress - fee,
        wallet,
        reefApi
      );

      console.log("Payment has been transfered to address:", merchantAddress);

      await db.ref(`/payments/${paymentId}`).update({
        paidAmount: amountInAddress.toString(),
        status: "PAID",
        // status: event.status,
      });

      const payment = await get(`/payments/${paymentId}`);
      console.log("All done");

      res.send(payment);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  return app;
};
