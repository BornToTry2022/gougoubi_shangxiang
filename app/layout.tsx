import type { Metadata, Viewport } from "next";
import "./globals.css";
import WalletProvider from "@/components/providers/WalletProvider";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://ggbburn.gougoubi.workers.dev"
  ),
  title: "狗狗上香 | 狗狗币公开销毁看板 · 求签 · 烧狗榜",
  description:
    "狗狗币 链上销毁透明记分牌。所有数据直接来自 BNB 链，可在 BscScan 验证。娱乐 / 社区项目，非投资建议。",
  // favicon 用极简金柴犬(小尺寸清晰)；iOS 主屏用上香求签图。两者都在 public/，
  // 走静态资源、不计入 worker 3MB 上限。
  icons: {
    icon: "/incense-64.png",
    apple: "/incense-180.png",
  },
  openGraph: {
    title: "狗狗上香 · 公开销毁看板",
    description: "链上销毁，公开可验证。销毁≠拉盘，这是一块透明记分牌。",
    type: "website",
    images: [{ url: "/incense.png", width: 512, height: 512, alt: "狗狗上香求签 · 狗狗币回本签" }],
  },
  twitter: {
    card: "summary",
    title: "狗狗上香 · 公开销毁看板",
    description: "链上销毁，公开可验证。销毁≠拉盘，这是一块透明记分牌。",
    images: ["/incense.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a06",
  width: "device-width",
  initialScale: 1,
  // maximumScale removed — let users zoom (accessibility).
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <WalletProvider>
          <AppHeader />
          {/* Pad the bottom so content clears the fixed Tab bar + safe area. */}
          <div className="pb-[calc(84px+env(safe-area-inset-bottom))]">
            {children}
          </div>
          <BottomNav />
        </WalletProvider>
      </body>
    </html>
  );
}
