import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_HTTP, RPC_WS, YOUR_WALLET, VERBOSE } from "./config";
import { handleYourBuy } from "./tokenTracker";

const connection = new Connection(RPC_HTTP, {
  wsEndpoint: RPC_WS,
  commitment: "confirmed"
});

const WSOL = "So11111111111111111111111111111111111111112";

export function startListener() {
  console.log("🎧 Starting listener for your wallet...");
  console.log(`👀 Monitoring: ${YOUR_WALLET}\n`);

  const walletPubkey = new PublicKey(YOUR_WALLET);

  connection.onLogs(
    walletPubkey,
    async (logs) => {
      if (logs.err) return;

      if (VERBOSE) console.log(`📥 Transaction detected: ${logs.signature}`);

      // Fetch transaction details
      const tx = await connection.getParsedTransaction(logs.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
      });

      if (!tx || !tx.meta) return;

      // Check for token acquisitions
      const postBalances = tx.meta.postTokenBalances;
      if (!postBalances || postBalances.length === 0) return;

      for (const balance of postBalances) {
        if (!balance.owner || !balance.uiTokenAmount.uiAmount) continue;

        const mint = balance.mint;

        // Skip WSOL
        if (mint === WSOL) {
          if (VERBOSE) console.log(`⏭️ Skipping WSOL`);
          continue;
        }

        // Check if this is a NEW acquisition
        const preBalance = tx.meta.preTokenBalances?.find(
          (b: any) => b.accountIndex === balance.accountIndex
        );

        const isNewBuy = !preBalance || 
          (preBalance.uiTokenAmount.uiAmount ?? 0) < balance.uiTokenAmount.uiAmount;

        if (isNewBuy) {
          console.log(`\n🆕 YOU BOUGHT: ${mint}`);
          console.log(`💰 Amount: ${balance.uiTokenAmount.uiAmount}`);
          console.log(`🔗 TX: https://solscan.io/tx/${logs.signature}\n`);

          // Start tracking this position
          await handleYourBuy(mint, balance.uiTokenAmount.uiAmount);
        }
      }
    },
    "confirmed"
  );

  console.log(`✅ Listener active\n`);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping listener...');
    process.exit(0);
  });
}