const { ApiPromise } = require("@polkadot/api");
const { WsProvider } = require("@polkadot/rpc-provider");
const { options } = require("@reef-defi/api");
const { Keyring } = require("@polkadot/api");

const { Provider } = require("@reef-defi/evm-provider");

const { mnemonicGenerate } = require("@polkadot/util-crypto");

const config = require("./config");
function createRandomWallet() {
  const keyring = new Keyring({ type: "sr25519" });
  return keyring.addFromMnemonic(mnemonicGenerate());
}

function createTestWallets() {
  const keyring = new Keyring({ type: "sr25519" });

  const seedAlice =
    "group cram clay fiction confirm sand banner life elbow witness hollow autumn";
  const seedBob =
    "light fall visa reduce derive horror clump alcohol legend donor bronze above";
  // const seed = mnemonicGenerate();
  // console.log(seed);
  return [keyring.addFromMnemonic(seedAlice), keyring.addFromMnemonic(seedBob)];
}

async function main() {
  const provider = new Provider({
    provider: new WsProvider("wss://rpc-testnet.reefscan.com/ws"),
  });
  await provider.api.isReadyOrError;
  const [, tempWallet] = createTestWallets();

  console.log(tempWallet.address);

  const asd = await provider.api.query.system.account(
    "5GCcgnwdLhwq3HmjsRaotPY5PuF8ivVcRTtP75JJPk7uzTMJ"
  );

  //   const unsub = await provider.api.query.system.account(
  //     "5GCcgnwdLhwq3HmjsRaotPY5PuF8ivVcRTtP75JJPk7uzTMJ" || tempWallet.address,
  //     ({ data }) => {
  //       console.log(data.toJSON());
  //       console.log("free", data.free.toHuman());

  //       //   // Calculate the delta
  //       //   const change = currentFree.sub(previousFree);

  //       //   // Only display positive value changes (Since we are pulling `previous` above already,
  //       //   // the initial balance change will also be zero)
  //       //   if (!change.isZero()) {
  //       //     console.log(`New balance change of ${change}, nonce ${currentNonce}`);

  //       //     previousFree = currentFree;
  //       //     previousNonce = currentNonce;
  //       //   }
  //     }
  //   );

  //   provider.api.query.system.events(async (events) => {
  //     console.log(events);
  //   });
}

main().then(console.log).catch(console.error);
