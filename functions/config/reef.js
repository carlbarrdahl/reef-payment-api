const { WsProvider } = require("@polkadot/rpc-provider");
const { Provider } = require("@reef-defi/evm-provider");

async function createReefApi() {
  const provider = new Provider({
    provider: new WsProvider("wss://rpc-testnet.reefscan.com/ws"),
  });
  await provider.api.isReadyOrError;

  return provider.api;
}

module.exports = { createReefApi };
