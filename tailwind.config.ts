import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Doge / meme warm palette
        doge: {
          gold: "#f0b90b", // BNB / Binance gold
          amber: "#ffcf33",
          ember: "#ff7a18",
          ink: "#15110a",
          char: "#1f1a10",
          cream: "#fff7e6",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "PingFang SC",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(240,185,11,0.45)",
      },
      keyframes: {
        flicker: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.82" },
        },
        rise: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        flicker: "flicker 2.4s ease-in-out infinite",
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
