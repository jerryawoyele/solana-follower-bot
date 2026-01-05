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
  } else {
    console.log(`❌ Sell failed: ${result.error}`);
  }
}