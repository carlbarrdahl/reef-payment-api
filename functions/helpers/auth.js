const { auth, db } = require("../config/firebase");

// For Merchant admin UI
async function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || "").split("Bearer ")[1];
    req.user = await auth.verifyIdToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

async function apiKeyMiddleware(req, res, next) {
  try {
    // Validate api key token
    console.log("Verifying API key");
    const token = (req.headers.authorization || "").split("Bearer ")[1];
    const uid = await db
      .ref(`/tokens/${token}`)
      .once("value")
      .then((snap) => snap.val());

    console.log("API key found for merchant:", uid);
    if (!uid) {
      return res.status(401).send({ error: "Invalid API key" });
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authMiddleware, apiKeyMiddleware };
