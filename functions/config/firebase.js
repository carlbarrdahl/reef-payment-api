const admin = require("firebase-admin");

const isDev = process.env.NODE_ENV !== "production";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://reef-payment-api-default-rtdb.firebaseio.com",
});

const db = admin.database();
const auth = admin.auth();
const config = {
  baseURL: isDev ? "http://localhost:3000" : "https://reef-payment-api.web.app",
};

module.exports = { auth, db, config };
