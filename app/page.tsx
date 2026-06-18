import Dashboard from "@/components/Dashboard";
import { getBurnStats, type BurnStats } from "@/lib/chain";
import { GGB } from "@/lib/ggb";

// Always render fresh on-chain data.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  let initial: BurnStats | null = null;
  try {
    initial = await getBurnStats();
  } catch {
    // If the server-side read fails (e.g. RPC hiccup), the client will retry via /api/burn.
    initial = {
      burnedDead: 0,
      burnedZero: 0,
      burnedTotal: 0,
      totalSupply: GGB.totalSupplyHint,
      circulating: GGB.totalSupplyHint,
      pctBurned: 0,
      readAt: Date.now(),
    };
  }
  return <Dashboard initial={initial} />;
}
