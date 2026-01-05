/**
 * Track active positions being monitored
 */

export interface TrackedPosition {
  tokenMint: string;
  targetWallet: string; // First buyer we're following
  targetInitialBalance: number; // Their starting balance
  yourInitialBalance: number; // Your starting balance
  executedSells: Set<number>; // Track which sell levels executed (40, 30, 30)
  startTime: number;
  lastChecked: number;
}

// Active positions being tracked
export const trackedPositions = new Map<string, TrackedPosition>();

// Processed transactions (prevent duplicates)
export const processedTxs = new Set<string>();