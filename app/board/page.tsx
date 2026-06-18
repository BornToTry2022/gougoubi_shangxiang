import type { Metadata } from "next";
import Leaderboard from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "烧狗榜 · 狗狗上香",
  description: "谁烧得最多，谁就是狗王。累计销毁排行，链上可验证。娱乐玄学，非投资建议。",
};

export default function BoardPage() {
  return (
    <main className="mx-auto w-full max-w-[480px] px-5 pt-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-doge-gold/15 text-2xl shadow-glow">
          🏆
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-extrabold tracking-tight text-doge-cream">
            烧狗榜
          </h1>
          <p className="text-[11px] text-doge-cream/55">烧得越多，越接近狗王</p>
        </div>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-doge-cream/55">
        每一次「回本签」烧掉的狗狗币都计入此榜，累计越多排名越高。所有销毁均打入黑洞地址、链上可核对。
        <b className="text-doge-amber"> 娱乐玄学，非投资建议。</b>
      </p>

      <div className="mt-5">
        <Leaderboard limit={100} />
      </div>
    </main>
  );
}
