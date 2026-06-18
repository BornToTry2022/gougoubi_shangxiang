"use client";

import { useConnection, useReadContract } from "wagmi";
import { bsc } from "@reown/appkit/networks";
import { ERC20_ABI, GGB, formatCN, shortAddr } from "@/lib/ggb";
import { projectId } from "@/lib/wallet";
import { openWalletModal } from "./providers/WalletProvider";

/**
 * The single connect entry-point, shown in the global top bar.
 * - Disconnected → "🔗 连接钱包" → opens the AppKit modal (wallet list + QR +
 *   in-app-browser one-tap). 币安/OKX/Trust/MetaMask all appear automatically.
 * - Connected → a pill with the short address + live GGB balance; tapping it
 *   reopens the modal (account view: switch network / disconnect).
 *
 * Uses wagmi `useConnection` for identity (SSR-safe; reconnects post-mount) and
 * the client-only `openWalletModal()` (imperative `modal.open()`). The
 * `useAppKit()` hook is intentionally NOT used — it throws during SSR when
 * createAppKit hasn't run server-side. Don't reintroduce it.
 */
export default function ConnectButton() {
  const { address, isConnected } = useConnection();

  const { data: balRaw } = useReadContract({
    address: GGB.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: bsc.id,
    query: { enabled: Boolean(address) },
  });
  const balance = balRaw != null ? Number(balRaw as bigint) / 10 ** GGB.decimals : null;

  const configured = Boolean(projectId);

  if (isConnected && address) {
    return (
      <button
        onClick={openWalletModal}
        aria-label="钱包账户"
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-doge-gold/30 bg-black/40 py-1.5 pl-3 pr-2.5 text-right transition active:scale-[0.98]"
      >
        <span className="flex flex-col leading-tight">
          <span className="tnum text-[12px] font-bold text-doge-gold">
            {shortAddr(address)}
          </span>
          <span className="tnum text-[10px] text-doge-cream/55">
            {balance != null ? formatCN(balance) + " 狗" : "…"}
          </span>
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-flicker" />
      </button>
    );
  }

  return (
    <button
      onClick={openWalletModal}
      disabled={!configured}
      aria-label="连接钱包"
      title={configured ? undefined : "钱包连接未配置（缺少 Reown projectId）"}
      className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-doge-amber to-doge-ember px-4 py-2.5 text-[13px] font-black text-doge-ink shadow-glow transition active:scale-[0.98] disabled:opacity-50"
    >
      🔗 连接钱包
    </button>
  );
}
