import { NextResponse } from "next/server";
import { getBurnStats } from "@/lib/chain";
import { getDelta24h } from "@/lib/store";

// Read fresh from chain on each request; cache briefly at the edge.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getBurnStats();
    const delta24h = await getDelta24h(stats.burnedTotal);
    return NextResponse.json(
      { ok: true, stats: { ...stats, delta24h } },
      {
        // never cache: the burn counter must reflect fresh on-chain state
        // (a cached transiently-stale read would otherwise freeze the number)
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? "read failed" },
      { status: 502 }
    );
  }
}
