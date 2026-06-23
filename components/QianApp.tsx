"use client";

import { useCallback, useEffect, useState } from "react";
import { parseUnits } from "viem";
import { useConnection, useSwitchChain, useWriteContract } from "wagmi";
import { publicClient } from "@/lib/chain";
import { openWalletModal } from "./providers/WalletProvider";
import { useLang, useT } from "./providers/LangProvider";
import type { Lang } from "@/lib/i18n";
import {
  DRAW_TIERS,
  type DrawTier,
  localizeFortune,
  outcomeName,
  tierName,
} from "@/lib/fortune";
import {
  BSC_CHAIN_ID,
  DEAD_ADDRESS,
  ERC20_ABI,
  GGB,
  LINKS,
  formatNum,
} from "@/lib/ggb";
import ResultCard, { type CardData } from "./ResultCard";

type T = ReturnType<typeof useT>;
type Phase = "idle" | "confirming" | "mining" | "verifying" | "done" | "error";

export default function QianApp() {
  const t = useT();
  const { lang } = useLang();
  const { address, isConnected, chainId } = useConnection();
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync } = useWriteContract();

  // Raw on-chain balance in wei (bigint) — compared exactly against the tier cost.
  // Storing a Number here loses precision at 1e23 (king tier) and wrongly blocks it.
  const [balRaw, setBalRaw] = useState<bigint | null>(null);
  const [tier, setTier] = useState<DrawTier>(DRAW_TIERS[1]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [card, setCard] = useState<CardData | null>(null);
  const [myStat, setMyStat] = useState<{
    rank: number | null;
    totalBurned: number;
    streak: number;
  } | null>(null);

  const readBalance = useCallback(async (addr: string): Promise<bigint | null> => {
    try {
      return (await publicClient.readContract({
        address: GGB.address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [addr as `0x${string}`],
      })) as bigint;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!address) {
      setBalRaw(null);
      return;
    }
    // Guard against a stale result after disconnect / account switch.
    let alive = true;
    readBalance(address).then((raw) => {
      if (alive) setBalRaw(raw);
    });
    return () => {
      alive = false;
    };
  }, [address, readBalance]);

  const drawNow = useCallback(async () => {
    if (!address) return;
    setError("");
    setCard(null);
    setPhase("confirming");
    try {
      if (chainId !== BSC_CHAIN_ID) {
        await switchChainAsync({ chainId: BSC_CHAIN_ID });
      }
      const amountWei = parseUnits(String(tier.burn), GGB.decimals);

      // Trust model unchanged: ONE transfer to the dead address. Never approve.
      const hash = await writeContractAsync({
        address: GGB.address,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [DEAD_ADDRESS, amountWei],
        chainId: BSC_CHAIN_ID,
      });

      setPhase("mining");
      await publicClient.waitForTransactionReceipt({ hash });

      setPhase("verifying");
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash }),
      });
      let json;
      try {
        json = await res.json();
      } catch {
        json = null; // non-JSON body (e.g. an infra/HTML error page)
      }
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? t("qian.err_verify"));

      setCard({
        ...json.fortune,
        tierId: json.tier.id,
        tierName: json.tier.name,
        tierEmoji: json.tier.emoji,
        amount: json.burn.amount,
        txHash: json.txHash,
        from: json.burn.from,
        dateLabel: new Date().toLocaleDateString(),
      });
      setMyStat({
        rank: json.rank ?? null,
        totalBurned: json.walletStats?.totalBurned ?? json.burn.amount,
        streak: json.walletStats?.streak ?? 1,
      });
      setPhase("done");
      readBalance(address).then((raw) => setBalRaw(raw));
    } catch (e) {
      setPhase("error");
      const msg = (e as Error)?.message ?? t("qian.err_draw");
      setError(/reject|denied|user/i.test(msg) ? t("qian.err_cancel") : msg.slice(0, 160));
    }
  }, [address, chainId, tier, switchChainAsync, writeContractAsync, readBalance, t]);

  const insufficient =
    balRaw != null && balRaw < parseUnits(String(tier.burn), GGB.decimals);
  const busy = ["confirming", "mining", "verifying"].includes(phase);

  return (
    <main className="mx-auto w-full max-w-[480px] px-5 pt-6">
      {card && phase === "done" ? (
        <div className="mt-2 animate-rise">
          <ResultCard data={card} />
          {myStat ? <MyRank stat={myStat} /> : null}
          <Actions card={card} onAgain={() => setPhase("idle")} />
        </div>
      ) : (
        <>
          <Intro />
          <TierPicker tier={tier} setTier={setTier} disabled={busy} />

          <div className="mt-6">
            {!isConnected ? (
              <Button onClick={openWalletModal} disabled={busy}>
                {t("qian.connect")}
              </Button>
            ) : insufficient ? (
              <a href={LINKS.buy} target="_blank" rel="noreferrer">
                <Button as="span">{t("qian.insufficient")}</Button>
              </a>
            ) : (
              <Button onClick={drawNow} disabled={busy}>
                {phaseLabel(phase, tier, t, lang)}
              </Button>
            )}
            {isConnected && insufficient ? (
              <p className="mt-2 text-center text-[12px] text-doge-cream/45">
                {t("qian.balance_check", {
                  balance: formatNum(Number(balRaw!) / 10 ** GGB.decimals, lang),
                  tier: tierName(tier.id, lang),
                  need: formatNum(tier.burn, lang),
                })}
              </p>
            ) : null}
          </div>

          {!isConnected ? <WalletSupport /> : null}
          {error ? (
            <p className="mt-3 text-center text-[12px] text-rose-300/80">{error}</p>
          ) : null}
        </>
      )}

      <HowItWorks />
      <Footer />
    </main>
  );
}

function phaseLabel(phase: Phase, tier: DrawTier, t: T, lang: Lang): string {
  switch (phase) {
    case "confirming":
      return t("qian.phase_confirming");
    case "mining":
      return t("qian.phase_mining");
    case "verifying":
      return t("qian.phase_verifying");
    default:
      return t("qian.phase_draw", { burn: formatNum(tier.burn, lang) });
  }
}

function WalletSupport() {
  const t = useT();
  return (
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2 rounded-full border border-doge-gold/20 bg-black/30 px-3 py-1.5">
        <span className="h-3.5 w-3.5 rounded-full bg-doge-gold" aria-hidden />
        <span className="text-[11px] text-doge-cream/60">{t("qian.support")}</span>
      </div>
      <p className="text-[11px] text-doge-cream/40">{t("qian.support_hint")}</p>
    </div>
  );
}

function Intro() {
  const t = useT();
  return (
    <section className="mt-2 rounded-3xl border border-doge-gold/20 bg-gradient-to-b from-doge-char/80 to-black/40 p-6 text-center shadow-glow">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/incense.png"
        alt="狗狗上香求签"
        width={128}
        height={128}
        className="mx-auto h-32 w-32 object-contain drop-shadow-[0_0_24px_rgba(255,122,24,0.35)]"
      />
      <h2 className="mt-2 text-xl font-black text-doge-cream">{t("qian.intro_title")}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-doge-cream/65">{t("qian.intro_body")}</p>
    </section>
  );
}

function TierPicker({
  tier,
  setTier,
  disabled,
}: {
  tier: DrawTier;
  setTier: (t: DrawTier) => void;
  disabled: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  return (
    <section className="mt-5 grid grid-cols-3 gap-2.5">
      {DRAW_TIERS.map((dt) => {
        const active = dt.id === tier.id;
        return (
          <button
            key={dt.id}
            disabled={disabled}
            onClick={() => setTier(dt)}
            className={`rounded-2xl border p-3 text-center transition disabled:opacity-50 ${
              active ? "border-doge-gold bg-doge-gold/10 shadow-glow" : "border-white/8 bg-white/[0.03]"
            }`}
            style={active ? { borderColor: dt.accent } : undefined}
          >
            <div className="text-2xl">{dt.emoji}</div>
            <div className="mt-1 text-sm font-bold text-doge-cream">{tierName(dt.id, lang)}</div>
            <div className="tnum mt-0.5 text-[11px] text-doge-cream/55">
              {t("qian.tier_cost", { burn: formatNum(dt.burn, lang) })}
            </div>
            <div className="mt-1 text-[10px]" style={{ color: dt.accent }}>
              {t("qian.tier_prob", { pct: Math.round((dt.weights.上上签 / total(dt)) * 100) })}
            </div>
          </button>
        );
      })}
    </section>
  );
}

function total(t: DrawTier): number {
  return Object.values(t.weights).reduce((a, b) => a + b, 0);
}

function Button({
  children,
  onClick,
  disabled,
  as,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  as?: "button" | "span";
}) {
  const cls =
    "block w-full rounded-2xl bg-gradient-to-r from-doge-amber to-doge-ember px-5 py-4 text-center text-base font-black text-doge-ink shadow-glow transition active:scale-[0.99] disabled:opacity-60";
  if (as === "span") return <span className={cls}>{children}</span>;
  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Actions({ card, onAgain }: { card: CardData; onAgain: () => void }) {
  const t = useT();
  const { lang } = useLang();
  const [hint, setHint] = useState(false);
  // PNG card follows the dApp's current language (?lang=…).
  const cardUrl = card.txHash ? `/api/card/${card.txHash}?lang=${lang}` : null;

  const loc =
    card.txHash != null
      ? localizeFortune(card.txHash, card.outcome, lang)
      : { verdict: card.verdict, yi: card.yi, ji: card.ji };
  const shareText = t("qian.share_text", {
    outcome: outcomeName(card.outcome, lang),
    verdict: loc.verdict,
    huiben: card.huiben,
    amount: formatNum(card.amount, lang),
  });

  const copy = () => {
    navigator.clipboard?.writeText(shareText + " " + LINKS.website).catch(() => {});
  };

  const saveCard = async () => {
    if (!cardUrl) return;
    try {
      const n = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (n.share && n.canShare) {
        const resp = await fetch(cardUrl);
        const blob = await resp.blob();
        const file = new File([blob], `ggb-qian-${card.txHash!.slice(0, 10)}.png`, {
          type: blob.type || "image/png",
        });
        if (n.canShare({ files: [file] })) {
          await n.share({ files: [file], text: shareText });
          return;
        }
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    const opened = window.open(cardUrl, "_blank");
    if (opened) setHint(true);
    else navigator.clipboard?.writeText(location.origin + cardUrl).catch(() => {});
  };

  return (
    <div className="mt-4 space-y-2.5">
      {cardUrl ? (
        <button
          onClick={saveCard}
          className="block w-full rounded-2xl border border-doge-gold/30 bg-doge-gold/[0.08] py-3 text-center text-sm font-semibold text-doge-amber"
        >
          {t("qian.act_save")}
        </button>
      ) : null}
      {hint ? (
        <p className="text-center text-[11px] text-doge-cream/50">{t("qian.act_save_hint")}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={copy}
          className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-doge-cream"
        >
          {t("qian.act_copy")}
        </button>
        {card.txHash ? (
          <a
            href={`https://bscscan.com/tx/${card.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-semibold text-doge-cream"
          >
            {t("qian.act_receipt")}
          </a>
        ) : null}
      </div>
      <button
        onClick={onAgain}
        className="block w-full rounded-2xl bg-gradient-to-r from-doge-amber to-doge-ember py-3.5 text-center text-base font-black text-doge-ink shadow-glow"
      >
        {t("qian.act_again")}
      </button>
      <p className="pt-1 text-center text-[11px] text-doge-cream/40">{t("qian.act_share_hint")}</p>
    </div>
  );
}

function MyRank({
  stat,
}: {
  stat: { rank: number | null; totalBurned: number; streak: number };
}) {
  const t = useT();
  const { lang } = useLang();
  return (
    <a
      href="/board"
      className="mt-4 block rounded-2xl border border-doge-gold/30 bg-gradient-to-r from-doge-gold/[0.12] to-transparent p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-doge-cream/60">{t("qian.rank_title")}</span>
        <span className="text-[12px] text-doge-gold">{t("qian.rank_full")}</span>
      </div>
      <div className="mt-1.5 flex items-end gap-3">
        <div>
          <span className="text-[11px] text-doge-cream/45">{t("qian.rank_label")}</span>
          <div className="tnum text-2xl font-black text-doge-amber">
            {stat.rank ? `#${stat.rank}` : "—"}
          </div>
        </div>
        <div className="flex-1 text-right text-[11px] text-doge-cream/55">
          {t("qian.rank_total", { n: formatNum(stat.totalBurned, lang) })}
          {stat.streak > 1 ? <span> · {t("qian.rank_streak", { n: stat.streak })}</span> : null}
        </div>
      </div>
    </a>
  );
}

function HowItWorks() {
  const t = useT();
  const steps = [
    ["1", t("qian.howto1t"), t("qian.howto1d")],
    ["2", t("qian.howto2t"), t("qian.howto2d")],
    ["3", t("qian.howto3t"), t("qian.howto3d")],
    ["4", t("qian.howto4t"), t("qian.howto4d")],
  ];
  return (
    <section className="mt-8">
      <h3 className="text-sm font-semibold text-doge-cream/80">{t("qian.howto")}</h3>
      <div className="mt-3 space-y-2">
        {steps.map(([n, title, d]) => (
          <div key={n} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-doge-gold/20 text-xs font-bold text-doge-gold">
              {n}
            </span>
            <div>
              <div className="text-[13px] font-semibold text-doge-cream">{title}</div>
              <div className="text-[11px] text-doge-cream/50">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const t = useT();
  return (
    <footer className="mt-8 text-center text-[11px] text-doge-cream/35">
      <p>{t("qian.foot_brand")}</p>
      <p className="mt-1">{t("qian.foot_disc")}</p>
    </footer>
  );
}
