// 烧狗榜 storage.
// Pluggable backend so the SAME code runs locally (a JSON file) and on Cloudflare
// (a single KV blob). Exported function signatures never change → routes untouched.
//
// Backend selection per call:
//   1. Cloudflare KV  — when getCloudflareContext().env.GGB_KV exists (deployed)
//   2. local file     — when node:fs is available (next dev/start)
//   3. in-memory      — last-resort fallback (edge sandbox / tests)
//
// The whole DB is a single JSON blob. Fine for an MVP community scale; if write
// contention becomes an issue, migrate burns/claims to D1 (SQLite) — keep this API.

export type BurnRecord = {
  wallet: string;
  txHash: string;
  amount: number;
  points: number;
  outcome: string;
  tier: string;
  ts: number;
};

export type WalletStats = {
  wallet: string;
  totalBurned: number;
  totalPoints: number;
  draws: number;
  streak: number;
  lastTs: number;
  bestOutcome: string;
};

export type LeaderRow = WalletStats & { rank: number };

type Snapshot = { ts: number; total: number };
type DB = { claims: Record<string, true>; burns: BurnRecord[]; snapshots: Snapshot[] };

const EMPTY: DB = { claims: {}, burns: [], snapshots: [] };
const KV_KEY = "ggb:db";

function normalize(db: Partial<DB> | null | undefined): DB {
  return {
    claims: db?.claims ?? {},
    burns: db?.burns ?? [],
    snapshots: db?.snapshots ?? [],
  };
}

// ---------- backends ----------
type Backend = { read: () => Promise<DB>; write: (db: DB) => Promise<void> };

// 1) Cloudflare KV (resolved lazily; absent locally)
async function kvBackend(): Promise<Backend | null> {
  try {
    // Optional dependency: present only on Cloudflare builds. webpackIgnore keeps
    // the bundler from resolving it; @ts-ignore keeps tsc from erroring locally.
    // @ts-ignore
    const mod: any = await import(/* webpackIgnore: true */ "@opennextjs/cloudflare").catch(
      () => null
    );
    const kv = mod?.getCloudflareContext?.()?.env?.GGB_KV;
    if (!kv) return null;
    return {
      read: async () => normalize(await kv.get(KV_KEY, "json")),
      write: async (db: DB) => {
        await kv.put(KV_KEY, JSON.stringify(db));
      },
    };
  } catch {
    return null;
  }
}

// 2) local file (node)
let writeChain: Promise<void> = Promise.resolve();
async function fileBackend(): Promise<Backend | null> {
  try {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".data");
    const file = path.join(dir, "burns.json");
    return {
      read: async () => {
        try {
          return normalize(JSON.parse(await fs.readFile(file, "utf8")));
        } catch {
          return { ...EMPTY };
        }
      },
      write: async (db: DB) => {
        writeChain = writeChain.then(async () => {
          await fs.mkdir(dir, { recursive: true });
          const tmp = file + ".tmp";
          await fs.writeFile(tmp, JSON.stringify(db), "utf8");
          await fs.rename(tmp, file);
        });
        return writeChain;
      },
    };
  } catch {
    return null;
  }
}

// 3) in-memory fallback
let mem: DB = { ...EMPTY };
const memoryBackend: Backend = {
  read: async () => mem,
  write: async (db: DB) => {
    mem = db;
  },
};

async function backend(): Promise<Backend> {
  return (await kvBackend()) ?? (await fileBackend()) ?? memoryBackend;
}

async function read(): Promise<DB> {
  return (await backend()).read();
}
async function write(db: DB): Promise<void> {
  return (await backend()).write(db);
}

// ---------- domain logic ----------
const OUTCOME_RANK: Record<string, number> = { 上上签: 4, 上签: 3, 中签: 2, 下签: 1 };

export async function hasClaim(txHash: string): Promise<boolean> {
  const db = await read();
  return !!db.claims[txHash.toLowerCase()];
}

/** Record a verified burn. Idempotent on txHash. Returns false if already counted. */
export async function recordBurn(r: BurnRecord): Promise<boolean> {
  const db = await read();
  const key = r.txHash.toLowerCase();
  if (db.claims[key]) return false;
  db.claims[key] = true;
  db.burns.push({ ...r, wallet: r.wallet.toLowerCase(), txHash: key });
  await write(db);
  return true;
}

export async function recordSnapshot(total: number): Promise<void> {
  const db = await read();
  db.snapshots.push({ ts: Date.now(), total });
  if (db.snapshots.length > 400) db.snapshots = db.snapshots.slice(-400);
  await write(db);
}

/** Cumulative-burn increase over ~24h vs the snapshot nearest 24h ago (≥12h old). */
export async function getDelta24h(currentTotal: number): Promise<number | null> {
  const db = await read();
  const target = Date.now() - 86_400_000;
  let best: Snapshot | null = null;
  let bestDist = Infinity;
  for (const s of db.snapshots) {
    if (Date.now() - s.ts < 12 * 3_600_000) continue;
    const d = Math.abs(s.ts - target);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  if (!best) return null;
  return Math.max(0, currentTotal - best.total);
}

function streakOf(timestamps: number[]): number {
  if (!timestamps.length) return 0;
  const days = new Set(timestamps.map((t) => Math.floor(t / 86_400_000)));
  const today = Math.floor(Date.now() / 86_400_000);
  let start = days.has(today) ? today : days.has(today - 1) ? today - 1 : -1;
  if (start === -1) return 0;
  let s = 0;
  let d = start;
  while (days.has(d)) {
    s++;
    d--;
  }
  return s;
}

function aggregate(burns: BurnRecord[]): WalletStats[] {
  const m = new Map<string, { stats: WalletStats; ts: number[] }>();
  for (const b of burns) {
    const w = b.wallet.toLowerCase();
    let e = m.get(w);
    if (!e) {
      e = {
        stats: {
          wallet: w,
          totalBurned: 0,
          totalPoints: 0,
          draws: 0,
          streak: 0,
          lastTs: 0,
          bestOutcome: "下签",
        },
        ts: [],
      };
      m.set(w, e);
    }
    e.stats.totalBurned += b.amount;
    e.stats.totalPoints += b.points;
    e.stats.draws += 1;
    e.stats.lastTs = Math.max(e.stats.lastTs, b.ts);
    if ((OUTCOME_RANK[b.outcome] ?? 0) > (OUTCOME_RANK[e.stats.bestOutcome] ?? 0)) {
      e.stats.bestOutcome = b.outcome;
    }
    e.ts.push(b.ts);
  }
  const out: WalletStats[] = [];
  for (const e of m.values()) {
    e.stats.streak = streakOf(e.ts);
    out.push(e.stats);
  }
  out.sort((a, b) => b.totalBurned - a.totalBurned || b.totalPoints - a.totalPoints);
  return out;
}

export async function getLeaderboard(limit = 50): Promise<{
  rows: LeaderRow[];
  totals: { wallets: number; burned: number; draws: number };
}> {
  const db = await read();
  const agg = aggregate(db.burns);
  const rows = agg.slice(0, limit).map((s, i) => ({ ...s, rank: i + 1 }));
  return {
    rows,
    totals: {
      wallets: agg.length,
      burned: agg.reduce((s, x) => s + x.totalBurned, 0),
      draws: db.burns.length,
    },
  };
}

export async function getWalletStats(wallet: string): Promise<LeaderRow | null> {
  const db = await read();
  const agg = aggregate(db.burns);
  const idx = agg.findIndex((s) => s.wallet === wallet.toLowerCase());
  return idx === -1 ? null : { ...agg[idx], rank: idx + 1 };
}
