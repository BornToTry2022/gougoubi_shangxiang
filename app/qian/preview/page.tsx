// Design-preview of the 回本签 card without needing a wallet.
// Renders one sample per draw tier using the real deterministic draw().
import ResultCard, { type CardData } from "@/components/ResultCard";
import { DRAW_TIERS, draw } from "@/lib/fortune";

export const dynamic = "force-static";

const SAMPLE_TX = [
  "0x11116b0a9f0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e",
  "0x2222abc1234def5678901234567890abcdef1234567890abcdef1234567890ab",
  "0x3333ffeeddccbbaa99887766554433221100ffeeddccbbaa9988776655443322",
];

export default function PreviewPage() {
  const cards: CardData[] = DRAW_TIERS.map((t, i) => {
    const f = draw(SAMPLE_TX[i], t);
    return {
      ...f,
      tierName: t.name,
      tierEmoji: t.emoji,
      amount: t.burn,
      txHash: SAMPLE_TX[i],
      dateLabel: "样例预览",
    };
  });
  return (
    <main className="mx-auto w-full max-w-[480px] space-y-8 px-5 py-8">
      <h1 className="text-center text-lg font-bold text-doge-cream">
        回本签 · 卡面预览（样例）
      </h1>
      {cards.map((c) => (
        <ResultCard key={c.txHash} data={c} />
      ))}
    </main>
  );
}
