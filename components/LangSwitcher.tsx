"use client";

import { LANGS } from "@/lib/i18n";
import { useLang } from "./providers/LangProvider";

/** Compact 简/繁/EN segmented toggle for the header. */
export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center rounded-full border border-doge-gold/20 bg-black/30 p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none transition ${
            lang === l.id ? "bg-doge-gold/20 text-doge-amber" : "text-doge-cream/55"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
