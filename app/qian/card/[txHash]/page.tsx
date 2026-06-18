// Shareable, verifiable card page for a specific burn tx.
// Re-derives the fortune from on-chain data, so anyone can open the link and verify.
import type { Metadata } from "next";
import ResultCard, { type CardData } from "@/components/ResultCard";
import { draw, tierForAmount } from "@/lib/fortune";
import { verifyBurn } from "@/lib/verifyBurn";
import { BSCSCAN } from "@/lib/ggb";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ txHash: string }>;
}): Promise<Metadata> {
  const { txHash } = await params;
  const img = `${BASE}/api/card/${txHash}`;
  return {
    metadataBase: BASE ? new URL(BASE) : undefined,
    title: "我的回本签 · 狗狗上香",
    description: "烧狗狗币求一签，链上可验证。娱乐玄学，非投资建议。",
    openGraph: {
      title: "我的回本签 · 狗狗上香",
      description: "烧狗狗币求一签，链上可验证 🐕🔥",
      images: [{ url: img, width: 640, height: 1000 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "我的回本签 · 狗狗上香",
      images: [img],
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ txHash: string }>;
}) {
  const { txHash } = await params;
  const burn = await verifyBurn(txHash);

  if (!burn.ok) {
    return (
      <main className="mx-auto w-full max-w-[480px] px-5 py-16 text-center">
        <div className="text-5xl">🐕❓</div>
        <p className="mt-4 text-doge-cream/80">没找到这笔销毁签</p>
        <p className="mt-1 text-[12px] text-doge-cream/45">{burn.error}</p>
        <a href="/qian" className="mt-6 inline-block text-doge-gold">
          去求一签 →
        </a>
      </main>
    );
  }

  const tier = tierForAmount(burn.amount);
  const f = draw(txHash, tier);
  const data: CardData = {
    ...f,
    tierName: tier.name,
    tierEmoji: tier.emoji,
    amount: burn.amount,
    txHash,
    from: burn.from,
    dateLabel: "链上可验证",
  };

  return (
    <main className="mx-auto w-full max-w-[480px] px-5 py-8">
      <ResultCard data={data} />
      <div className="mt-4 space-y-2.5">
        <a
          href={`/api/card/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-2xl border border-doge-gold/30 bg-doge-gold/[0.08] py-3 text-center text-sm font-semibold text-doge-amber"
        >
          🖼 保存签卡图片（分享到群/X）
        </a>
        <a
          href={BSCSCAN.tx(txHash)}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-semibold text-doge-cream"
        >
          🔎 在 BscScan 核对这笔销毁
        </a>
        <a
          href="/qian"
          className="block w-full rounded-2xl bg-gradient-to-r from-doge-amber to-doge-ember py-3.5 text-center text-base font-black text-doge-ink shadow-glow"
        >
          🀄 我也要求一签
        </a>
        <a
          href="/"
          className="block w-full rounded-2xl border border-white/10 py-3 text-center text-sm text-doge-cream/70"
        >
          看「累计烧狗」总榜 →
        </a>
      </div>
      <p className="mt-4 text-center text-[11px] text-doge-cream/40">
        娱乐玄学 · 非投资建议 · 此签由链上销毁交易确定性生成，可复现
      </p>
    </main>
  );
}
