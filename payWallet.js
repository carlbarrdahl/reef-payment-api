const { ApiPromise } = require("@polkadot/api");
const { WsProvider } = require("@polkadot/rpc-provider");
const { options } = require("@reef-defi/api");
const { Keyring } = require("@polkadot/api");
const { Provider } = require("@reef-defi/evm-provider");

const { mnemonicGenerate } = require("@polkadot/util-crypto");

function createWallet() {
  const keyring = new Keyring({ type: "sr25519" });
  //   const seed = mnemonicGenerate();
  const seed =
    "group cram clay fiction confirm sand banner life elbow witness hollow autumn";

  return keyring.addFromMnemonic(seed);
}

async function payWallet(amount, address, wallet, provider) {
  return new Promise(async (resolve, reject) => {
    const unsub = await provider.api.tx.balances
      .transfer(address, amount)
      .signAndSend(wallet, async (result) => {
        console.log(`Current status is ${result.status}`);
        if (result.status.isInBlock) {
          console.log(`tx included at blockHash ${result.status.asInBlock}`);
        } else if (result.status.isFinalized) {
          console.log(`tx finalized at blockHash ${result.status.asFinalized}`);
          resolve(result);
          unsub();
        }
      });
  });
}

async function main() {
  const provider = new Provider({
    provider: new WsProvider("wss://rpc-testnet.reefscan.com/ws"),
  });
  await provider.api.isReadyOrError;
  const wallet = createWallet();

  console.log("Initiating payment from:", wallet.address);

  const address =
    process.env.REEF_ADDRESS ||
    "5GCcgnwdLhwq3HmjsRaotPY5PuF8ivVcRTtP75JJPk7uzTMJ";
  const amount = process.env.REEF_AMOUNT || "";

  console.log("Paying wallet:", address, amount);
  payWallet(amount, address, wallet, provider).then((res) => {
    console.log(
      "Payment transfered successfully!",
      JSON.stringify(res, null, 2)
    );
    process.exit();
  });
}

main().then(console.log).catch(console.error);
