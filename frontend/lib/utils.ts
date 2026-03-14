import { ethers } from "ethers";
import { formatEther, parseEther } from "viem";

/**
 * Format an ETH value (bigint in wei) for display.
 * Shows up to 4 decimal places.
 */
export function formatETH(wei: bigint, decimals = 4): string {
  const eth = Number(formatEther(wei));
  if (eth === 0) return "0 ETH";
  if (eth < 0.0001) return "< 0.0001 ETH";
  return `${eth.toFixed(decimals).replace(/\.?0+$/, "")} ETH`;
}

/** Shorten a wallet address: 0x1234...5678 */
export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format a unix timestamp to a human-readable date */
export function formatDate(ts: bigint | number): string {
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Returns days remaining until deadline (0 if expired) */
export function daysRemaining(deadline: bigint): number {
  if (deadline === 0n) return Infinity;
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;
  return Math.max(0, Math.ceil(diff / 86400));
}

/** Progress percent (clamped 0–100) */
export function progressPercent(raised: bigint, goal: bigint): number {
  if (goal === 0n) return 0;
  const pct = Number((raised * 100n) / goal);
  return Math.min(100, pct);
}

/** Campaign status label */
export function campaignStatus(
  active: boolean,
  milestoneReached: boolean,
  withdrawn: boolean,
  mode: number
): { label: string; variant: "accent" | "primary" | "warning" | "muted" } {
  if (withdrawn)         return { label: "Completed", variant: "muted" };
  if (milestoneReached)  return { label: "Goal Reached! 🎉", variant: "accent" };
  if (!active)           return { label: "Closed", variant: "muted" };
  if (mode === 1)        return { label: "Flexible", variant: "primary" };
  return                        { label: "Active", variant: "primary" };
}

/** Generate a letter avatar background from an address */
export function avatarLetter(address: string): string {
  return address?.slice(2, 3).toUpperCase() || "?";
}

/** Convert ETH string to wei bigint */
export function ethToWei(eth: string): bigint {
  try { return parseEther(eth); }
  catch { return 0n; }
}
