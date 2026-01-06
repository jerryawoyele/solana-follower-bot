import { sellTokens } from './jupiterSell';
import { trackedPositions } from './state';
import { getYourTokenBalance } from './tokenTracker'; // Import the balance checker

/**
 * Execute a sell using Jupiter
 */
export async function executeSell(
  tokenMint: string, 
  percentage: number, 
  reason: string
): Promise<void> {
  const position = trackedPositions.get(tokenMint);
  if (position && position.executedSells.has(percentage)) {
    console.log(`   - Already executed sell for reason: ${reason} at ${percentage}%`);
    return;
  }

  let sellSuccess = false;
  while (!sellSuccess) {
    // Check balance before attempting to sell
    const currentBalance = await getYourTokenBalance(tokenMint);
    if (currentBalance === 0) {
      console.log(`   - No balance of ${tokenMint.slice(0,8)}... found. Stopping sell attempts.`);
      break; // Exit the loop if there's no balance
    }

    const result = await sellTokens(tokenMint, percentage, reason);
    
    if (result.success) {
      console.log(`✅ Sell executed successfully`);
      if (result.signature) {
        console.log(`   Signature: ${result.signature}`);
      }
      if (position) {
        position.executedSells.add(percentage);
      }
      sellSuccess = true;
      // Wait for 5 seconds to allow the transaction to propagate
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log(`❌ Sell failed: ${result.error}. Retrying...`);
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}