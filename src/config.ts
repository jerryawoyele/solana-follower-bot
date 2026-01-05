import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables
if (!process.env.HELIUS_API_KEY) throw new Error("Missing HELIUS_API_KEY");
if (!process.env.YOUR_WALLET) throw new Error("Missing YOUR_WALLET");
if (!process.env.PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY");

// RPC Configuration
export const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
export const RPC_HTTP = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const RPC_WS = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Moralis API
export const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjMzNzg1ZmNkLTgzZTctNDc2ZS1iMDZjLWUxYmYxZGFhNDU1ZCIsIm9yZ0lkIjoiNDg3NjY0IiwidXNlcklkIjoiNTAxNzM2IiwidHlwZUlkIjoiYTIyNzAwOGYtZTc1Ni00YjZhLWJlNGItZjgxZmRhODdkYTc2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NjY4MjY3NDksImV4cCI6NDkyMjU4Njc0OX0.zjMFcKUOTKRvKYlSz403hkSWd_WdUgKw7v9PkDouyAQ";

// Your wallet
export const YOUR_WALLET = process.env.YOUR_WALLET;

// Private key for signing transactions
export const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Jupiter API Key (optional, for Pro plan)
export const JUPITER_API_KEY = process.env.JUPITER_API_KEY || undefined;

// Slippage configuration
export const SLIPPAGE_BPS = 500; // 5% slippage

// Logging
export const VERBOSE = true;