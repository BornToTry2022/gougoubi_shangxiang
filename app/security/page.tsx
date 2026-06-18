import type { Metadata } from "next";
import SecurityContent from "@/components/SecurityContent";

export const metadata: Metadata = {
  title: "安全说明 · Security | 狗狗上香",
  description:
    "本 dApp 无自有智能合约，仅对现有「狗狗币」代币做标准 transfer 到黑洞地址、从不 approve。附狗狗币代币公开安全检测。This dApp deploys no custom smart contract.",
};

export default function SecurityPage() {
  return <SecurityContent />;
}
