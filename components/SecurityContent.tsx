"use client";

import { GGB, DEAD_ADDRESS, BSCSCAN, shortAddr, LINKS } from "@/lib/ggb";
import { useT } from "./providers/LangProvider";

export default function SecurityContent() {
  const t = useT();
  const audits = [
    { key: "sec.audit1", href: `https://gopluslabs.io/token-security/56/${GGB.address}` },
    { key: "sec.audit2", href: `https://honeypot.is/?address=${GGB.address}&chain=bsc` },
    { key: "sec.audit3", href: BSCSCAN.address(GGB.address) },
    { key: "sec.audit4", href: BSCSCAN.tokenHolding(DEAD_ADDRESS) },
  ];

  return (
    <main className="mx-auto w-full max-w-[480px] px-5 pt-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-doge-gold/15 text-2xl shadow-glow">
          🛡️
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-extrabold tracking-tight text-doge-cream">{t("sec.title")}</h1>
          <p className="text-[11px] text-doge-cream/55">{t("sec.subtitle")}</p>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <h2 className="text-sm font-bold text-doge-cream">
          <span className="text-doge-gold">①</span> {t("sec.s1_cn")}
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-doge-cream/75">{t("sec.s1_body")}</p>
      </section>

      <a
        href={LINKS.github}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center justify-between rounded-2xl border border-doge-gold/30 bg-doge-gold/[0.08] p-4"
      >
        <div>
          <p className="text-sm font-bold text-doge-amber">{t("sec.opensrc")}</p>
          <p className="mt-0.5 text-[12px] text-doge-cream/65">{t("sec.opensrc_d")}</p>
        </div>
        <span className="shrink-0 text-doge-gold">GitHub ↗</span>
      </a>

      <section className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <h2 className="text-sm font-bold text-doge-cream">
          <span className="text-doge-gold">②</span> {t("sec.s2_cn")}
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-doge-cream/75">{t("sec.s2_body")}</p>
        <div className="mt-3 space-y-2">
          {audits.map((a) => (
            <a
              key={a.href}
              href={a.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2.5 text-sm transition hover:bg-black/50"
            >
              <span className="text-doge-cream/75">{t(a.key)}</span>
              <span className="text-doge-gold">↗</span>
            </a>
          ))}
        </div>
      </section>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <p className="text-[11px] text-doge-cream/50">{t("sec.contract")}</p>
        <a
          href={BSCSCAN.address(GGB.address)}
          target="_blank"
          rel="noreferrer"
          className="tnum mt-1 block break-all text-[12px] text-doge-amber"
        >
          {GGB.address} ↗
        </a>
        <p className="mt-2 text-[11px] text-doge-cream/45">
          {t("sec.burn_addr")}
          {shortAddr(DEAD_ADDRESS)} {t("sec.burn_note")}
        </p>
      </div>

      <p className="mt-6 text-center text-[11px] text-doge-cream/35">{t("sec.disc")}</p>
      <div className="mt-3 text-center">
        <a href="/" className="text-[12px] text-doge-gold">
          {t("sec.back")}
        </a>
      </div>
    </main>
  );
}
