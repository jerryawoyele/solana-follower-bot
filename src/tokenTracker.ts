import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_HTTP, MORALIS_API_KEY, VERBOSE, YOUR_WALLET, TIMEOUT_MINUTES } from "./config";
import { trackedPositions, TrackedPosition } from "./state";
import { executeSell } from "./sellExecutor";
import fetch from "cross-fetch";

const conn = new Connection(RPC_HTTP, "confirmed");
const POLL_INTERVAL_MS = 1000; // 1 second polling
const MIN_MESSAGE_DELAY_MS = 5000; // 5 seconds between messages

/**
 * Handle when YOU buy a token
 */
export async function handleYourBuy(mint: string, yourAmount: number) {
  // CRITICAL: Check if already tracking this token
  if (trackedPositions.has(mint)) {
    console.log(`⚠️ Already tracking ${mint} - skipping duplicate\n`);
    return;
  }

  try {
    console.log(`🔍 Finding first buyer after dev for: ${mint}...`);

    // Step 1: Get first retail buyer
    const firstBuyer = await getFirstRetailBuyer(mint);

    if (!firstBuyer) {
      console.log(`⚠️ Could not identify first buyer for ${mint}, selling position.`);
      await executeSell(mint, 100, "Couldn't find the first buyer"); // Sell 100% of the position
      return;
    }

    console.log(`🎯 Target wallet identified: ${firstBuyer.wallet}`);
    console.log(`📊 Their initial buy: ${firstBuyer.amount} tokens\n`);

    // Step 2: Get YOUR initial balance
    const yourInitialBalance = await getYourTokenBalance(mint);
    if (!yourInitialBalance || yourInitialBalance === 0) {
      console.log(`⚠️ You don't hold this token anymore\n`);
      return;
    }

    // Step 3: Track this position
    const position: TrackedPosition = {
      tokenMint: mint,
      targetWallet: firstBuyer.wallet,
      targetInitialBalance: firstBuyer.amount,
      yourInitialBalance: yourInitialBalance,
      executedSells: new Set(),
      startTime: Date.now(),
      lastChecked: Date.now()
    };

    trackedPositions.set(mint, position);

    console.log(`✅ Now tracking position: ${mint}`);
    console.log(`   Your balance: ${yourInitialBalance} tokens`);
    console.log(`   Following: ${firstBuyer.wallet.slice(0, 8)}...`);
    console.log(`   Strategy: Smart exit based on target's sells\n`);

    // Step 4: Start monitoring
    monitorPosition(mint);

  } catch (error: any) {
    console.error(`❌ Error handling buy for ${mint}:`, error.message);
  }
}

/**
 * Get the first retail buyer (2nd swap after dev)
 */
async function getFirstRetailBuyer(mint: string): Promise<{ wallet: string; amount: number } | null> {
  const MAX_RETRIES = 30;
  const RETRY_DELAY_MS = 2000; // 2 seconds

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(
        `https://solana-gateway.moralis.io/token/mainnet/${mint}/swaps?order=ASC&transactionTypes=buy&limit=10`, // Fetch more swaps
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': MORALIS_API_KEY
          }
        }
      );

      if (!response.ok) {
        console.log(`   - Moralis API request failed (attempt ${i + 1}/${MAX_RETRIES}). Status: ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }

      const data = await response.json();

      if (data.result && data.result.length > 1) {
        // Try to find the first buyer that isn't us
        for (let j = 1; j < data.result.length; j++) {
          const buyer = data.result[j];
          if (buyer.walletAddress.toLowerCase() !== YOUR_WALLET.toLowerCase()) {
            return {
              wallet: buyer.walletAddress,
              amount: parseFloat(buyer.bought.amount)
            };
          }
        }
        console.log(`   - Could only find your own buys so far.`);
      } else {
        console.log(`   - Not enough swap data yet (found ${data.result?.length || 0} buys). Retrying...`);
      }

    } catch (error: any) {
      console.log(`   - Error fetching swaps (attempt ${i + 1}/${MAX_RETRIES}):`, error.message);
    }
    
    if (i < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  return null;
}

/**
 * Get YOUR current token balance
 */
async function getYourTokenBalance(mint: string): Promise<number> {
  try {
    const yourWalletPubkey = new PublicKey(YOUR_WALLET);
    const mintPubkey = new PublicKey(mint);

    const accounts = await conn.getParsedTokenAccountsByOwner(
      yourWalletPubkey,
      { mint: mintPubkey }
    );

    if (!accounts.value.length) return 0;

    return accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;

  } catch (error) {
    return 0;
  }
}

/**
 * Wait for YOUR balance to decrease (confirming sell executed)
 */
async function waitForYourBalanceToDecrease(
  mint: string, 
  previousBalance: number, 
  timeoutMs: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const currentBalance = await getYourTokenBalance(mint);
    
    if (currentBalance < previousBalance) {
      console.log(`   ✓ Balance decreased: ${previousBalance} → ${currentBalance}`);
      return true;
    }

    // Check every 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`   ⚠️ Balance didn't decrease after ${timeoutMs/1000}s`);
  return false;
}

/**
 * Monitor a position continuously
 */
async function monitorPosition(mint: string) {
  const position = trackedPositions.get(mint);
  if (!position) return;

  let isExited = false;
  let lastMessageTime = 0;

  const checkInterval = setInterval(async () => {
    // Safety check
    if (!trackedPositions.has(mint) || isExited) {
      clearInterval(checkInterval);
      return;
    }

    try {
      // Check if YOU still hold the token
      const yourCurrentBalance = await getYourTokenBalance(mint);
      
      if (yourCurrentBalance === 0) {
        console.log(`\n⚠️ You no longer hold ${mint.slice(0, 8)}...`);
        console.log(`   Position fully exited\n`);
        isExited = true;
        clearInterval(checkInterval);
        trackedPositions.delete(mint);
        return;
      }

      // TIMEOUT LOGIC
      const timeSinceStart = Date.now() - position.startTime;
      if (timeSinceStart > TIMEOUT_MINUTES * 60 * 1000) {
        const targetCurrentBalanceCheck = await getWalletTokenBalance(position.targetWallet, mint);
        const soldPercentageCheck = ((position.targetInitialBalance - (targetCurrentBalanceCheck || 0)) / position.targetInitialBalance) * 100;

        if (soldPercentageCheck === 0) {
          console.log(`\n🚨 TIMEOUT REACHED! Target has not sold after ${TIMEOUT_MINUTES} minutes.`);
          console.log(`   → Selling 100% as a safety measure.\n`);
          
          await executeSell(mint, 100, `Timeout after ${TIMEOUT_MINUTES} mins`);
          await waitForYourBalanceToDecrease(mint, yourCurrentBalance);
          
          isExited = true;
          clearInterval(checkInterval);
          trackedPositions.delete(mint);
          return;
        }
      }

      // Get target wallet's current balance
      const targetCurrentBalance = await getWalletTokenBalance(position.targetWallet, mint);
      
      if (targetCurrentBalance === null) {
        return;
      }

      const soldPercentage = ((position.targetInitialBalance - targetCurrentBalance) / position.targetInitialBalance) * 100;

      if (VERBOSE) {
        console.log(`📊 [${mint.slice(0, 8)}...] Target sold: ${soldPercentage.toFixed(1)}% | Your balance: ${yourCurrentBalance.toFixed(2)}`);
      }

      // Enforce minimum time between messages
      const timeSinceLastMessage = Date.now() - lastMessageTime;
      if (timeSinceLastMessage < MIN_MESSAGE_DELAY_MS) {
        return; // Too soon, skip this check
      }

      // SMART SELL LOGIC

      // SCENARIO 1: Target already dumped >90% (instant exit)
      if (soldPercentage >= 90 && position.executedSells.size === 0) {
        console.log(`\n🚨 TARGET DUMPED >90% INSTANTLY!`);
        console.log(`   → Selling 100% immediately\n`);
        
        await executeSell(mint, 100, "Target dumped >90% instantly");
        lastMessageTime = Date.now();
        position.executedSells.add(1);
        position.executedSells.add(2);
        position.executedSells.add(3);
        
        // Wait for balance to decrease
        await waitForYourBalanceToDecrease(mint, yourCurrentBalance);
        
        isExited = true;
        clearInterval(checkInterval);
        trackedPositions.delete(mint);
        return;
      }

      // SCENARIO 2: Target dumped >70% but you haven't sold yet
      if (soldPercentage >= 70 && soldPercentage < 90 && position.executedSells.size === 0) {
        console.log(`\n🚨 TARGET SOLD >70% (you missed >50% threshold)`);
        console.log(`   → Selling 80% to catch up\n`);
        
        await executeSell(mint, 80, "Target sold >70% (catching up)");
        lastMessageTime = Date.now();
        position.executedSells.add(1);
        position.executedSells.add(2);
        
        // Wait for balance to decrease
        const decreased = await waitForYourBalanceToDecrease(mint, yourCurrentBalance);
        if (!decreased) return;
        
        // Continue to watch for >90%
        return;
      }

      // After selling 80%, wait for >90% to sell remaining 100%
      if (soldPercentage >= 90 && position.executedSells.size === 2 && !position.executedSells.has(3)) {
        console.log(`\n🔔 Target sold >90%`);
        console.log(`   → Selling 100% (remaining)\n`);
        
        await executeSell(mint, 100, "Target sold >90%");
        lastMessageTime = Date.now();
        position.executedSells.add(3);
        
        await waitForYourBalanceToDecrease(mint, yourCurrentBalance);
        
        isExited = true;
        clearInterval(checkInterval);
        trackedPositions.delete(mint);
        return;
      }

      // SCENARIO 3: Normal flow (target selling gradually)

      // 1st SELL: >50%
      if (soldPercentage >= 50 && !position.executedSells.has(1)) {
        console.log(`\n🔔 Target sold >50%`);
        console.log(`   → Selling 40%\n`);
        
        await executeSell(mint, 40, "Target sold >50%");
        lastMessageTime = Date.now();
        position.executedSells.add(1);
        
        // Wait for balance to decrease before allowing next sell
        const decreased = await waitForYourBalanceToDecrease(mint, yourCurrentBalance);
        if (!decreased) return;
      }

      // 2nd SELL: >70%
      if (soldPercentage >= 70 && position.executedSells.has(1) && !position.executedSells.has(2)) {
        console.log(`\n🔔 Target sold >70%`);
        console.log(`   → Selling another 40%\n`);
        
        await executeSell(mint, 40, "Target sold >70%");
        lastMessageTime = Date.now();
        position.executedSells.add(2);
        
        const decreased = await waitForYourBalanceToDecrease(mint, yourCurrentBalance);
        if (!decreased) return;
      }

      // 3rd SELL: >90%
      if (soldPercentage >= 90 && position.executedSells.has(2) && !position.executedSells.has(3)) {
        console.log(`\n🔔 Target sold >90%`);
        console.log(`   → Selling 100% (all remaining)\n`);
        
        await executeSell(mint, 100, "Target sold >90%");
        lastMessageTime = Date.now();
        position.executedSells.add(3);
        
        await waitForYourBalanceToDecrease(mint, yourCurrentBalance);
        
        console.log(`✅ Position fully exited: ${mint}\n`);
        isExited = true;
        clearInterval(checkInterval);
        trackedPositions.delete(mint);
        return;
      }

      position.lastChecked = Date.now();

    } catch (error: any) {
      console.error(`❌ Error monitoring ${mint}:`, error.message);
    }
  }, POLL_INTERVAL_MS);

  (position as any).intervalId = checkInterval;
}

/**
 * Get wallet's current token balance
 */
async function getWalletTokenBalance(wallet: string, mint: string): Promise<number | null> {
  try {
    const walletPubkey = new PublicKey(wallet);
    const mintPubkey = new PublicKey(mint);

    const accounts = await conn.getParsedTokenAccountsByOwner(
      walletPubkey,
      { mint: mintPubkey }
    );

    if (!accounts.value.length) return 0;

    return accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;

  } catch (error) {
    return null;
  }
}

// ## ✅ What Changed:

// ### **1. Minimum 5-Second Delay Between Messages**
// - Tracks `lastMessageTime`
// - Won't send another message until 5+ seconds have passed

// ### **2. Smart Scenario Detection**

// **Scenario A:** Target dumps >90% instantly
// ```
// → Send /sell <token> 100% (ONE message)
// ```

// **Scenario B:** Target dumps >70% (but you haven't sold yet)
// ```
// → Send /sell <token> 80% (catch up)
// → Wait for >90%, then send /sell <token> 100%
// (TWO messages total)
// ```

// **Scenario C:** Normal gradual exit
// ```
// >50% → Send /sell <token> 40%
// >70% → Send /sell <token> 40%
// >90% → Send /sell <token> 100%
// (THREE messages total)