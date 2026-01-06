import { sellTokens } from './jupiterSell';
import { trackedPositions } from './state';

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