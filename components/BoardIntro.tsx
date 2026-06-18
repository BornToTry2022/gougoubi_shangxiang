"use client";

import { useT } from "@/components/providers/LangProvider";

/** Localized heading + intro for the 烧狗榜 page (the page itself is a server
 * component so it can export metadata). */
export default function BoardIntro() {
  const t = useT();
  return (
    <>
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-doge-gold/15 text-2xl shadow-glow">
          🏆
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-extrabold tracking-tight text-doge-cream">
            {t("board.title")}
          </h1>
          <p className="text-[11px] text-doge-cream/55">{t("board.subtitle")}</p>
        </div>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-doge-cream/55">
        {t("board.desc")}
        <b className="text-doge-amber"> {t("board.disc")}</b>
      </p>
    </>
  );
}
