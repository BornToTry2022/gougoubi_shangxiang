// 回本签 — deterministic fortune draw.
// All randomness is derived from the on-chain burn tx hash, so any result is
// reproducible and verifiable by anyone (no hidden server randomness).
// 娱乐玄学 · 非投资建议.

export type Outcome = "上上签" | "上签" | "中签" | "下签";

export type DrawTier = {
  id: "common" | "master" | "king";
  name: string;
  emoji: string;
  /** GGB burned per draw (whole tokens) */
  burn: number;
  desc: string;
  /** outcome weights (relative) */
  weights: Record<Outcome, number>;
  /** leaderboard point weight per draw */
  points: number;
  accent: string; // hex for card accent
};

export const DRAW_TIERS: DrawTier[] = [
  {
    id: "common",
    name: "普通签",
    emoji: "🪙",
    burn: 1_000,
    desc: "日常小烧，天天可求",
    weights: { 上上签: 5, 上签: 20, 中签: 50, 下签: 25 },
    points: 1,
    accent: "#ffcf33",
  },
  {
    id: "master",
    name: "大师签",
    emoji: "🔮",
    burn: 10_000,
    desc: "诚意加倍，吉签更旺",
    weights: { 上上签: 15, 上签: 35, 中签: 42, 下签: 8 },
    points: 12,
    accent: "#a78bfa",
  },
  {
    id: "king",
    name: "狗王签",
    emoji: "👑",
    burn: 100_000,
    desc: "王者一掷，必有回响",
    weights: { 上上签: 35, 上签: 45, 中签: 20, 下签: 0 },
    points: 130,
    accent: "#ff7a18",
  },
];

export function tierById(id: string): DrawTier | undefined {
  return DRAW_TIERS.find((t) => t.id === id);
}

/** Map an actual burned amount to the highest tier it qualifies for. */
export function tierForAmount(amountTokens: number): DrawTier {
  let best = DRAW_TIERS[0];
  for (const t of DRAW_TIERS) {
    // 1% tolerance for rounding / fee-on-transfer (GGB has 0 tax, but be safe)
    if (amountTokens >= t.burn * 0.99) best = t;
  }
  return best;
}

export const OUTCOME_META: Record<
  Outcome,
  { color: string; glow: string; label: string }
> = {
  上上签: { color: "#ff7a18", glow: "rgba(255,122,24,0.55)", label: "天降狗运" },
  上签: { color: "#ffcf33", glow: "rgba(255,207,51,0.45)", label: "狗运回暖" },
  中签: { color: "#7dd3fc", glow: "rgba(125,211,252,0.35)", label: "平平是福" },
  下签: { color: "#94a3b8", glow: "rgba(148,163,184,0.3)", label: "蓄势待发" },
};

export const VERDICTS: Record<Outcome, string[]> = {
  上上签: [
    "金狗摇尾，霉运退散，套牢的影子被一缕狗光照穿。",
    "今日狗气冲天，回本的路忽然变短了一截。",
    "天狗食霉，旧账翻篇，久违的微笑挂回脸上。",
    "狗神拍了拍你的肩：稳住，你比昨天更接近岸边。",
    "一柱狗香直冲云霄，连情绪都忍不住抬了抬头。",
    "黑洞收下你的诚意，回赠你一身好运。",
    "上上大吉：狗在烧，运在涨，心情先回本。",
    "狗王为你点灯，前路忽然不那么黑了。",
    "霉气清零，狗气满格，今天适合相信奇迹。",
    "你烧的不是币，是命运给你让出的一条路。",
    "祖传狗运今日到账，连空气都是回甜的。",
    "乌云裂开一条狗形的缝，光正好照在你头上。",
  ],
  上签: [
    "狗运回暖，虽未大富，心头先松了半口气。",
    "稳中有狗，今日诸事顺一点点，别小看这一点点。",
    "小吉到家：账户没动，心态先回了血。",
    "狗尾轻摇，好事在路上，记得开门。",
    "今日风向偏暖，套牢的绳子松了一格。",
    "积小狗成大运，今天的香没白上。",
    "方向对了，剩下的交给时间这条老狗。",
    "云开见狗，前路渐明，步子可以稳一点。",
    "好运像狗一样赶来，虽然慢，但忠诚。",
    "今日宜微笑，霉运正在打包离场。",
  ],
  中签: [
    "平平是福，狗子今天选择躺平陪你。",
    "不上不下，正是修心好时节，香照上。",
    "风浪不大，适合喝口奶茶看看远方。",
    "狗在观望，你也别急，路还长。",
    "今日无功无过，守住手别乱动，就是赢。",
    "运势如老狗散步，慢悠悠，但没走丢。",
    "中规中矩的一天，适合积攒下一次的狗运。",
    "黑洞收下了，回响还在路上，耐心点。",
    "盈亏不过一念，狗也是这么想的。",
    "不温不火，刚好够你睡个安稳觉。",
  ],
  下签: [
    "下签别慌，狗最擅长的就是绝地翻身。",
    "今日狗气偏弱，正好歇歇，明天再战。",
    "霉是暂时的，狗是永远的，香接着上。",
    "跌到底的好处是：再往下也没多少路了。",
    "今天宜认怂，明天宜支棱。",
    "狗子摔了一跤，拍拍土，尾巴还在摇。",
    "运势在打盹，别吵醒它，安静持有。",
    "今日不宜冲动，宜抱紧你的狗与你的币。",
    "黑暗里也有狗在守夜，天会亮的。",
    "触底才有反弹的故事可讲，记下今天。",
  ],
};

export const YI = [
  "上香求狗运",
  "抱团取暖",
  "截图发群",
  "安静持有",
  "喝杯奶茶",
  "摸摸狗头",
  "深呼吸",
  "看看远方",
  "给群友打气",
  "记录今天",
];
export const JI = [
  "追高",
  "恐慌割肉",
  "半夜看盘",
  "梭哈",
  "盲目暴富梦",
  "FUD 带节奏",
  "熬夜盯线",
  "和家人吵架",
];

export type FortuneResult = {
  outcome: Outcome;
  verdict: string;
  lucky: number; // 1..99
  yi: string;
  ji: string;
  huiben: number; // 0..100 fun "回本指数" (娱乐)
};

/** cyrb53 — fast, well-distributed 53-bit hash of a string. */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** deterministic float in [0,1) from (hash, salt) */
function rng(txHash: string, salt: number): number {
  return cyrb53(txHash.toLowerCase(), salt) / 2 ** 53;
}

function pickOutcome(txHash: string, tier: DrawTier): Outcome {
  const entries = Object.entries(tier.weights) as [Outcome, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng(txHash, 1) * total;
  for (const [o, w] of entries) {
    if (r < w) return o;
    r -= w;
  }
  return entries[entries.length - 1][0];
}

/**
 * Deterministically derive the full fortune from a burn tx hash + tier.
 * Same inputs always produce the same card → reproducible & verifiable.
 */
export function draw(txHash: string, tier: DrawTier): FortuneResult {
  const outcome = pickOutcome(txHash, tier);
  const lib = VERDICTS[outcome];
  const verdict = lib[Math.floor(rng(txHash, 2) * lib.length)];
  const lucky = 1 + Math.floor(rng(txHash, 3) * 99);
  const yi = YI[Math.floor(rng(txHash, 4) * YI.length)];
  const ji = JI[Math.floor(rng(txHash, 5) * JI.length)];
  // 回本指数: biased by outcome, jittered by hash. 娱乐 only.
  const base: Record<Outcome, number> = { 上上签: 82, 上签: 66, 中签: 50, 下签: 30 };
  const huiben = Math.max(
    1,
    Math.min(100, Math.round(base[outcome] + (rng(txHash, 6) * 22 - 11)))
  );
  return { outcome, verdict, lucky, yi, ji, huiben };
}
