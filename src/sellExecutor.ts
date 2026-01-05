import { sendGMGNCommand } from './telegramBot';
import { VERBOSE } from './config';

/**
 * Execute a sell via Telegram GMGN bot
 */
export async function executeSell(
  tokenMint: string, 
  percentage: number, 
  reason: string
): Promise<void> {
  console.log(`\n🔥 EXECUTING SELL`);
  console.log(`   Token: ${tokenMint.slice(0, 8)}...`);
  console.log(`   Amount: ${percentage}%`);
  console.log(`   Reason: ${reason}`);

  const success = await sendGMGNCommand(tokenMint, percentage);

  if (success) {
    console.log(`✅ Sell command sent to GMGN successfully\n`);
  } else {
    console.log(`❌ Sell command failed\n`);
  }
}