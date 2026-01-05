import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables
if (!process.env.HELIUS_API_KEY) throw new Error("Missing HELIUS_API_KEY");
if (!process.env.YOUR_WALLET) throw new Error("Missing YOUR_WALLET");
if (!process.env.TELEGRAM_API_ID) throw new Error("Missing TELEGRAM_API_ID");
if (!process.env.TELEGRAM_API_HASH) throw new Error("Missing TELEGRAM_API_HASH");
if (!process.env.TELEGRAM_PHONE) throw new Error("Missing TELEGRAM_PHONE");
if (!process.env.GMGN_BOT_USERNAME) throw new Error("Missing GMGN_BOT_USERNAME");

// RPC Configuration
export const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
export const RPC_HTTP = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const RPC_WS = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Moralis API
export const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjMzNzg1ZmNkLTgzZTctNDc2ZS1iMDZjLWUxYmYxZGFhNDU1ZCIsIm9yZ0lkIjoiNDg3NjY0IiwidXNlcklkIjoiNTAxNzM2IiwidHlwZUlkIjoiYTIyNzAwOGYtZTc1Ni00YjZhLWJlNGItZjgxZmRhODdkYTc2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NjY4MjY3NDksImV4cCI6NDkyMjU4Njc0OX0.zjMFcKUOTKRvKYlSz403hkSWd_WdUgKw7v9PkDouyAQ";

// Your wallet
export const YOUR_WALLET = process.env.YOUR_WALLET;

// Telegram Configuration
export const TELEGRAM_CONFIG = {
  apiId: parseInt(process.env.TELEGRAM_API_ID!),
  apiHash: process.env.TELEGRAM_API_HASH!,
  phoneNumber: process.env.TELEGRAM_PHONE!,
  botUsername: process.env.GMGN_BOT_USERNAME!,
  sessionName: "gmgn_session"
};

// Simple sell strategy - no complex config needed
export const SELL_STRATEGY = {
  // Just for reference in logs
};

// Logging
export const VERBOSE = true;


// ## ✅ Summary of Changes:

// ### **Sell Strategy (EXACTLY 3 messages):**
// 1. **Target sells >50%** → Send `/sell <token> 40%`
// 2. **Target sells >70%** → Send `/sell <token> 40%` (another 40%)
// 3. **Target sells >90%** → Send `/sell <token> 100%` (sell everything remaining)

// ### **Key Features:**
// - ✅ **Only 3 messages maximum** - No spam
// - ✅ **1 second polling** - Fast reaction time
// - ✅ **Auto-detection** - Checks if you still hold the token
// - ✅ **Smart skip** - If you've manually sold or don't hold anymore, stops monitoring
// - ✅ **No duplicates** - Uses numbered flags (1, 2, 3) instead of percentages
// - ✅ **100% exit** - Final sell is 100% to clear all remaining dust

// ### **Example Flow:**
// ```
// You buy token XYZ
// Target wallet sells 55% → Bot sends: /sell XYZ 40%
// Target wallet sells 75% → Bot sends: /sell XYZ 40%
// Target wallet sells 92% → Bot sends: /sell XYZ 100%
// ✅ Done - Only 3 messages sent