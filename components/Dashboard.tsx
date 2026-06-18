"use client";

import { useEffect, useRef, useState } from "react";
import type { BurnStats } from "@/lib/chain";
import Leaderboard from "@/components/Leaderboard";
import {
  BSCSCAN,
  DEAD_ADDRESS,
  GGB,
  LINKS,
  formatCN,
  formatPct,
  shortAddr,
} from "@/lib/ggb";

const REFRESH_MS = 30_000;

export default function Dashboard({ initial }: { initial: BurnStats }) {
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
        <Stat
          label="已销毁占比"
          value={formatPct(stats.pctBurned)}
          hint="占 10 亿总量"
        />
        <Stat
          label="24h 新增销毁"
          value={stats.delta24h != null ? "+" + formatCN(stats.delta24h) + " 狗" : "记录累积中"}
          hint={stats.delta24h != null ? "近 24 小时" : "每日快照累积中"}
          muted={stats.delta24h == null}
        />
        <Stat label="流通量" value={formatCN(stats.circulating) + " 狗"} hint="总量 − 已销毁" />
        <Stat label="总量" value="10 亿 狗" hint="固定供应 · 不可增发" />
      </div>

      <Verify stats={stats} mounted={mounted} />

      <HonestNote />

      <ComingSoon />

      <section className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-doge-cream">🏆 烧狗榜 Top3</p>
          <a href="/board" className="text-[12px] text-doge-gold">
            完整榜单 →
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
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-doge-gold/25 bg-black/30 px-2.5 py-1 text-[11px] text-doge-cream/70">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          live ? "bg-emerald-400 animate-flicker" : "bg-doge-cream/40"
        }`}
      />
      {live ? "实时链上数据" : "连接中…"}
    </span>
  );
}

function HeroBurn({ value, pct }: { value: number; pct: number }) {
  const display = useCountUp(value);
  return (
    <section className="mt-7 animate-rise rounded-3xl border border-doge-gold/20 bg-gradient-to-b from-doge-char/80 to-black/50 p-6 text-center shadow-glow">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-doge-gold/80">
        🔥 累计烧狗
      </p>
      <div className="tnum mt-3 bg-gradient-to-b from-doge-amber to-doge-ember bg-clip-text text-5xl font-black leading-none text-transparent">
        {display.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </div>
      <p className="mt-2 text-sm text-doge-cream/60">
        狗狗币已永久打入黑洞地址
      </p>
      <p className="mt-1 text-[11px] text-doge-cream/40">
        占总量 {formatPct(pct)} · 每一笔都可在链上核对
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
  const rows: { label: string; value: string; href: string }[] = [
    {
      label: "黑洞地址",
      value: shortAddr(DEAD_ADDRESS),
      href: BSCSCAN.tokenHolding(DEAD_ADDRESS),
    },
    {
      label: "合约地址",
      value: shortAddr(GGB.address),
      href: BSCSCAN.address(GGB.address),
    },
  ];
  return (
    <section className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-doge-cream">🔎 数据可验证</p>
        <span className="text-[10px] text-doge-cream/40" suppressHydrationWarning>
          {mounted ? "更新于 " + new Date(stats.readAt).toLocaleTimeString("zh-CN") : "实时读取"}
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
      <p className="mt-2.5 text-[10px] leading-relaxed text-doge-cream/40">
        数字直接读取黑洞地址的狗狗币余额 —— 不依赖任何中心化记账，点开 BscScan 即可自行核对。
      </p>
    </section>
  );
}

function HonestNote() {
  return (
    <section className="mt-4 rounded-2xl border border-doge-ember/25 bg-doge-ember/[0.06] p-4">
      <p className="text-sm font-semibold text-doge-amber">⚠️ 重要声明</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-doge-cream/65">
        这是一块<b className="text-doge-cream">透明的链上销毁记分牌</b>，不是价格承诺。
        <b className="text-doge-cream">销毁 ≠ 拉盘。</b>
        销毁的意义是「公开、可验证、可累积」，给社区一个能亲手参与、能截图传播的东西——
        而不是直接影响币价。本项目为社区娱乐项目，<b className="text-doge-cream">非投资建议</b>。
      </p>
    </section>
  );
}

function ComingSoon() {
  return (
    <a
      href="/qian"
      className="mt-4 block rounded-2xl border border-doge-gold/30 bg-gradient-to-r from-doge-gold/[0.12] to-transparent p-4 transition hover:border-doge-gold/60"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-doge-cream">🀄 每日回本签 · 已上线</p>
        <span className="text-doge-gold">去求签 →</span>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-doge-cream/60">
        烧一点狗狗币，抽一张「回本签」，登上烧狗榜。每天一签，越旺的签烧得越多——
        把「躺平」变成「上香」。
      </p>
    </a>
  );
}

function Footer() {
  const items = [
    { label: "官网", href: LINKS.website },
    { label: "X / Twitter", href: LINKS.x },
    { label: "Telegram", href: LINKS.telegram },
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
        <a
          href="/security"
          className="text-doge-cream/55 transition hover:text-doge-gold"
        >
          🛡️ 安全说明
        </a>
      </div>
      <p className="mt-3 text-[10px] text-doge-cream/30">
        数据来源：BNB 链公共节点 · 第一个 BNB 链上的中文狗狗币
      </p>
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
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(from + (target - from) * eased);
      if (t < 1) {
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
