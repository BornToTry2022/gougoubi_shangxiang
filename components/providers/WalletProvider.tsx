"use client";

import { type ReactNode, useState } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { bsc } from "@reown/appkit/networks";
import {
  wagmiAdapter,
  wagmiConfig,
  projectId,
  networks,
  customRpcUrls,
} from "@/lib/wallet";

// AppKit metadata derived from the live origin — no hardcoded/personal domain.
// Safe: this block only evaluates client-side (the `typeof window` guard below),
// so window.location is always defined when createAppKit runs.
const appKitMetadata =
  typeof window !== "undefined"
    ? {
        name: "狗狗上香",
        description: "狗狗上香 · 狗狗币销毁看板 · 求签 · 烧狗榜",
        url: window.location.origin,
        icons: [`${window.location.origin}/icon.svg`],
      }
    : undefined;

/**
 * The AppKit modal instance — created CLIENT-SIDE ONLY.
 *
 * Why imperative (exported instance) instead of the `useAppKit()` hook:
 * `useAppKit()` throws "call createAppKit before useAppKit" during SSR unless
 * createAppKit ran on the server too. But createAppKit boots WalletConnect +
 * EIP-6963 (mipd) discovery, which touch window/indexedDB and crash workerd SSR.
 * So we keep createAppKit strictly in the browser and open the modal via this
 * instance — no hook is rendered on the server, so every page SSRs cleanly.
 *
 * The `projectId` guard means an unconfigured deploy still builds & renders
 * (modal stays undefined → the connect button no-ops) instead of white-screening.
 */
export const modal =
  typeof window !== "undefined" && projectId
    ? createAppKit({
        adapters: [wagmiAdapter],
        networks,
        defaultNetwork: bsc,
        projectId,
        customRpcUrls,
        metadata: appKitMetadata,
        themeMode: "dark",
        themeVariables: { "--w3m-accent": "#f0b90b" }, // doge-gold
        // Pure self-custody: no email / socials / on-ramp / swaps / analytics.
        features: {
          email: false,
          socials: false,
          onramp: false,
          swaps: false,
          analytics: false,
        },
        enableEIP6963: true, // multi-injected discovery (Binance/OKX/MetaMask)
      })
    : undefined;

/** Opens the connect / account modal. No-op until a projectId is configured. */
export function openWalletModal() {
  modal?.open();
}

export default function WalletProvider({ children }: { children: ReactNode }) {
  // One QueryClient per provider instance (not module scope) so concurrent SSR
  // requests on a shared workerd isolate never share a cache.
  const [queryClient] = useState(() => new QueryClient());
  // WagmiProvider + config are SSR-safe (cookieStorage guards window), so wagmi
  // hooks below render on the server without AppKit being initialized.
  return (
    <WagmiProvider config={wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
