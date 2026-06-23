import { ImageResponse } from "next/og";
import {
  OUTCOME_META,
  draw,
  tierForAmount,
  localizeFortune,
  outcomeLabel,
  outcomeName,
  tierName,
} from "@/lib/fortune";
import { verifyBurn } from "@/lib/verifyBurn";
import { CARD_FONT } from "@/lib/cardFont";
import { formatNum } from "@/lib/ggb";
import { tr, type Lang } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 640;
const H = 1000;

/** Parse the ?lang query, falling back to 简体 (the dApp default). */
function langFromReq(req: Request): Lang {
  const l = new URL(req.url).searchParams.get("lang");
  return l === "zh-Hant" || l === "en" ? l : "zh-Hans";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ txHash: string }> }
) {
  const { txHash } = await params;
  const lang = langFromReq(req);
  const burn = await verifyBurn(txHash);
  if (!burn.ok) {
    return new Response("not a valid burn", { status: 404 });
  }
  const tier = tierForAmount(burn.amount);
  const f = draw(txHash, tier);
  const meta = OUTCOME_META[f.outcome];
  const loc = localizeFortune(txHash, f.outcome, lang);
  const short = `${txHash.slice(0, 10)}…${txHash.slice(-8)}`;
  // English outcome names can be two words ("Lie Low") — shrink so they don't
  // overflow the card; CJK names stay at the big display size.
  const outcomeSize = lang === "en" ? 92 : 132;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 48,
          background: `radial-gradient(120% 70% at 50% 0%, ${meta.glow}, transparent 55%), linear-gradient(180deg, #1b150c 0%, #0b0805 100%)`,
          color: "#fff7e6",
          fontFamily: "Noto",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "rgba(255,247,230,0.55)",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            {tier.emoji} {tierName(tier.id, lang)}
          </div>
          <div style={{ display: "flex" }}>{tr(lang, "card.verifiable")}</div>
        </div>

        {/* outcome */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "rgba(255,247,230,0.5)" }}>
            {outcomeLabel(f.outcome, lang)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: outcomeSize,
              fontWeight: 700,
              color: meta.color,
              lineHeight: 1.05,
              marginTop: 8,
            }}
          >
            {outcomeName(f.outcome, lang)}
          </div>
          <div style={{ display: "flex", fontSize: 54, marginTop: 14 }}>🐕</div>
        </div>

        {/* verdict */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            marginTop: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 520,
              textAlign: "center",
              fontSize: 31,
              lineHeight: 1.5,
              color: "rgba(255,247,230,0.92)",
            }}
          >
            「{loc.verdict}」
          </div>
        </div>

        {/* meters */}
        <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
          <Meter label={tr(lang, "card.recovery")} value={`${f.huiben}`} color={meta.color} fill={f.huiben} />
          <Meter label={tr(lang, "card.lucky")} value={`${f.lucky}`} color="#fff7e6" />
        </div>

        {/* yi / ji */}
        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          <Tag head={tr(lang, "card.yi")} text={loc.yi} color="#34d399" />
          <Tag head={tr(lang, "card.ji")} text={loc.ji} color="#fb7185" />
        </div>

        {/* spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* receipt */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "rgba(0,0,0,0.4)",
            borderRadius: 20,
            padding: "18px 22px",
            fontSize: 24,
            color: "rgba(255,247,230,0.6)",
          }}
        >
          <div style={{ display: "flex" }}>
            {tr(lang, "card.receipt", { amount: formatNum(burn.amount, lang) })}
          </div>
          <div style={{ display: "flex", fontSize: 20, color: "rgba(255,247,230,0.4)", marginTop: 6 }}>
            {tr(lang, "card.proof", { tx: short })}
          </div>
        </div>

        {/* branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 22,
            fontSize: 22,
            color: "rgba(255,247,230,0.4)",
          }}
        >
          <div style={{ display: "flex" }}>{tr(lang, "card.brand_left")}</div>
          <div style={{ display: "flex" }}>{tr(lang, "card.brand_right")}</div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [{ name: "Noto", data: CARD_FONT.buffer as ArrayBuffer, weight: 700, style: "normal" }],
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}

function Meter({
  label,
  value,
  color,
  fill,
}: {
  label: string;
  value: string;
  color: string;
  fill?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", fontSize: 20, color: "rgba(255,247,230,0.45)" }}>{label}</div>
      {fill !== undefined ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              flex: 1,
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                width: `${fill}%`,
                height: 10,
                borderRadius: 999,
                background: color,
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color }}>{value}</div>
        </div>
      ) : (
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color, marginTop: 6 }}>
          {value}
        </div>
      )}
    </div>
  );
}

function Tag({ head, text, color }: { head: string; text: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "16px 20px",
        fontSize: 26,
      }}
    >
      <div style={{ display: "flex", color }}>{head}</div>
      <div style={{ display: "flex", color: "rgba(255,247,230,0.85)" }}>{text}</div>
    </div>
  );
}
