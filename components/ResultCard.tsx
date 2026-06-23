"use client";

import {
  OUTCOME_META,
  localizeFortune,
  outcomeLabel,
  outcomeName,
  tierName,
  type DrawTier,
  type FortuneResult,
} from "@/lib/fortune";
import { formatNum, shortAddr } from "@/lib/ggb";
import { useLang, useT } from "./providers/LangProvider";

export type CardData = FortuneResult & {
  tierId?: DrawTier["id"];
  tierName: string;
  tierEmoji: string;
  amount: number;
  txHash?: string;
  from?: string;
  /** Header chip on the right. Falls back to the localized "链上可验证". */
  dateLabel?: string;
};

export default function ResultCard({ data }: { data: CardData }) {
  const t = useT();
  const { lang } = useLang();
  const meta = OUTCOME_META[data.outcome];

  // Re-localize the verdict/宜/忌 from the tx hash (same deterministic slot).
  const loc =
    data.txHash != null
      ? localizeFortune(data.txHash, data.outcome, lang)
      : { verdict: data.verdict, yi: data.yi, ji: data.ji };
  const tName = data.tierId ? tierName(data.tierId, lang) : data.tierName;

  return (
    <div
      id="qian-card"
      className="relative w-full overflow-hidden rounded-[28px] border p-6 text-center"
      style={{
        borderColor: meta.color + "55",
        background: `radial-gradient(120% 80% at 50% 0%, ${meta.glow}, transparent 60%), linear-gradient(180deg, #1b150c 0%, #0b0805 100%)`,
        boxShadow: `0 0 60px -16px ${meta.glow}`,
      }}
    >
      {/* header */}
      <div className="flex items-center justify-between text-[11px] text-doge-cream/55">
        <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1">
          {data.tierEmoji} {tName}
        </span>
        <span>{data.dateLabel ?? t("card.verifiable")}</span>
      </div>

      {/* outcome */}
      <div className="mt-5">
        <div className="text-[13px] tracking-[0.3em] text-doge-cream/50">
          {outcomeLabel(data.outcome, lang)}
        </div>
        <div
          className="mt-1 text-6xl font-black leading-none"
          style={{ color: meta.color, textShadow: `0 0 28px ${meta.glow}` }}
        >
          {outcomeName(data.outcome, lang)}
        </div>
      </div>

      <div className="my-4 text-4xl">🐕</div>

      {/* verdict */}
      <p className="mx-auto max-w-[20rem] text-[15px] font-medium leading-relaxed text-doge-cream/90">
        「{loc.verdict}」
      </p>

      {/* meters */}
      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <div className="text-[10px] text-doge-cream/45">{t("card.recovery")}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${data.huiben}%`, background: meta.color }} />
            </div>
            <span className="tnum text-sm font-bold" style={{ color: meta.color }}>
              {data.huiben}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <div className="text-[10px] text-doge-cream/45">{t("card.lucky")}</div>
          <div className="tnum mt-1 text-2xl font-black text-doge-cream">{data.lucky}</div>
        </div>
      </div>

      {/* yi / ji */}
      <div className="mt-3 flex gap-3 text-left text-[13px]">
        <div className="flex-1 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
          <span className="text-emerald-300/80">{t("card.yi")}</span>
          <span className="ml-1.5 text-doge-cream/85">{loc.yi}</span>
        </div>
        <div className="flex-1 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3">
          <span className="text-rose-300/80">{t("card.ji")}</span>
          <span className="ml-1.5 text-doge-cream/85">{loc.ji}</span>
        </div>
      </div>

      {/* burn receipt */}
      <div className="mt-5 rounded-2xl bg-black/40 p-3 text-[11px] text-doge-cream/55">
        {t("card.receipt", { amount: formatNum(data.amount, lang) })}
        {data.txHash ? (
          <div className="mt-1 text-doge-cream/40">
            {t("card.proof", { tx: shortAddr(data.txHash) })}
          </div>
        ) : null}
      </div>

      {/* branding */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-doge-cream/35">
        <span>{t("card.brand_left")}</span>
        <span>{t("card.brand_right")}</span>
      </div>
    </div>
  );
}
