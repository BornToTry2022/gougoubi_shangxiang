import { NextResponse } from "next/server";
import { getBurnStats } from "@/lib/chain";
import { getDelta24h, getLeaderboard, recordSnapshot } from "@/lib/store";
import { sendMessage, tgConfig } from "@/lib/telegram";
import { LINKS, formatCN, formatPct, shortAddr } from "@/lib/ggb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MEDALS = ["🥇", "🥈", "🥉"];

async function run() {
  const stats = await getBurnStats();
  const delta = await getDelta24h(stats.burnedTotal);
  await recordSnapshot(stats.burnedTotal);
  const { rows } = await getLeaderboard(3);

  const base = process.env.NEXT_PUBLIC_BASE_URL || LINKS.website.replace(/\/$/, "");
  const qianUrl = base.startsWith("http") ? `${base}/qian` : LINKS.website;

  const top =
    rows.length > 0
      ? rows
          .map(
            (r, i) =>
              `${MEDALS[i] ?? "#" + (i + 1)} <code>${shortAddr(r.wallet)}</code> · ${formatCN(
                r.totalBurned
              )} 狗`
          )
          .join("\n")
      : "（还没有人上香，第一个就是狗王）";

  const text =
    `🔥 <b>狗狗币 · 今日烧狗</b>\n\n` +
    `累计烧狗 <b>${formatCN(stats.burnedTotal)}</b> 狗（占 ${formatPct(stats.pctBurned)}）\n` +
    `今日新增 <b>${delta != null ? formatCN(delta) : "—"}</b> 狗\n\n` +
    `🏆 <b>烧狗榜 Top3</b>\n${top}\n\n` +
    `🀄 上香求今日回本签 👉 ${qianUrl}\n` +
    `<i>链上可验证 · 娱乐玄学 · 非投资建议</i>`;

  const cfg = tgConfig();
  if (!cfg) {
    return { ok: true, dryRun: true, posted: false, text };
  }
  const sent = await sendMessage(cfg, text);
  return { ok: sent.ok, dryRun: false, posted: sent.ok, error: sent.error, text };
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail CLOSED in production: an unset secret must never mean "open to the world".
  // (Locally / in dev it stays open for convenience.)
  if (!secret) return process.env.NODE_ENV !== "production";
  // Header-only so the secret never lands in request URLs / CDN access logs.
  return req.headers.get("x-cron-key") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await run());
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}

// Allow POST too (some cron services use POST)
export const POST = GET;
