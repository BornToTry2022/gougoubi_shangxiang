/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // wagmi v3 / Reown AppKit / WalletConnect lazily `import()` several OPTIONAL
    // packages that we don't install or use (smart-account "accounts", the pino
    // pretty-print transport, the lokijs storage shim, node-fetch's "encoding",
    // and React-Native-only deps). Turbopack fails static resolution on these;
    // webpack lets us alias them to an empty module so the build resolves and the
    // dead code paths never run. (Hence we build with `next build --webpack`.)
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optional, UNUSED wagmi standalone connectors. AppKit supplies its own
      // WalletConnect (via @walletconnect/universal-provider) and uses injected()
      // for in-app browsers, so these connector SDKs are never called — stub them
      // so their unresolved optional deps don't spam warnings / break the build.
      "@walletconnect/ethereum-provider": false,
      "@metamask/connect-evm": false,
      "@base-org/account": false,
      accounts: false,
      porto: false,
      "porto/internal": false,
      // Optional logger / storage / RN deps pulled transitively, never loaded.
      "pino-pretty": false,
      lokijs: false,
      encoding: false,
      "@react-native-async-storage/async-storage": false,
    };
    // Silence a harmless "Critical dependency" warning from viem's unused
    // `tempo` chain (ox/tempo uses a dynamic require). We only use `bsc`.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /node_modules\/ox\/.*tempo/ },
    ];
    return config;
  },
};

export default nextConfig;
