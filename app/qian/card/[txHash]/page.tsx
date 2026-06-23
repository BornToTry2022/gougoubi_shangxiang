// Shareable, verifiable card page for a specific burn tx.
// Re-derives the fortune from on-chain data, so anyone can open the link and verify.
import type { Metadata } from "next";
import { cache } from "react";
import CardPageClient from "@/components/CardPageClient";
import type { CardData } from "@/components/ResultCard";
import { draw, tierForAmount } from "@/lib/fortune";
import { verifyBurn } from "@/lib/verifyBurn";
import { tr, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "";

// Memoize per request so generateMetadata + the page render share a single RPC.
const getBurn = cache(verifyBurn);

/** Parse the ?lang query, falling back to 简体 (the dApp default). */
function parseLang(l?: string): Lang {
  return l === "zh-Hant" || l === "en" ? l : "zh-Hans";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ txHash: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { txHash } = await params;
  const lang = parseLang((await searchParams).lang);
  const burn = await getBurn(txHash);
  const title = tr(lang, "cardpage.meta_title");
  // The PNG route 404s for an invalid burn, which breaks the social preview — only
  // advertise it when the burn is real; otherwise fall back to the static brand image.
  const img = burn.ok
    ? { url: `${BASE}/api/card/${txHash}?lang=${lang}`, width: 640, height: 1000 }
    : { url: `${BASE}/incense.png`, width: 512, height: 512 };
  return {
    metadataBase: BASE ? new URL(BASE) : undefined,
    title,
    description: tr(lang, "cardpage.meta_desc"),
    openGraph: {
      title,
      description: tr(lang, "cardpage.og_desc"),
      images: [img],
    },
    twitter: {
      card: burn.ok ? "summary_large_image" : "summary",
      title,
      images: [img.url],
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ txHash: string }>;
}) {
  const { txHash } = await params;
  const burn = await getBurn(txHash);

  if (!burn.ok) {
    return <CardPageClient data={null} txHash={txHash} error={burn.error} />;
  }

  const tier = tierForAmount(burn.amount);
  const f = draw(txHash, tier);
  const data: CardData = {
    ...f,
    tierId: tier.id,
    tierName: tier.name,
    tierEmoji: tier.emoji,
    amount: burn.amount,
    txHash,
    from: burn.from,
    // dateLabel omitted → ResultCard shows the localized 链上可验证, following the viewer's language.
  };

  return <CardPageClient data={data} txHash={txHash} />;
}
