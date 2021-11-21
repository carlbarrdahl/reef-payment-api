const functions = require("firebase-functions");

const express = require("express");
const cors = require("cors");
const { BadRequest } = require("throwable-http-errors");
const app = express();
app.use(cors({ origin: true }));

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

const { auth, db, config } = require("./config/firebase");
const { createReefApi } = require("./config/reef");

const context = { auth, db, config, createReefApi };

require("./routes/key")(app, context);
require("./routes/wallet")(app, context);
require("./routes/checkout")(app, context);

app.use((error, request, response, next) => {
  console.log("ERROR", error, error.message, error.toString());
  // Check the error is a validation error
  if (error instanceof BadRequest) {
    // Handle the error
    response.status(400).send(error.message);
    next();
  } else {
    // Pass error on if not a validation error
    next(error);
  }
});

exports.api = functions
  .runWith({ timeoutSeconds: 3 * 60, memory: "1GB" })
  .https.onRequest(app);
