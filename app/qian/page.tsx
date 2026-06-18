import type { Metadata } from "next";
import QianApp from "@/components/QianApp";

export const metadata: Metadata = {
  title: "每日回本签 · 狗狗上香",
  description:
    "烧一点狗狗币，求一份好运。狗狗币直接打入黑洞地址（永久销毁），链上可核对。娱乐玄学，非投资建议。",
};

export default function QianPage() {
  return <QianApp />;
}
