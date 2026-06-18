"use client";

import ConnectButton from "./ConnectButton";
import LangSwitcher from "./LangSwitcher";
import { useT } from "./providers/LangProvider";

/**
 * Unified top bar across all pages (brand + language + connect). Sticky so it
 * stays in reach while scrolling. Centered to the same 480px app column.
 */
export default function AppHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-doge-gold/10 bg-doge-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[480px] items-center justify-between gap-2 px-4 py-3">
        <a href="/" className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/incense.png"
            alt="狗狗上香"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="min-w-0 leading-tight">
            <h1 className="text-[15px] font-extrabold tracking-tight text-doge-cream">
              狗狗上香
            </h1>
            <p className="truncate text-[10px] text-doge-cream/50">{t("header.tagline")}</p>
          </div>
        </a>
        <div className="flex shrink-0 items-center gap-1.5">
          <LangSwitcher />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
