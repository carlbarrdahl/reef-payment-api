const { Keyring } = require("@polkadot/api");
const { mnemonicGenerate } = require("@polkadot/util-crypto");

module.exports.createWallet = function createWallet() {
  const keyring = new Keyring({ type: "sr25519" });
  const mnemonic = mnemonicGenerate();
  const wallet = keyring.addFromMnemonic(mnemonic);

  return { mnemonic, wallet };
};

module.exports.walletFromMnemonic = function walletFromMnemonic(mnemonic) {
  const keyring = new Keyring({ type: "sr25519" });
  return keyring.addFromMnemonic(mnemonic);
};
