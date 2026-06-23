"use client";

// Client chrome for the shareable card page. Lives in a client component so the
// buttons / copy and the PNG download link all follow the live language switch
// (the same LangProvider the rest of the dApp uses).
import ResultCard, { type CardData } from "@/components/ResultCard";
import { BSCSCAN } from "@/lib/ggb";
import { useLang, useT } from "@/components/providers/LangProvider";

export default function CardPageClient({
  data,
  txHash,
  error,
}: {
  data: CardData | null;
  txHash: string;
  error?: string;
}) {
  const t = useT();
  const { lang } = useLang();

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-[480px] px-5 py-16 text-center">
        <div className="text-5xl">🐕❓</div>
        <p className="mt-4 text-doge-cream/80">{t("cardpage.notfound")}</p>
        {error ? <p className="mt-1 text-[12px] text-doge-cream/45">{error}</p> : null}
        <a href="/qian" className="mt-6 inline-block text-doge-gold">
          {t("cardpage.go_draw")}
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[480px] px-5 py-8">
      <ResultCard data={data} />
      <div className="mt-4 space-y-2.5">
        <a
          href={`/api/card/${txHash}?lang=${lang}`}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-2xl border border-doge-gold/30 bg-doge-gold/[0.08] py-3 text-center text-sm font-semibold text-doge-amber"
        >
          {t("cardpage.save")}
        </a>
        <a
          href={BSCSCAN.tx(txHash)}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-semibold text-doge-cream"
        >
          {t("cardpage.verify")}
        </a>
        <a
          href="/qian"
          className="block w-full rounded-2xl bg-gradient-to-r from-doge-amber to-doge-ember py-3.5 text-center text-base font-black text-doge-ink shadow-glow"
        >
          {t("cardpage.draw_me")}
        </a>
        <a
          href="/"
          className="block w-full rounded-2xl border border-white/10 py-3 text-center text-sm text-doge-cream/70"
        >
          {t("cardpage.board")}
        </a>
      </div>
      <p className="mt-4 text-center text-[11px] text-doge-cream/40">{t("cardpage.disc")}</p>
    </main>
  );
}
