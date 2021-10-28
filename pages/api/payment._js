import { verifyIdToken } from "next-firebase-auth";
import initAuth from "../../utils/initAuth";
import { createRandomWallet } from "../../utils/wallet";

initAuth();

async function verifyAPIKey() {}

const handler = async (req, res) => {
  const token = req.headers.authorization;
  const { amount, webhookURL } = req.body || {};
  if (isNaN(amount) || !webhookURL) {
    return res.status(400).json({ error: "Invalid amount or webhookURL" });
  }

  console.log("incoming payment request:", amount, webhookURL);
  try {
    console.log("verifying api key...");
    await verifyIdToken(token);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(403).json({ error: "Not authorized" });
  }

  console.log("creating wallet...");
  const wallet = createRandomWallet();
  console.log("wallet created:", wallet.address);

  const unsub = await api.tx.balances
    .transfer(wallet.address, 12345)
    .signAndSend(alice, (result) => {
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
    });

  return res.status(200).json({ address: wallet.address });
};

export default handler;
