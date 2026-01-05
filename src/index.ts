import { startListener } from './listener';
import { YOUR_WALLET } from './config';
import { trackedPositions } from './state';

console.clear();

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         🎯 SMART FOLLOWER BOT - JUPITER EDITION 🎯              ║
║                                                                  ║
║  Mirrors successful early buyers to maximize your profits       ║
║  Executes sells automatically via Jupiter aggregator            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);

console.log(`📊 BOT CONFIGURATION`);
console.log(`${'═'.repeat(70)}`);
console.log(`   Your Wallet: ${YOUR_WALLET}`);
console.log(`   Execution: Jupiter V6 API (Direct on-chain)`);
console.log(`   Polling Speed: 1 second (ultra-fast detection)`);
console.log(`   Slippage: 5% (adjustable in config)\n`);

console.log(`🎲 STRATEGY LOGIC`);
console.log(`${'═'.repeat(70)}`);
console.log(`   📈 SCENARIO A: Target dumps >90% instantly`);
console.log(`      → You sell 100% immediately\n`);

console.log(`   📈 SCENARIO B: Target dumps >70% (you missed >50%)`);
console.log(`      → You sell 80% to catch up`);
console.log(`      → When >90%, you sell 100% remaining\n`);

console.log(`   📈 SCENARIO C: Normal gradual exit`);
console.log(`      → Target >50% sold → You sell 40%`);
console.log(`      → Target >70% sold → You sell 40%`);
console.log(`      → Target >90% sold → You sell 100%\n`);

console.log(`🛡️ SAFETY FEATURES`);
console.log(`${'═'.repeat(70)}`);
console.log(`   ✓ Balance verification after each sell`);
console.log(`   ✓ Auto-stop if you exit position manually`);
console.log(`   ✓ Direct on-chain execution (no bot delays)`);
console.log(`   ✓ Jupiter best price routing`);
console.log(`   ✓ Smart skip if token already sold\n`);

console.log(`${'═'.repeat(70)}\n`);

async function main() {
  try {
    console.log(`🔄 Starting wallet listener...`);
    startListener();
    console.log(`✅ Wallet listener active!\n`);

    console.log(`${'═'.repeat(70)}`);
    console.log(`🚀 BOT IS NOW RUNNING`);
    console.log(`${'═'.repeat(70)}\n`);
    console.log(`📌 Waiting for you to buy tokens...\n`);

    // Show active positions every 30 seconds
    setInterval(() => {
      const activePositions = trackedPositions.size;
      if (activePositions > 0) {
        console.log(`\n📊 Active Positions: ${activePositions}`);
        for (const [mint, position] of trackedPositions.entries()) {
          const runtime = ((Date.now() - position.startTime) / 1000 / 60).toFixed(1);
          const sellsExecuted = position.executedSells.size;
          console.log(`   • ${mint.slice(0, 8)}... | Runtime: ${runtime}m | Sells: ${sellsExecuted}/3`);
        }
        console.log('');
      }
    }, 30000);

    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down bot...');
      console.log(`✓ Stopped monitoring ${trackedPositions.size} position(s)`);
      console.log('✓ Goodbye! 👋\n');
      process.exit(0);
    });

  } catch (error: any) {
    console.error(`\n❌ BOT FAILED TO START`);
    console.error(`${'═'.repeat(70)}`);
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();