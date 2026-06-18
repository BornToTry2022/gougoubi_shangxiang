"use client";

import { useEffect, useState } from "react";
import { OUTCOME_META, outcomeName, type Outcome } from "@/lib/fortune";
import { formatNum, shortAddr } from "@/lib/ggb";
import { useLang, useT } from "@/components/providers/LangProvider";

type Row = {
  rank: number;
  wallet: string;
  totalBurned: number;
  totalPoints: number;
  draws: number;
  streak: number;
  bestOutcome: string;
};
type Resp = {
  ok: boolean;
  rows: Row[];
  totals: { wallets: number; burned: number; draws: number };
  me: Row | null;
};

function medal(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
}

export default function Leaderboard({
  limit = 50,
  wallet,
  compact = false,
}: {
  limit?: number;
  wallet?: string | null;
  compact?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (wallet) q.set("wallet", wallet);
    fetch(`/api/leaderboard?${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => (j?.ok ? setData(j) : setErr(true)))
      .catch(() => setErr(true));
  }, [limit, wallet]);

  if (err) return null;
  if (!data) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-center text-[12px] text-doge-cream/40">
        {t("board.loading")}
      </div>
    );
  }

  if (!data.rows.length) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center">
        <div className="text-3xl">🐕🔥</div>
        <p className="mt-2 text-[13px] text-doge-cream/70">{t("board.empty_head")}</p>
        <p className="mt-1 text-[11px] text-doge-cream/40">{t("board.empty_sub")}</p>
        <a href="/qian" className="mt-3 inline-block text-sm text-doge-gold">
          {t("board.empty_cta")}
        </a>
      </div>
    );
  }

  const meInTop = data.me && data.rows.some((r) => r.wallet === data.me!.wallet);

  return (
    <div className="space-y-2">
      {!compact ? (
        <div className="flex items-center justify-between rounded-2xl border border-doge-gold/15 bg-doge-gold/[0.05] px-4 py-2.5 text-[11px] text-doge-cream/55">
          <span>{t("board.stats_wallets", { n: data.totals.wallets })}</span>
          <span>{t("board.stats_burned", { burned: formatNum(data.totals.burned, lang), draws: data.totals.draws })}</span>
        </div>
      ) : null}

      {data.rows.map((r) => (
        <Line key={r.wallet} row={r} me={r.wallet === data.me?.wallet} />
      ))}

      {data.me && !meInTop ? (
        <>
          <div className="py-1 text-center text-doge-cream/30">···</div>
          <Line row={data.me} me />
        </>
      ) : null}

      {!compact ? (
        <a
          href="/qian"
          className="mt-2 block rounded-2xl bg-gradient-to-r from-doge-amber to-doge-ember py-3 text-center text-sm font-black text-doge-ink shadow-glow"
        >
          {t("board.cta")}
        </a>
      ) : null}
    </div>
  );
}

function Line({ row, me }: { row: Row; me?: boolean }) {
  const t = useT();
  const { lang } = useLang();
  const om = OUTCOME_META[row.bestOutcome as Outcome];
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        me ? "border-doge-gold/50 bg-doge-gold/[0.08]" : "border-white/8 bg-white/[0.03]"
      }`}
    >
      <div className="w-8 shrink-0 text-center text-sm font-black tabular-nums text-doge-cream">
        {medal(row.rank)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-doge-cream">
            {shortAddr(row.wallet)}
          </span>
          {me ? <span className="text-[10px] text-doge-gold">{t("board.me")}</span> : null}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-doge-cream/45">
          <span>{t("board.row_draws", { n: row.draws })}</span>
          {row.streak > 1 ? <span>{t("board.row_streak", { n: row.streak })}</span> : null}
          {om ? (
            <span style={{ color: om.color }}>
              {t("board.row_best", { outcome: outcomeName(row.bestOutcome as Outcome, lang) })}
            </span>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="tnum text-sm font-black text-doge-amber">{formatNum(row.totalBurned, lang)}</div>
        <div className="text-[10px] text-doge-cream/40">{t("board.unit")}</div>
      </div>
    </div>
  );
}
