// Reown AppKit + wagmi v3 wallet config — the single connection layer.
//
// IMPORTANT: this file must NOT be "use client". It is imported by both the
// server layout (for cookie hydration) and the client provider. It is SSR-safe:
// building the WagmiAdapter only touches cookieStorage (which guards
// `typeof window`), never window/indexedDB. The browser-only `createAppKit`
// call lives in WalletProvider.tsx, window-guarded.
//
// Verified against installed @reown/appkit 1.8.21 / @reown/appkit-adapter-wagmi
// 1.8.21 / wagmi 3.6.16. See docs/superpowers/specs for the integration spec.

import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { BSC_RPCS } from "./ggb";

/**
 * Reown(WalletConnect) projectId — from https://dashboard.reown.com (free).
 * REQUIRED for the connect modal. NEXT_PUBLIC_ is inlined at build time, so it
 * must exist in the build environment too (see wrangler.toml / .env.example).
 * Empty string = not configured yet; the app degrades gracefully (no modal)
 * instead of crashing — see WalletProvider's guard.
 */
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";

/** AppKit only ever offers BSC (chain 56). Single-element non-empty tuple. */
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc];

/**
 * Keep using our OWN public BSC RPCs (no Reown RPC quota touched).
 * Keyed by CaipNetworkId ('eip155:56'); the array doubles as a fallback list.
 */
export const customRpcUrls = {
  "eip155:56": BSC_RPCS.map((url) => ({ url })),
};

// NOTE: AppKit metadata.url/icons are derived from window.location.origin in
// WalletProvider (createAppKit is client-only), so the dApp auto-matches whatever
// domain serves it — no hardcoded URL here. (OG/share + TG links still use
// NEXT_PUBLIC_BASE_URL server-side; set that to your real domain at deploy.)

/**
 * The wagmi adapter. `ssr:true` makes the store skip hydration and reconnect
 * post-mount (server + first client render both show disconnected → no mismatch;
 * a returning user sees a brief connect→address flash, acceptable here).
 * cookieStorage is used because it's SSR-safe (guards `typeof window`); we don't
 * wire cookieToInitialState, so persistence is read client-side on reconnect.
 */
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  customRpcUrls,
});

/** Feed this to <WagmiProvider config={...}>. */
export const wagmiConfig = wagmiAdapter.wagmiConfig;
