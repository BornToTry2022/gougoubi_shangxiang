// 烧狗榜 storage.
// Pluggable backend so the SAME code runs locally and on Cloudflare. Exported
// function signatures never change → routes untouched.
//
// Backend selection per call:
//   1. Cloudflare D1   — when env.GGB_DB exists. ROW-based: burns.txHash is the
//                        PRIMARY KEY, so dedup + append are atomic (INSERT OR
//                        IGNORE). No read-modify-write race, no lost burns.
//   2. Cloudflare KV   — when only env.GGB_KV exists. Single JSON blob (legacy).
//   3. local file      — node:fs (next dev/start).
//   4. in-memory       — last-resort fallback (edge sandbox / tests).
//
// On D1 we LAZILY back-fill once from the old KV blob (see ensureMigrated), so the
// switch is zero-touch: create the DB + deploy and the first request migrates.

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
const SNAPSHOT_CAP = 400;

function normalize(db: Partial<DB> | null | undefined): DB {
  return {
    claims: db?.claims ?? {},
    burns: db?.burns ?? [],
    snapshots: db?.snapshots ?? [],
  };
}

// ---------- shared pure helpers (backend-independent) ----------
const OUTCOME_RANK: Record<string, number> = { 上上签: 4, 上签: 3, 中签: 2, 下签: 1 };

// Day boundary in the community's timezone (UTC+8 / Beijing), so "连签 N 天"
// rolls over at local midnight, not 08:00.
const TZ_OFFSET = 8 * 3_600_000;
function streakOf(timestamps: number[]): number {
  if (!timestamps.length) return 0;
  const days = new Set(timestamps.map((t) => Math.floor((t + TZ_OFFSET) / 86_400_000)));
  const today = Math.floor((Date.now() + TZ_OFFSET) / 86_400_000);
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

/** Cumulative-burn increase over ~24h vs the snapshot nearest 24h ago (≥12h old). */
function computeDelta24h(snapshots: Snapshot[], currentTotal: number): number | null {
  const target = Date.now() - 86_400_000;
  let best: Snapshot | null = null;
  let bestDist = Infinity;
  for (const s of snapshots) {
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

function leaderboardFrom(burns: BurnRecord[], limit: number) {
  const agg = aggregate(burns);
  const rows = agg.slice(0, limit).map((s, i) => ({ ...s, rank: i + 1 }));
  return {
    rows,
    totals: {
      wallets: agg.length,
      burned: agg.reduce((s, x) => s + x.totalBurned, 0),
      draws: burns.length,
    },
  };
}

function walletStatsFrom(burns: BurnRecord[], wallet: string): LeaderRow | null {
  const agg = aggregate(burns);
  const idx = agg.findIndex((s) => s.wallet === wallet.toLowerCase());
  return idx === -1 ? null : { ...agg[idx], rank: idx + 1 };
}

// ---------- store interface ----------
type Leaderboard = {
  rows: LeaderRow[];
  totals: { wallets: number; burned: number; draws: number };
};
interface Store {
  recordBurn(r: BurnRecord): Promise<boolean>;
  recordSnapshot(total: number): Promise<void>;
  hasClaim(txHash: string): Promise<boolean>;
  getDelta24h(currentTotal: number): Promise<number | null>;
  getLeaderboard(limit: number): Promise<Leaderboard>;
  getWalletStats(wallet: string): Promise<LeaderRow | null>;
}

// ---------- Cloudflare env (resolved lazily; absent locally) ----------
async function cfEnv(): Promise<Record<string, unknown> | null> {
  try {
    // Optional dependency: present only on Cloudflare builds. webpackIgnore keeps
    // the bundler from resolving it; @ts-ignore keeps tsc from erroring locally.
    // @ts-ignore
    const mod: any = await import(/* webpackIgnore: true */ "@opennextjs/cloudflare").catch(
      () => null
    );
    return mod?.getCloudflareContext?.()?.env ?? null;
  } catch {
    return null;
  }
}

// ================= blob backends (KV / file / memory) =================
// read whole DB -> mutate -> write whole DB. NOT atomic across concurrent writers
// (this is why D1 is preferred); kept for local dev + as a safe fallback.
type Backend = {
  read: () => Promise<DB>;
  write: (db: DB) => Promise<void>;
  /** Optional serialized read-modify-write so concurrent record ops can't read a
   *  stale snapshot and clobber each other. Implemented by the file backend. */
  mutate?: (fn: (db: DB) => void) => Promise<void>;
};

function kvBackendFrom(kv: any): Backend {
  return {
    read: async () => normalize(await kv.get(KV_KEY, "json")),
    write: async (db: DB) => {
      await kv.put(KV_KEY, JSON.stringify(db));
    },
  };
}

let writeChain: Promise<void> = Promise.resolve();
async function fileBackend(): Promise<Backend | null> {
  try {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".data");
    const file = path.join(dir, "burns.json");
    const readDb = async (): Promise<DB> => {
      try {
        return normalize(JSON.parse(await fs.readFile(file, "utf8")));
      } catch {
        return { ...EMPTY };
      }
    };
    const writeDb = async (db: DB) => {
      await fs.mkdir(dir, { recursive: true });
      const tmp = file + ".tmp";
      await fs.writeFile(tmp, JSON.stringify(db), "utf8");
      await fs.rename(tmp, file);
    };
    return {
      read: readDb,
      write: async (db: DB) => {
        writeChain = writeChain.then(() => writeDb(db));
        return writeChain;
      },
      // Serialize the WHOLE read-modify-write (not just the write) so two
      // overlapping record* calls can't both read the pre-write file and the
      // second clobber the first's append.
      mutate: async (fn) => {
        writeChain = writeChain.then(async () => {
          const db = await readDb();
          fn(db);
          await writeDb(db);
        });
        return writeChain;
      },
    };
  } catch {
    return null;
  }
}

let mem: DB = { ...EMPTY };
const memoryBackend: Backend = {
  read: async () => mem,
  write: async (db: DB) => {
    mem = db;
  },
};

function blobStore(b: Backend): Store {
  return {
    async recordBurn(r) {
      const key = r.txHash.toLowerCase();
      const apply = (db: DB): boolean => {
        if (db.claims[key]) return false;
        db.claims[key] = true;
        db.burns.push({ ...r, wallet: r.wallet.toLowerCase(), txHash: key });
        return true;
      };
      if (b.mutate) {
        let counted = false;
        await b.mutate((db) => {
          counted = apply(db);
        });
        return counted;
      }
      const db = await b.read();
      const counted = apply(db);
      if (counted) await b.write(db);
      return counted;
    },
    async recordSnapshot(total) {
      const apply = (db: DB) => {
        db.snapshots.push({ ts: Date.now(), total });
        if (db.snapshots.length > SNAPSHOT_CAP) db.snapshots = db.snapshots.slice(-SNAPSHOT_CAP);
      };
      if (b.mutate) {
        await b.mutate(apply);
        return;
      }
      const db = await b.read();
      apply(db);
      await b.write(db);
    },
    async hasClaim(txHash) {
      const db = await b.read();
      return !!db.claims[txHash.toLowerCase()];
    },
    async getDelta24h(currentTotal) {
      const db = await b.read();
      return computeDelta24h(db.snapshots, currentTotal);
    },
    async getLeaderboard(limit) {
      const db = await b.read();
      return leaderboardFrom(db.burns, limit);
    },
    async getWalletStats(wallet) {
      const db = await b.read();
      return walletStatsFrom(db.burns, wallet);
    },
  };
}

// ================= D1 backend (atomic, preferred) =================
let d1Migrated = false;
function d1Store(db: any, kv: any | null): Store {
  // One-time lazy init: create the tables if missing (so a fresh D1 needs no manual
  // schema step) and back-fill once from the legacy KV blob (so deploying D1 doesn't
  // drop existing leaderboard data). All idempotent — safe to run on every isolate.
  async function ensureMigrated() {
    if (d1Migrated) return;
    try {
      await db
        .prepare(
          "CREATE TABLE IF NOT EXISTS burns (txHash TEXT PRIMARY KEY, wallet TEXT NOT NULL, amount REAL NOT NULL, points INTEGER NOT NULL, outcome TEXT NOT NULL, tier TEXT NOT NULL, ts INTEGER NOT NULL)"
        )
        .run();
      await db
        .prepare("CREATE INDEX IF NOT EXISTS idx_burns_wallet ON burns(wallet)")
        .run();
      await db
        .prepare(
          "CREATE TABLE IF NOT EXISTS snapshots (ts INTEGER PRIMARY KEY, total REAL NOT NULL)"
        )
        .run();
      const has = await db.prepare("SELECT 1 FROM burns LIMIT 1").first();
      if (!has && kv) {
        const old = normalize(await kv.get(KV_KEY, "json"));
        for (const r of old.burns) {
          await db
            .prepare(
              "INSERT OR IGNORE INTO burns (txHash, wallet, amount, points, outcome, tier, ts) VALUES (?,?,?,?,?,?,?)"
            )
            .bind(
              r.txHash.toLowerCase(),
              r.wallet.toLowerCase(),
              r.amount,
              r.points,
              r.outcome,
              r.tier,
              r.ts
            )
            .run();
        }
        for (const s of old.snapshots) {
          await db
            .prepare("INSERT OR IGNORE INTO snapshots (ts, total) VALUES (?, ?)")
            .bind(s.ts, s.total)
            .run();
        }
      }
      d1Migrated = true;
    } catch {
      // table may not exist yet (schema not applied) — leave unmigrated; ops below
      // will surface the error and the caller can fall back / retry next deploy.
      d1Migrated = true;
    }
  }

  async function allBurns(): Promise<BurnRecord[]> {
    const { results } = await db
      .prepare("SELECT wallet, txHash, amount, points, outcome, tier, ts FROM burns")
      .all();
    return (results ?? []) as BurnRecord[];
  }

  return {
    async recordBurn(r) {
      await ensureMigrated();
      // PRIMARY KEY(txHash) makes this atomic: a duplicate is ignored, and
      // meta.changes tells us whether THIS call inserted the row.
      const res = await db
        .prepare(
          "INSERT OR IGNORE INTO burns (txHash, wallet, amount, points, outcome, tier, ts) VALUES (?,?,?,?,?,?,?)"
        )
        .bind(
          r.txHash.toLowerCase(),
          r.wallet.toLowerCase(),
          r.amount,
          r.points,
          r.outcome,
          r.tier,
          r.ts
        )
        .run();
      return (res?.meta?.changes ?? 0) > 0;
    },
    async recordSnapshot(total) {
      await ensureMigrated();
      await db
        .prepare("INSERT OR IGNORE INTO snapshots (ts, total) VALUES (?, ?)")
        .bind(Date.now(), total)
        .run();
      await db
        .prepare(
          "DELETE FROM snapshots WHERE ts NOT IN (SELECT ts FROM snapshots ORDER BY ts DESC LIMIT ?)"
        )
        .bind(SNAPSHOT_CAP)
        .run();
    },
    async hasClaim(txHash) {
      await ensureMigrated();
      const row = await db
        .prepare("SELECT 1 FROM burns WHERE txHash = ? LIMIT 1")
        .bind(txHash.toLowerCase())
        .first();
      return !!row;
    },
    async getDelta24h(currentTotal) {
      await ensureMigrated();
      const { results } = await db.prepare("SELECT ts, total FROM snapshots").all();
      return computeDelta24h((results ?? []) as Snapshot[], currentTotal);
    },
    async getLeaderboard(limit) {
      await ensureMigrated();
      return leaderboardFrom(await allBurns(), limit);
    },
    async getWalletStats(wallet) {
      await ensureMigrated();
      return walletStatsFrom(await allBurns(), wallet);
    },
  };
}

// ---------- selection ----------
async function getStore(): Promise<Store> {
  const env = await cfEnv();
  if (env?.GGB_DB) return d1Store(env.GGB_DB, env.GGB_KV ?? null);
  if (env?.GGB_KV) return blobStore(kvBackendFrom(env.GGB_KV));
  return blobStore((await fileBackend()) ?? memoryBackend);
}

// ---------- exported API (signatures unchanged) ----------
export async function hasClaim(txHash: string): Promise<boolean> {
  return (await getStore()).hasClaim(txHash);
}

/** Record a verified burn. Idempotent on txHash. Returns false if already counted. */
export async function recordBurn(r: BurnRecord): Promise<boolean> {
  return (await getStore()).recordBurn(r);
}

export async function recordSnapshot(total: number): Promise<void> {
  return (await getStore()).recordSnapshot(total);
}

export async function getDelta24h(currentTotal: number): Promise<number | null> {
  return (await getStore()).getDelta24h(currentTotal);
}

export async function getLeaderboard(limit = 50): Promise<Leaderboard> {
  return (await getStore()).getLeaderboard(limit);
}

export async function getWalletStats(wallet: string): Promise<LeaderRow | null> {
  return (await getStore()).getWalletStats(wallet);
}
