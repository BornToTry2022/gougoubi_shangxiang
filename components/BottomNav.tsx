"use client";

import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  emoji: string;
  /** active when the path matches exactly (home) or starts with the prefix */
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/", label: "销毁", emoji: "🔥", match: (p) => p === "/" },
  { href: "/qian", label: "求签", emoji: "🎴", match: (p) => p.startsWith("/qian") },
  { href: "/board", label: "榜单", emoji: "🏆", match: (p) => p.startsWith("/board") },
];

/**
 * App-style fixed bottom tab bar. Centered to the same 480px app column so it
 * reads as a floating dock on desktop and a full bar on phones. Honors the
 * iOS home-indicator safe area. Each page keeps its own URL (TG can deep-link).
 */
export default function BottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto max-w-[480px] px-3 pb-3">
        <div className="flex items-stretch gap-1 rounded-2xl border border-doge-gold/15 bg-doge-char/85 p-1.5 shadow-glow backdrop-blur-xl">
          {TABS.map((t) => {
            const active = t.match(pathname);
            return (
              <a
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-center transition active:scale-[0.97] ${
                  active
                    ? "bg-doge-gold/12 text-doge-amber"
                    : "text-doge-cream/55 hover:text-doge-cream/80"
                }`}
              >
                <span className={`text-xl leading-none ${active ? "drop-shadow-[0_0_8px_rgba(255,207,51,0.45)]" : ""}`}>
                  {t.emoji}
                </span>
                <span className="text-[11px] font-semibold leading-none">{t.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
