const { authMiddleware } = require("../helpers/auth");

/*
Wallet address management

Merchants store the wallet address they want funds transfered to.
*/
module.exports = (app, { db }) => {
  app.post("/wallet", authMiddleware, async (req, res) => {
    try {
      const { wallet } = req.body || {};
      console.log("Saving wallet address for user:", req.user.uid, wallet);
      if (!wallet) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      await db.ref(`/users/${req.user.uid}/wallet`).set(wallet);

      console.log("Wallet address saved");

      res.status(201).send({ wallet });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  app.get("/wallet", authMiddleware, async (req, res) => {
    try {
      console.log("Getting wallet address for user:", req.user.uid);
      const wallet = await db
        .ref(`/users/${req.user.uid}/wallet`)
        .once("value");

      return res.send({ wallet: wallet.val() });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  return app;
};
