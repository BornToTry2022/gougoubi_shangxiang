import { NextResponse } from "next/server";
import { getLeaderboard, getWalletStats } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? 50) || 50);
  const wallet = url.searchParams.get("wallet");

  try {
    const board = await getLeaderboard(limit);
    const me = wallet ? await getWalletStats(wallet) : null;
    return NextResponse.json({ ok: true, ...board, me });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? "读取排行榜失败" },
      { status: 500 }
    );
  }
}
