import { startListener } from './listener';
import { initTelegramBot } from './telegramBot';
import { YOUR_WALLET } from './config';
import { trackedPositions } from './state';

console.clear(); // Clear console for clean start

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║            🎯 SMART FOLLOWER BOT - GMGN EDITION 🎯              ║
║                                                                  ║
║  Mirrors successful early buyers to maximize your profits       ║
║  Executes sells automatically via GMGN Telegram bot             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);

console.log(`📊 BOT CONFIGURATION`);
console.log(`${'═'.repeat(70)}`);
console.log(`   Your Wallet: ${YOUR_WALLET}`);
console.log(`   Polling Speed: 1 second (ultra-fast detection)`);
console.log(`   Message Delay: 5 seconds minimum between sells`);
console.log(`   Telegram Bot: GMGN Sniper Bot\n`);

console.log(`🎲 STRATEGY LOGIC`);
console.log(`${'═'.repeat(70)}`);
console.log(`   📈 SCENARIO A: Target dumps >90% instantly`);
console.log(`      → You sell 100% immediately (1 message)\n`);

console.log(`   📈 SCENARIO B: Target dumps >70% (you missed >50%)`);
console.log(`      → You sell 80% to catch up (1 message)`);
console.log(`      → When >90%, you sell 100% remaining (1 message)\n`);

console.log(`   📈 SCENARIO C: Normal gradual exit`);
console.log(`      → Target >50% sold → You sell 40% (1 message)`);
console.log(`      → Target >70% sold → You sell 40% (1 message)`);
console.log(`      → Target >90% sold → You sell 100% (1 message)\n`);

console.log(`🛡️ SAFETY FEATURES`);
console.log(`${'═'.repeat(70)}`);
console.log(`   ✓ Balance verification after each sell`);
console.log(`   ✓ Auto-stop if you exit position manually`);
console.log(`   ✓ Duplicate message prevention`);
console.log(`   ✓ 5-second cooldown between messages`);
console.log(`   ✓ Smart skip if token already sold\n`);

console.log(`${'═'.repeat(70)}\n`);

async function main() {
  try {
    // Initialize Telegram bot
    console.log(`🔄 Step 1: Initializing Telegram userbot...`);
    await initTelegramBot();
    console.log(`✅ Telegram userbot connected!\n`);

    // Start monitoring your wallet
    console.log(`🔄 Step 2: Starting wallet listener...`);
    startListener();
    console.log(`✅ Wallet listener active!\n`);

    console.log(`${'═'.repeat(70)}`);
    console.log(`🚀 BOT IS NOW RUNNING`);
    console.log(`${'═'.repeat(70)}\n`);
    console.log(`📌 Waiting for you to buy tokens...\n`);
    console.log(`💡 TIP: The bot will automatically:`);
    console.log(`   • Detect your token purchases`);
    console.log(`   • Find the first retail buyer`);
    console.log(`   • Monitor their exit strategy`);
    console.log(`   • Execute sells via GMGN\n`);

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

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down bot...');
      console.log(`✓ Stopped monitoring ${trackedPositions.size} position(s)`);
      console.log('✓ Telegram connection closed');
      console.log('✓ Goodbye! 👋\n');
      process.exit(0);
    });

  } catch (error: any) {
    console.error(`\n❌ BOT FAILED TO START`);
    console.error(`${'═'.repeat(70)}`);
    console.error(`Error: ${error.message}\n`);
    console.error(`💡 Common issues:`);
    console.error(`   • Missing .env variables`);
    console.error(`   • Invalid Telegram credentials`);
    console.error(`   • Network connectivity problems`);
    console.error(`   • Invalid Helius API key\n`);
    process.exit(1);
  }
}

main();

// ## 🎨 What You'll See:

// ### **On Startup:**

// ╔══════════════════════════════════════════════════════════════════╗
// ║                                                                  ║
// ║            🎯 SMART FOLLOWER BOT - GMGN EDITION 🎯              ║
// ║                                                                  ║
// ║  Mirrors successful early buyers to maximize your profits       ║
// ║  Executes sells automatically via GMGN Telegram bot             ║
// ║                                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝

// 📊 BOT CONFIGURATION
// ══════════════════════════════════════════════════════════════════════
//    Your Wallet: ABC123...
//    Polling Speed: 1 second (ultra-fast detection)
//    Message Delay: 5 seconds minimum between sells
//    Telegram Bot: GMGN Sniper Bot

// 🎲 STRATEGY LOGIC
// ══════════════════════════════════════════════════════════════════════
//    📈 SCENARIO A: Target dumps >90% instantly
//       → You sell 100% immediately (1 message)

//    📈 SCENARIO B: Target dumps >70% (you missed >50%)
//       → You sell 80% to catch up (1 message)
//       → When >90%, you sell 100% remaining (1 message)

//    📈 SCENARIO C: Normal gradual exit
//       → Target >50% sold → You sell 40% (1 message)
//       → Target >70% sold → You sell 40% (1 message)
//       → Target >90% sold → You sell 100% (1 message)

// 🛡️ SAFETY FEATURES
// ══════════════════════════════════════════════════════════════════════
//    ✓ Balance verification after each sell
//    ✓ Auto-stop if you exit position manually
//    ✓ Duplicate message prevention
//    ✓ 5-second cooldown between messages
//    ✓ Smart skip if token already sold

// ══════════════════════════════════════════════════════════════════════

// 🔄 Step 1: Initializing Telegram userbot...
// ✅ Telegram userbot connected!

// 🔄 Step 2: Starting wallet listener...
// ✅ Wallet listener active!

// ══════════════════════════════════════════════════════════════════════
// 🚀 BOT IS NOW RUNNING
// ══════════════════════════════════════════════════════════════════════

// 📌 Waiting for you to buy tokens...
// ```

// ### **When You Buy a Token:**
// ```
// 🆕 YOU BOUGHT: D12fZ1v9WK3VhpLGejb99GT6MzwPjGWLhjN8upQmpump
// 💰 Amount: 180821962.009959
// 🔗 TX: https://solscan.io/tx/...

// 🔍 Finding first buyer after dev for: D12fZ1v9...
// 🎯 Target wallet identified: 7ttyeJ57...
// 📊 Their initial buy: 57577058.141406 tokens

// ✅ Now tracking position: D12fZ1v9...
//    Your balance: 180821962.009959 tokens
//    Following: 7ttyeJ57...
//    Strategy: Smart exit based on target's sells
// ```

// ### **During Monitoring:**
// ```
// 📊 [D12fZ1v9...] Target sold: 45.3% | Your balance: 180821962.01
// 📊 [D12fZ1v9...] Target sold: 52.1% | Your balance: 180821962.01

// 🔔 Target sold >50%
//    → Selling 40%

// 🔥 EXECUTING SELL
//    Token: D12fZ1v9...
//    Amount: 40%
//    Reason: Target sold >50%
// ✅ Sent to GMGN: /sell D12fZ1v9WK3... 40%
//    ✓ Balance decreased: 180821962.01 → 108493177.21
// ```

// ### **Every 30 Seconds (Status Update):**
// ```
// 📊 Active Positions: 2
//    • D12fZ1v9... | Runtime: 3.5m | Sells: 1/3
//    • 8hYnQ2a4... | Runtime: 1.2m | Sells: 0/3
// ```

// ### **On Exit (Ctrl+C):**
// ```
// 🛑 Shutting down bot...
// ✓ Stopped monitoring 2 position(s)
// ✓ Telegram connection closed
// ✓ Goodbye! 👋