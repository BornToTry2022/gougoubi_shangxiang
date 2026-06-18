"use client";

import { useEffect, useRef, useState } from "react";
import type { BurnStats } from "@/lib/chain";
import Leaderboard from "@/components/Leaderboard";
import { useLang, useT } from "@/components/providers/LangProvider";
import {
  BSCSCAN,
  DEAD_ADDRESS,
  GGB,
  LINKS,
  formatNum,
  formatPct,
  shortAddr,
} from "@/lib/ggb";

const REFRESH_MS = 30_000;

export default function Dashboard({ initial }: { initial: BurnStats }) {
  const t = useT();
  const { lang } = useLang();
  const [stats, setStats] = useState<BurnStats>(initial);
  const [live, setLive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch("/api/burn", { cache: "no-store" });
        const json = await res.json();
        if (alive && json?.ok && json.stats) {
          setStats(json.stats);
          setLive(true);
        }
      } catch {
        /* keep last good value */
      }
    }
    const id = setInterval(tick, REFRESH_MS);
    tick();
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[480px] px-5 pt-5">
      <div className="flex justify-end">
        <LiveChip live={live} />
      </div>

      <HeroBurn value={stats.burnedTotal} pct={stats.pctBurned} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label={t("dash.stat_pct")} value={formatPct(stats.pctBurned)} hint={t("dash.stat_pct_hint")} />
        <Stat
          label={t("dash.stat_24h")}
          value={stats.delta24h != null ? "+" + formatNum(stats.delta24h, lang) + " 狗" : t("dash.stat_24h_pending")}
          hint={stats.delta24h != null ? t("dash.stat_24h_hint") : t("dash.stat_24h_hint_pending")}
          muted={stats.delta24h == null}
        />
        <Stat label={t("dash.stat_circ")} value={formatNum(stats.circulating, lang) + " 狗"} hint={t("dash.stat_circ_hint")} />
        <Stat label={t("dash.stat_total")} value={t("dash.stat_total_val")} hint={t("dash.stat_total_hint")} />
      </div>

      <Verify stats={stats} mounted={mounted} />

      <HonestNote />

      <ComingSoon />

      <section className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-doge-cream">{t("dash.top3_title")}</p>
          <a href="/board" className="text-[12px] text-doge-gold">
            {t("dash.top3_all")}
          </a>
        </div>
        <div className="mt-3">
          <Leaderboard limit={3} compact />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function LiveChip({ live }: { live: boolean }) {
  const t = useT();
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-doge-gold/25 bg-black/30 px-2.5 py-1 text-[11px] text-doge-cream/70">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          live ? "bg-emerald-400 animate-flicker" : "bg-doge-cream/40"
        }`}
      />
      {live ? t("dash.live_on") : t("dash.live_off")}
    </span>
  );
}

function HeroBurn({ value, pct }: { value: number; pct: number }) {
  const t = useT();
  const display = useCountUp(value);
  return (
    <section className="mt-7 animate-rise rounded-3xl border border-doge-gold/20 bg-gradient-to-b from-doge-char/80 to-black/50 p-6 text-center shadow-glow">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-doge-gold/80">
        {t("dash.hero_label")}
      </p>
      <div className="tnum mt-3 bg-gradient-to-b from-doge-amber to-doge-ember bg-clip-text text-5xl font-black leading-none text-transparent">
        {display.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </div>
      <p className="mt-2 text-sm text-doge-cream/60">{t("dash.hero_desc")}</p>
      <p className="mt-1 text-[11px] text-doge-cream/40">
        {t("dash.hero_pct_prefix")}
        {formatPct(pct)} · {t("dash.hero_verify")}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  muted,
}: {
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] text-doge-cream/50">{label}</p>
      <p
        className={`tnum mt-1.5 text-lg font-bold ${
          muted ? "text-doge-cream/45" : "text-doge-cream"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-doge-cream/35">{hint}</p> : null}
    </div>
  );
}

function Verify({ stats, mounted }: { stats: BurnStats; mounted: boolean }) {
  const t = useT();
  const rows = [
    { label: t("dash.verify_dead"), value: shortAddr(DEAD_ADDRESS), href: BSCSCAN.tokenHolding(DEAD_ADDRESS) },
    { label: t("dash.verify_contract"), value: shortAddr(GGB.address), href: BSCSCAN.address(GGB.address) },
  ];
  return (
    <section className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-doge-cream">{t("dash.verify_title")}</p>
        <span className="text-[10px] text-doge-cream/40" suppressHydrationWarning>
          {mounted ? t("dash.verify_updated") + new Date(stats.readAt).toLocaleTimeString() : t("dash.verify_realtime")}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <a
            key={r.label}
            href={r.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2.5 text-sm transition hover:bg-black/50"
          >
            <span className="text-doge-cream/60">{r.label}</span>
            <span className="tnum text-doge-gold">{r.value} ↗</span>
          </a>
        ))}
      </div>
      <p className="mt-2.5 text-[10px] leading-relaxed text-doge-cream/40">{t("dash.verify_note")}</p>
    </section>
  );
}

function HonestNote() {
  const t = useT();
  return (
    <section className="mt-4 rounded-2xl border border-doge-ember/25 bg-doge-ember/[0.06] p-4">
      <p className="text-sm font-semibold text-doge-amber">{t("dash.honest_title")}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-doge-cream/65">{t("dash.honest_body")}</p>
    </section>
  );
}

function ComingSoon() {
  const t = useT();
  return (
    <a
      href="/qian"
      className="mt-4 block rounded-2xl border border-doge-gold/30 bg-gradient-to-r from-doge-gold/[0.12] to-transparent p-4 transition hover:border-doge-gold/60"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-doge-cream">{t("dash.coming_title")}</p>
        <span className="text-doge-gold">{t("dash.coming_cta")}</span>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-doge-cream/60">{t("dash.coming_body")}</p>
    </a>
  );
}

function Footer() {
  const t = useT();
  const items = [
    { label: t("dash.foot_web"), href: LINKS.website },
    { label: "X / Twitter", href: LINKS.x },
    { label: "Telegram", href: LINKS.telegram },
    { label: "GitHub", href: LINKS.github },
  ];
  return (
    <footer className="mt-8 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px]">
        {items.map((i) => (
          <a
            key={i.label}
            href={i.href}
            target="_blank"
            rel="noreferrer"
            className="text-doge-cream/55 transition hover:text-doge-gold"
          >
            {i.label}
          </a>
        ))}
        <a href="/security" className="text-doge-cream/55 transition hover:text-doge-gold">
          {t("dash.foot_sec")}
        </a>
      </div>
      <p className="mt-3 text-[10px] text-doge-cream/30">{t("dash.foot_attr")}</p>
    </footer>
  );
}

/** Smoothly animate a number toward `target`. */
function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - k, 3); // easeOutCubic
      setValue(from + (target - from) * eased);
      if (k < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}
