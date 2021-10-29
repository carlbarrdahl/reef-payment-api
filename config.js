const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  apiURL: isDev
    ? "http://localhost:5001/reef-payment-api/us-central1"
    : "https://us-central1-reef-payment-api.cloudfunctions.net",
  network: {
    tokenSymbol: "REEF",
    tokenDecimals: 18,
    networkURL: "wss://rpc-testnet.reefscan.com/ws",
    explorerURL: "https://testnet.reefscan.com",
    backendWs: "wss://testnet.reefscan.com/api/v3",
    backendHttp: "https://testnet.reefscan.com/api/v3",
  },
  firebase: {
    apiKey: "AIzaSyDXlgEVe3VRXqhBVUHPPD70liumiBJjf5Q",
    authDomain: "reef-payment-api.firebaseapp.com",
    databaseURL: "https://reef-payment-api-default-rtdb.firebaseio.com",
    projectId: "reef-payment-api",
    storageBucket: "reef-payment-api.appspot.com",
    messagingSenderId: "27230868962",
    appId: "1:27230868962:web:50b27e578807f9d47615bb",
  },
};
