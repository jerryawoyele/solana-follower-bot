import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { TELEGRAM_CONFIG } from './config';
import * as readline from 'readline';

let client: TelegramClient | null = null;

/**
 * Initialize Telegram userbot
 */
export async function initTelegramBot() {
  console.log('📱 Initializing Telegram userbot...');

  const session = new StringSession(''); // Empty for first time, save after login

  client = new TelegramClient(
    session,
    TELEGRAM_CONFIG.apiId,
    TELEGRAM_CONFIG.apiHash,
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: async () => TELEGRAM_CONFIG.phoneNumber,
    password: async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      return new Promise((resolve) => {
        rl.question('Enter 2FA password: ', (answer) => {
          rl.close();
          resolve(answer);
        });
      });
    },
    phoneCode: async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      return new Promise((resolve) => {
        rl.question('Enter the code you received: ', (answer) => {
          rl.close();
          resolve(answer);
        });
      });
    },
    onError: (err) => console.error('Telegram error:', err),
  });

  console.log('✅ Telegram userbot connected\n');
  console.log('💾 Save this session string for future use:');
  console.log(client.session.save());
  console.log('');
}

/**
 * Send message to GMGN bot to execute sell
 */
export async function sendGMGNCommand(tokenMint: string, percentage: number): Promise<boolean> {
  if (!client) {
    console.error('❌ Telegram client not initialized');
    return false;
  }

  try {
    // GMGN sell command format: /sell <token_address> <percentage>%
    // Adjust this based on actual GMGN bot command format
    const command = `/sell ${tokenMint} ${percentage}%`;

    await client.sendMessage(TELEGRAM_CONFIG.botUsername, {
      message: command
    });

    console.log(`✅ Sent to GMGN: ${command}`);
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;

  } catch (error: any) {
    console.error(`❌ Failed to send Telegram command:`, error.message);
    return false;
  }
}