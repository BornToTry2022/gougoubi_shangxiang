-- 烧狗榜 D1 schema (reference / manual apply only).
-- The app auto-creates these tables on first request (lib/store.ts ensureMigrated),
-- so you normally do NOT need to run this. To apply by hand anyway:
--   wrangler d1 execute ggb-leaderboard --remote --file=./db/schema.sql
--
-- burns.txHash is the PRIMARY KEY → INSERT OR IGNORE makes recording a burn
-- atomic and idempotent (no read-modify-write race, no double-count, no lost rows).

CREATE TABLE IF NOT EXISTS burns (
  txHash  TEXT PRIMARY KEY,
  wallet  TEXT NOT NULL,
  amount  REAL NOT NULL,
  points  INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  tier    TEXT NOT NULL,
  ts      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_burns_wallet ON burns(wallet);

-- one cumulative-burn snapshot per timestamp (ts unique → idempotent backfill).
CREATE TABLE IF NOT EXISTS snapshots (
  ts    INTEGER PRIMARY KEY,
  total REAL NOT NULL
);
