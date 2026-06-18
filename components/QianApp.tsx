"use client";

import { useCallback, useEffect, useState } from "react";
import { parseUnits } from "viem";
import { useConnection, useSwitchChain, useWriteContract } from "wagmi";
import { publicClient } from "@/lib/chain";
import { openWalletModal } from "./providers/WalletProvider";
import { DRAW_TIERS, type DrawTier } from "@/lib/fortune";
import {
  BSC_CHAIN_ID,
  DEAD_ADDRESS,
  ERC20_ABI,
  GGB,
  LINKS,
  formatCN,
} from "@/lib/ggb";
import ResultCard, { type CardData } from "./ResultCard";

type Phase =
  | "idle"
  | "confirming"
  | "mining"
  | "verifying"
  | "done"
  | "error";

export default function QianApp() {
  const { address, isConnected, chainId } = useConnection();
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync } = useWriteContract();

  const [balance, setBalance] = useState<number | null>(null);
  const [tier, setTier] = useState<DrawTier>(DRAW_TIERS[1]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [card, setCard] = useState<CardData | null>(null);
  const [myStat, setMyStat] = useState<{
    rank: number | null;
    totalBurned: number;
    streak: number;
  } | null>(null);

  // Read GGB balance straight from our own multi-RPC client (resilient fallback).
  const readBalance = useCallback(async (addr: string) => {
    try {
      const raw = (await publicClient.readContract({
        address: GGB.address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [addr as `0x${string}`],
      })) as bigint;
      setBalance(Number(raw) / 10 ** GGB.decimals);
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    if (address) readBalance(address);
    else setBalance(null);
  }, [address, readBalance]);

  const drawNow = useCallback(async () => {
    if (!address) return;
    setError("");
    setCard(null);
    setPhase("confirming");
    try {
      // Force BSC (AppKit only offers chain 56, but a connected wallet may sit
      // on another chain). switchChainAsync prompts wallet_switchEthereumChain.
      if (chainId !== BSC_CHAIN_ID) {
        await switchChainAsync({ chainId: BSC_CHAIN_ID });
      }
      const amountWei = parseUnits(String(tier.burn), GGB.decimals);

      // Trust model unchanged: ONE transfer to the dead address. Never approve.
      // chainId is also pinned on the write itself — wagmi throws a chain-mismatch
      // error rather than ever sending on the wrong chain.
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
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error ?? "验证失败");

      setCard({
        ...json.fortune,
        tierName: json.tier.name,
        tierEmoji: json.tier.emoji,
        amount: json.burn.amount,
        txHash: json.txHash,
        from: json.burn.from,
        dateLabel: new Date().toLocaleDateString("zh-CN"),
      });
      setMyStat({
        rank: json.rank ?? null,
        totalBurned: json.walletStats?.totalBurned ?? json.burn.amount,
        streak: json.walletStats?.streak ?? 1,
      });
      setPhase("done");
      readBalance(address);
    } catch (e) {
      setPhase("error");
      const msg = (e as Error)?.message ?? "求签失败";
      // friendlier message for user rejection
      setError(
        /reject|denied|user/i.test(msg) ? "你取消了这次求签" : msg.slice(0, 160)
      );
    }
  }, [address, chainId, tier, switchChainAsync, writeContractAsync, readBalance]);

  const insufficient = balance != null && balance < tier.burn;
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
                🔗 连接钱包求签
              </Button>
            ) : insufficient ? (
              <a href={LINKS.buy} target="_blank" rel="noreferrer">
                <Button as="span">余额不足 · 去买狗狗币 ↗</Button>
              </a>
            ) : (
              <Button onClick={drawNow} disabled={busy}>
                {phaseLabel(phase, tier)}
              </Button>
            )}
            {isConnected && insufficient ? (
              <p className="mt-2 text-center text-[12px] text-doge-cream/45">
                当前余额 {formatCN(balance!)} 狗，{tier.name}需 {formatCN(tier.burn)} 狗
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

function phaseLabel(phase: Phase, tier: DrawTier): string {
  switch (phase) {
    case "confirming":
      return "请在钱包确认…";
    case "mining":
      return "上链中…";
    case "verifying":
      return "验证销毁中…";
    default:
      return `🀄 求签 · 烧 ${formatCN(tier.burn)} 狗`;
  }
}

/**
 * Wallet-support strip shown under the connect CTA. Names the wallets users can
 * connect with — 币安钱包 first (Binance Discover self-listing wants the Binance
 * brand exposed on the connect surface).
 *
 * 业主待办（合规）：Discover 上架前，把官方「币安钱包」logo 放到
 * /public/binance-wallet.svg，并在这里用 <img src="/binance-wallet.svg"> 替换下面
 * 的金色圆点徽标（官方品牌素材，避免商标问题）。功能不依赖它。
 */
function WalletSupport() {
  return (
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2 rounded-full border border-doge-gold/20 bg-black/30 px-3 py-1.5">
        <span className="h-3.5 w-3.5 rounded-full bg-doge-gold" aria-hidden />
        <span className="text-[11px] text-doge-cream/60">
          支持 <b className="text-doge-gold">币安钱包</b> · OKX · Trust · MetaMask
        </span>
      </div>
      <p className="text-[11px] text-doge-cream/40">
        手机浏览器点「连接钱包」扫码或跳转；钱包内置浏览器自动直连
      </p>
    </div>
  );
}

function Intro() {
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
      <h2 className="mt-2 text-xl font-black text-doge-cream">把「躺平」变成「上香」</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-doge-cream/65">
        每天烧一点狗狗币求一签，狗狗币直接打入黑洞地址（永久销毁）。
        越旺的签烧得越多，登上「烧狗榜」。
        <b className="text-doge-amber"> 销毁可在链上核对，娱乐玄学、非投资建议。</b>
      </p>
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
  return (
    <section className="mt-5 grid grid-cols-3 gap-2.5">
      {DRAW_TIERS.map((t) => {
        const active = t.id === tier.id;
        return (
          <button
            key={t.id}
            disabled={disabled}
            onClick={() => setTier(t)}
            className={`rounded-2xl border p-3 text-center transition disabled:opacity-50 ${
              active
                ? "border-doge-gold bg-doge-gold/10 shadow-glow"
                : "border-white/8 bg-white/[0.03]"
            }`}
            style={active ? { borderColor: t.accent } : undefined}
          >
            <div className="text-2xl">{t.emoji}</div>
            <div className="mt-1 text-sm font-bold text-doge-cream">{t.name}</div>
            <div className="tnum mt-0.5 text-[11px] text-doge-cream/55">
              烧 {formatCN(t.burn)} 狗
            </div>
            <div className="mt-1 text-[10px]" style={{ color: t.accent }}>
              上上签 {Math.round((t.weights.上上签 / total(t)) * 100)}%
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
  const shareText = `我在 #狗狗币 回本签求得「${card.outcome}」：${card.verdict} 回本指数${card.huiben}。今日烧 ${formatCN(card.amount)} 狗上香 🐕🔥`;
  const [hint, setHint] = useState(false);
  const cardUrl = card.txHash ? `/api/card/${card.txHash}` : null;

  const copy = () => {
    navigator.clipboard?.writeText(shareText + " " + LINKS.website).catch(() => {});
  };

  // webview-safe save: try Web Share with the PNG file (works in most wallet /
  // Telegram in-app browsers where a direct download is blocked); otherwise open
  // the image and let the user long-press to save.
  const saveCard = async () => {
    if (!cardUrl) return;
    try {
      const n = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (n.share && n.canShare) {
        const resp = await fetch(cardUrl);
        const blob = await resp.blob();
        const file = new File(
          [blob],
          `ggb-qian-${card.txHash!.slice(0, 10)}.png`,
          { type: blob.type || "image/png" }
        );
        if (n.canShare({ files: [file] })) {
          await n.share({ files: [file], text: shareText });
          return;
        }
      }
    } catch (e) {
      // User dismissed the native share sheet — don't then pop a stray tab.
      if ((e as Error)?.name === "AbortError") return;
      /* genuinely unsupported → fall through to long-press save */
    }
    // Fallback: open the image so the user can long-press to save. Some webviews
    // block window.open (returns null) — then offer the copy-link path instead.
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
          🖼 保存 / 分享签卡图片
        </button>
      ) : null}
      {hint ? (
        <p className="text-center text-[11px] text-doge-cream/50">
          已打开签卡图片 —— <b className="text-doge-amber">长按图片</b> 即可保存到相册
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={copy}
          className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-doge-cream"
        >
          📋 复制战绩
        </button>
        {card.txHash ? (
          <a
            href={`https://bscscan.com/tx/${card.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-semibold text-doge-cream"
          >
            🔎 查看回执
          </a>
        ) : null}
      </div>
      <button
        onClick={onAgain}
        className="block w-full rounded-2xl bg-gradient-to-r from-doge-amber to-doge-ember py-3.5 text-center text-base font-black text-doge-ink shadow-glow"
      >
        🀄 再求一签
      </button>
      <p className="pt-1 text-center text-[11px] text-doge-cream/40">
        截图分享到群，让更多狗友一起上香 🐕
      </p>
    </div>
  );
}

function MyRank({
  stat,
}: {
  stat: { rank: number | null; totalBurned: number; streak: number };
}) {
  return (
    <a
      href="/board"
      className="mt-4 block rounded-2xl border border-doge-gold/30 bg-gradient-to-r from-doge-gold/[0.12] to-transparent p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-doge-cream/60">🏆 我的烧狗榜</span>
        <span className="text-[12px] text-doge-gold">看完整榜单 →</span>
      </div>
      <div className="mt-1.5 flex items-end gap-3">
        <div>
          <span className="text-[11px] text-doge-cream/45">排名</span>
          <div className="tnum text-2xl font-black text-doge-amber">
            {stat.rank ? `#${stat.rank}` : "—"}
          </div>
        </div>
        <div className="flex-1 text-right text-[11px] text-doge-cream/55">
          累计烧 <b className="text-doge-cream">{formatCN(stat.totalBurned)} 狗</b>
          {stat.streak > 1 ? <span> · 🔥连签 {stat.streak} 天</span> : null}
        </div>
      </div>
    </a>
  );
}

function HowItWorks() {
  const steps = [
    ["1", "连接钱包", "点「连接钱包」，币安/OKX/Trust/MetaMask 自动出现"],
    ["2", "选档求签", "普通/大师/狗王，越旺烧越多"],
    ["3", "烧狗上香", "狗狗币直接打入黑洞，链上可查"],
    ["4", "得签分享", "出签卡，截图发群，登烧狗榜"],
  ];
  return (
    <section className="mt-8">
      <h3 className="text-sm font-semibold text-doge-cream/80">怎么玩</h3>
      <div className="mt-3 space-y-2">
        {steps.map(([n, t, d]) => (
          <div key={n} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-doge-gold/20 text-xs font-bold text-doge-gold">
              {n}
            </span>
            <div>
              <div className="text-[13px] font-semibold text-doge-cream">{t}</div>
              <div className="text-[11px] text-doge-cream/50">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-8 text-center text-[11px] text-doge-cream/35">
      <p>狗狗上香 · 回本签 · 销毁直连 BNB 链</p>
      <p className="mt-1">娱乐玄学，图个乐子 · 非投资建议 · DYOR</p>
    </footer>
  );
}
