import type { Metadata } from "next";
import Leaderboard from "@/components/Leaderboard";
import BoardIntro from "@/components/BoardIntro";

export const metadata: Metadata = {
  title: "烧狗榜 · 狗狗上香",
  description: "谁烧得最多，谁就是狗王。累计销毁排行，链上可验证。娱乐玄学，非投资建议。",
};

export default function BoardPage() {
  return (
    <main className="mx-auto w-full max-w-[480px] px-5 pt-5">
      <BoardIntro />
      <div className="mt-5">
        <Leaderboard limit={100} />
      </div>
    </main>
  );
}
