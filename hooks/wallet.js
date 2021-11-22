import { createContext, useContext, useEffect, useState } from "react";

import { WsProvider } from "@polkadot/rpc-provider";
import { keyring } from "@polkadot/ui-keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { Provider, Signer } from "@reef-defi/evm-provider";

import config from "../config";
const SS58_FORMAT = 42;

export function useWeb3() {
  const [state, setState] = useState({});

  useEffect(() => {
    const {
      web3Enable,
      web3Accounts,
      web3FromAddress,
    } = require("@polkadot/extension-dapp");

    cryptoWaitReady()
      .then(async () => {
        keyring.loadAll({ ss58Format: SS58_FORMAT, type: "sr25519" });
        const provider = new Provider({
          provider: new WsProvider(config.network.networkURL),
        });

        provider.api.on("connected", () => console.log("api connected"));
        provider.api.on("disconnected", () => console.log("api disconnected"));
        provider.api.on("ready", async () => {
          console.log("api ready");
          try {
            const [ext] = await web3Enable("@reef-defi/payment-api");
            const [account] = await web3Accounts();

            console.log("account", account);
            console.log("ext", ext);
            const evmAddress =
              await provider.api.query.evmAccounts.evmAddresses(
                account.address
              );
            console.log("evmAddress", evmAddress);
            const wallet = new Signer(provider, account.address, ext.signer);

            console.log("wallet", wallet);

            const injector = await web3FromAddress(wallet._substrateAddress);
            console.log("injector", injector);
            setState({ wallet, api: provider.api, signer: injector.signer });
          } catch (error) {
            console.error("Unable to load chain", error);
          }
        });

        await provider.api.isReadyOrError;
      })
      .catch(console.error);
  }, []);

  async function transfer(address, amount) {
    const unsub = await state.api.tx.balances
      .transfer(address, amount)
      .signAndSend(
        state.wallet._substrateAddress,
        { signer: state.signer },
        (result) => {
          console.log(`Current status is ${result.status}`);
          if (result.status.isInBlock) {
            console.log(
              `Transaction included at blockHash ${result.status.asInBlock}`
            );
          } else if (result.status.isFinalized) {
            console.log(
              `Transaction finalized at blockHash ${result.status.asFinalized}`
            );
            unsub();
          }
        }
      );
  }

  return { ...state, transfer };
}

const Context = createContext({});

export const useWallet = () => useContext(Context);

export default function Web3Provider({ children }) {
  const state = useWeb3();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
