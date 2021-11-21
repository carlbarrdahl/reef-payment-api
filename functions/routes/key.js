const crypto = require("crypto");
const { authMiddleware } = require("../helpers/auth");

function createKey() {
  return crypto.randomBytes(20).toString("hex");
}
/*
API key management

Merchants can create and view API key.

TODO: encrypt/decrypt key with app secret
*/
module.exports = (app, { db }) => {
  app.post("/key", authMiddleware, async (req, res) => {
    console.log("Creating API key for user:", req.user.uid);
    try {
      const key = createKey();

      await db.ref(`/users/${req.user.uid}/key`).set(key);
      await db.ref(`/tokens/${key}`).set(req.user.uid);

      res.status(201).send({ key });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  app.get("/key", authMiddleware, async (req, res) => {
    console.log("Getting API key for user: ", req.user.uid);
    try {
      const key = await db
        .ref(`/users/${req.user.uid}/key`)
        .once("value")
        .then((snap) => snap.val());

      return res.send({ key });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  return app;
};
