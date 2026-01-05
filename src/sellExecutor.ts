import { sellTokens } from './jupiterSell';

/**
 * Execute a sell using Jupiter
 */
export async function executeSell(
  tokenMint: string, 
  percentage: number, 
  reason: string
): Promise<void> {
  const result = await sellTokens(tokenMint, percentage, reason);
  
  if (result.success) {
    console.log(`✅ Sell executed successfully`);
    if (result.signature) {
      console.log(`   Signature: ${result.signature}`);
    }
    // Wait for 5 seconds to allow the transaction to propagate
    await new Promise(resolve => setTimeout(resolve, 5000));
  } else {
    console.log(`❌ Sell failed: ${result.error}`);
  }
}