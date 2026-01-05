import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { createJupiterApiClient, QuoteGetRequest, QuoteResponse } from "@jup-ag/api";
import bs58 from "bs58";
import { RPC_HTTP, PRIVATE_KEY, SLIPPAGE_BPS, JUPITER_API_KEY, SELL_PRIORITY_FEE_MICRO_LAMPORTS } from "./config";

const connection = new Connection(RPC_HTTP, "confirmed");
const jupiterQuoteApi = createJupiterApiClient({ basePath: JUPITER_API_KEY ? `https://quote-api.jup.ag/v6?token=${JUPITER_API_KEY}` : undefined });

const WSOL = "So11111111111111111111111111111111111111112";

/**
 * Get your token balance
 */
async function getTokenBalance(mint: string, walletPubkey: PublicKey): Promise<{ amount: string; uiAmount: number }> {
  const accounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
    mint: new PublicKey(mint)
  });

  if (!accounts.value.length) {
    return { amount: "0", uiAmount: 0 };
  }

  const tokenAmount = accounts.value[0].account.data.parsed.info.tokenAmount;
  return {
    amount: tokenAmount.amount,
    uiAmount: tokenAmount.uiAmount
  };
}

/**
 * Sell a percentage of your token holdings
 */
export async function sellTokens(
  mint: string,
  percentage: number,
  reason: string
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log(`\n🔥 EXECUTING JUPITER SELL`);
    console.log(`   Token: ${mint.slice(0, 8)}...`);
    console.log(`   Amount: ${percentage}%`);
    console.log(`   Reason: ${reason}`);

    // Load wallet from private key
    const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    console.log(`   Wallet: ${wallet.publicKey.toBase58()}`);

    // Get current balance
    const balance = await getTokenBalance(mint, wallet.publicKey);

    if (balance.uiAmount === 0) {
      console.log(`   ⚠️ No balance to sell\n`);
      return { success: false, error: "No balance" };
    }

    console.log(`   Current balance: ${balance.uiAmount} tokens`);

    // Calculate amount to sell
    let amountToSell: string;
    if (percentage === 100) {
      // Sell everything
      amountToSell = balance.amount;
    } else {
      // Sell percentage
      const amountBigInt = BigInt(balance.amount);
      const sellAmount = (amountBigInt * BigInt(percentage)) / BigInt(100);
      amountToSell = sellAmount.toString();
    }

    console.log(`   Selling: ${amountToSell} (raw amount)`);

    // Step 1: Get quote from Jupiter
    console.log(`   🔄 Getting Jupiter quote...`);
    
    const quoteRequest: QuoteGetRequest = {
      inputMint: mint,
      outputMint: WSOL,
      amount: parseInt(amountToSell),
      slippageBps: SLIPPAGE_BPS,
      onlyDirectRoutes: false,
      asLegacyTransaction: false
    };

    const quote: QuoteResponse = await jupiterQuoteApi.quoteGet(quoteRequest);

    if (!quote || !quote.outAmount) {
      console.log(`   ❌ No route found\n`);
      return { success: false, error: "No route" };
    }

    const expectedOutput = (Number(quote.outAmount) / 1e9).toFixed(6);
    console.log(`   ✨ Expected output: ${expectedOutput} SOL`);
    console.log(`   📊 Price impact: ${quote.priceImpactPct}%`);

    // Step 2: Get swap transaction
    console.log(`   ⚡ Building swap transaction...`);
    
    const swapResult = await jupiterQuoteApi.swapPost({
      swapRequest: {
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        // Add priority fee to increase transaction success rate
        computeUnitPriceMicroLamports: SELL_PRIORITY_FEE_MICRO_LAMPORTS,
      }
    });

    // Step 3: Deserialize and sign transaction
    const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    
    transaction.sign([wallet]);

    // Step 4: Send transaction
    console.log(`   📤 Sending transaction...`);
    
    const rawTransaction = transaction.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });

    console.log(`   ✅ Transaction sent: ${signature}`);
    console.log(`   🔗 https://solscan.io/tx/${signature}`);
    console.log(`   💵 Expected: ${expectedOutput} SOL\n`);

    // Optional: Wait for confirmation in background (non-blocking)
    connection.confirmTransaction(signature, 'confirmed').then((result) => {
      if (result.value.err) {
        console.log(`   ⚠️ Transaction ${signature.slice(0, 8)}... failed on-chain`);
      } else {
        console.log(`   ✅ Transaction ${signature.slice(0, 8)}... confirmed!`);
      }
    }).catch(() => {
      console.log(`   ⚠️ Could not confirm ${signature.slice(0, 8)}...`);
    });

    return { success: true, signature };

  } catch (error: any) {
    console.error(`   ❌ Sell failed: ${error.message}\n`);
    
    if (error.message?.includes("429")) {
      return { success: false, error: "Rate limited" };
    } else if (error.message?.includes("slippage")) {
      return { success: false, error: "Slippage exceeded" };
    } else if (error.message?.includes("insufficient")) {
      return { success: false, error: "Insufficient balance or SOL" };
    }
    
    return { success: false, error: error.message };
  }
}