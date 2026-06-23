// 狗狗币 — shared on-chain constants & helpers.
// 代币名就是「狗狗币」(链上中文 symbol，无官方英文名)。下面的常量名 `GGB`
// 只是代码内部标识符 / 旧 latin 简写，不是对外代币名；一切对外文案用「狗狗币」。
// Single source of truth. Reusable by the web app and (later) Cloudflare Workers.
import type { Lang } from "./i18n";

export const GGB = {
  /** 狗狗币 token contract on BSC */
  address: "0xb05678ed0c9559955559de864829a0c8af574444" as `0x${string}`,
  decimals: 18,
  symbol: "狗狗币",
  /** legacy latin alias — internal only; the token's name is 狗狗币 */
  symbolLatin: "GGB",
  name: "狗狗币",
  /** Total supply is fixed: 1,000,000,000 狗狗币 (no mint). Used as a fast fallback. */
  totalSupplyHint: 1_000_000_000,
} as const;

/** Standard burn / dead address the project burns into. */
export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
/** Some tokens are also sent to the zero address; we count it as burned too. */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const BSC_CHAIN_ID = 56;

/** Public BSC RPCs (no API key). Used with a viem fallback transport. */
export const BSC_RPCS = [
  "https://bsc-dataseed.bnbchain.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
  "https://bsc.publicnode.com",
  "https://1rpc.io/bnb",
];

export const BSCSCAN = {
  base: "https://bscscan.com",
  tokenHolding: (holder: string) =>
    `https://bscscan.com/token/${GGB.address}?a=${holder}`,
  tx: (hash: string) => `https://bscscan.com/tx/${hash}`,
  address: (addr: string) => `https://bscscan.com/address/${addr}`,
} as const;

export const LINKS = {
  website: "https://gougoubi.ai/",
  x: "https://x.com/gougoubi_ai",
  telegram: "https://t.me/chinesedogecoinorg",
  /** Open-source repo (public mirror, code only). */
  github: "https://github.com/BornToTry2022/gougoubi_shangxiang",
  /** Buy 狗狗币 on PancakeSwap (the "余额不足 → 去买" hook) */
  buy: `https://pancakeswap.finance/swap?inputCurrency=BNB&outputCurrency=${GGB.address}`,
} as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ---------- formatting helpers ----------

/** Convert a bigint token amount (wei, 18 decimals) to a JS number of whole tokens. */
export function toTokens(wei: bigint, decimals = GGB.decimals): number {
  // Safe for display: GGB amounts are well within Number range as whole tokens.
  return Number(wei) / 10 ** decimals;
}

/** Compact human number: 1234567 -> "123.5万" / "1.23亿" (Chinese units). */
export function formatCN(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const trim = (x: number, d: number) => x.toFixed(d).replace(/\.?0+$/, "");
  if (abs >= 1e8) return trim(n / 1e8, 2) + "亿";
  if (abs >= 1e4) return trim(n / 1e4, 2) + "万";
  if (abs >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

/** Percent with adaptive precision for very small numbers. */
export function formatPct(p: number): string {
  if (!isFinite(p)) return "—";
  if (p === 0) return "0%";
  if (p < 0.0001) return "<0.0001%";
  if (p < 1) return p.toFixed(4) + "%";
  return p.toFixed(2) + "%";
}

export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

/** Language-aware compact number: 简 万/亿, 繁 萬/億, en K/M/B. */
export function formatNum(n: number, lang: Lang): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const trim = (x: number, d: number) => x.toFixed(d).replace(/\.?0+$/, "");
  if (lang === "en") {
    if (abs >= 1e9) return trim(n / 1e9, 2) + "B";
    // ≥999,500 would round to "1000K"; show "1M" instead.
    if (abs >= 9.995e5) return trim(n / 1e6, 2) + "M";
    if (abs >= 1e4) return trim(n / 1e3, 1) + "K";
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  const yi = lang === "zh-Hant" ? "億" : "亿";
  const wan = lang === "zh-Hant" ? "萬" : "万";
  if (abs >= 1e8) return trim(n / 1e8, 2) + yi;
  if (abs >= 1e4) return trim(n / 1e4, 2) + wan;
  if (abs >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}
