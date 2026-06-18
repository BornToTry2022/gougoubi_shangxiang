import { NextResponse } from "next/server";
import { draw, tierForAmount } from "@/lib/fortune";
import { verifyBurn } from "@/lib/verifyBurn";
import { BSCSCAN } from "@/lib/ggb";
import { getWalletStats, recordBurn } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { txHash?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求格式错误" }, { status: 400 });
  }

  const txHash = (body.txHash || "").trim();
  if (!txHash) {
    return NextResponse.json({ ok: false, error: "缺少交易哈希" }, { status: 400 });
  }

  const burn = await verifyBurn(txHash);
  if (!burn.ok) {
    return NextResponse.json({ ok: false, error: burn.error }, { status: 422 });
  }

  const tier = tierForAmount(burn.amount);
  const fortune = draw(txHash, tier);

  // record to the 烧狗榜 (idempotent on txHash)
  const counted = await recordBurn({
    wallet: burn.from,
    txHash,
    amount: burn.amount,
    points: tier.points,
    outcome: fortune.outcome,
    tier: tier.id,
    ts: Date.now(),
  });
  const stats = await getWalletStats(burn.from);

  return NextResponse.json({
    ok: true,
    txHash,
    burn: { from: burn.from, amount: burn.amount },
    tier: { id: tier.id, name: tier.name, emoji: tier.emoji, points: tier.points },
    fortune,
    counted,
    rank: stats?.rank ?? null,
    walletStats: stats,
    receiptUrl: BSCSCAN.tx(txHash),
    cardUrl: `/qian/card/${txHash}`,
  });
}
