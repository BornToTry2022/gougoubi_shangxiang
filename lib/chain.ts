import { createPublicClient, fallback, http } from "viem";
import { bsc } from "viem/chains";
import {
  BSC_RPCS,
  DEAD_ADDRESS,
  ERC20_ABI,
  GGB,
  ZERO_ADDRESS,
  toTokens,
} from "./ggb";

/** Public BSC client with multi-RPC fallback (no API key required). */
export const publicClient = createPublicClient({
  chain: bsc,
  transport: fallback(
    // fetchOptions no-store: prevent Next.js from caching viem's RPC POSTs
    // (a cached pre-burn read would otherwise freeze the on-chain numbers).
    BSC_RPCS.map((url) =>
      http(url, { timeout: 8_000, fetchOptions: { cache: "no-store" } })
    ),
    { rank: false }
  ),
});

export type BurnStats = {
  /** GGB burned to the dead address (whole tokens) */
  burnedDead: number;
  /** GGB sent to the zero address (whole tokens) */
  burnedZero: number;
  /** total burned = dead + zero (whole tokens) */
  burnedTotal: number;
  /** on-chain total supply (whole tokens) */
  totalSupply: number;
  /** circulating = totalSupply - burnedTotal (whole tokens) */
  circulating: number;
  /** burned / totalSupply * 100 */
  pctBurned: number;
  /** ms epoch when these values were read */
  readAt: number;
  /** cumulative-burn increase over last ~24h (null until snapshots accrue); set by /api/burn */
  delta24h?: number | null;
};

/**
 * Read the authoritative burn numbers straight from chain.
 * No storage needed: the dead-address balance IS the cumulative burn.
 */
export async function getBurnStats(): Promise<BurnStats> {
  const [deadRaw, zeroRaw, totalRaw] = await Promise.all([
    publicClient.readContract({
      address: GGB.address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [DEAD_ADDRESS],
    }),
    publicClient.readContract({
      address: GGB.address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [ZERO_ADDRESS],
    }),
    publicClient.readContract({
      address: GGB.address,
      abi: ERC20_ABI,
      functionName: "totalSupply",
    }),
  ]);

  const burnedDead = toTokens(deadRaw as bigint);
  const burnedZero = toTokens(zeroRaw as bigint);
  const burnedTotal = burnedDead + burnedZero;
  const totalSupply = toTokens(totalRaw as bigint);
  const circulating = totalSupply - burnedTotal;
  const pctBurned = totalSupply > 0 ? (burnedTotal / totalSupply) * 100 : 0;

  return {
    burnedDead,
    burnedZero,
    burnedTotal,
    totalSupply,
    circulating,
    pctBurned,
    readAt: Date.now(),
  };
}
