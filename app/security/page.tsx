import type { Metadata } from "next";
import { GGB, DEAD_ADDRESS, BSCSCAN, shortAddr } from "@/lib/ggb";

export const metadata: Metadata = {
  title: "安全说明 · Security | 狗狗上香",
  description:
    "本 dApp 无自有智能合约，仅对现有「狗狗币」代币做标准 transfer 到黑洞地址、从不 approve。附狗狗币代币公开安全检测。This dApp deploys no custom smart contract.",
};

const AUDITS = [
  {
    cn: "GoPlus 代币安全检测",
    en: "GoPlus Token Security",
    href: `https://gopluslabs.io/token-security/56/${GGB.address}`,
  },
  {
    cn: "honeypot.is 蜜罐检测",
    en: "honeypot.is honeypot check",
    href: `https://honeypot.is/?address=${GGB.address}&chain=bsc`,
  },
  {
    cn: "BscScan 代币合约",
    en: "BscScan token contract",
    href: BSCSCAN.address(GGB.address),
  },
  {
    cn: "黑洞地址持仓 = 累计销毁",
    en: "Dead-address holdings = cumulative burn",
    href: BSCSCAN.tokenHolding(DEAD_ADDRESS),
  },
];

export default function SecurityPage() {
  return (
    <main className="mx-auto w-full max-w-[480px] px-5 pt-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-doge-gold/15 text-2xl shadow-glow">
          🛡️
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-extrabold tracking-tight text-doge-cream">
            安全说明 · Security
          </h1>
          <p className="text-[11px] text-doge-cream/55">狗狗上香 · 狗狗币回本签 / 烧狗榜</p>
        </div>
      </div>

      {/* ① No custom contract */}
      <Section index="①" cn="本 dApp 无自有智能合约" en="No custom smart contract">
        <P en>
          This dApp deploys <b className="text-doge-cream">no smart contract of its
          own</b>. On-chain it only (a) <b className="text-doge-cream">reads</b> public
          data (balanceOf / totalSupply) and (b) submits a single, standard ERC-20{" "}
          <code className="text-doge-amber">transfer</code> of the existing 狗狗币 token
          to the burn address <code className="text-doge-amber">0x…dEaD</code>. It{" "}
          <b className="text-doge-cream">never calls <code>approve</code></b> and never
          requests any token allowance. All off-chain logic (fortune draw, leaderboard,
          verification) runs server-side and is validated against the on-chain
          transaction receipt. No custodial contract, no pooled user funds, no
          upgradeable proxy of ours — so there is{" "}
          <b className="text-doge-cream">no bespoke contract code to audit</b>; the entire
          trust surface is one transfer + the pre-existing 狗狗币 token.
        </P>
        <P>
          本 dApp <b className="text-doge-cream">不部署任何智能合约</b>。链上只做两件事：
          ① <b className="text-doge-cream">只读</b>公开数据（余额 / 总量）；② 用标准
          ERC-20 <code className="text-doge-amber">transfer</code> 把现有狗狗币代币打到黑洞
          地址 <code className="text-doge-amber">0x…dEaD</code>。
          <b className="text-doge-cream">从不 approve</b>、从不申请授权额度。出签 / 榜单 /
          校验都在服务端，并以链上交易回执核对。无托管合约、无资金池、无可升级代理——因此
          <b className="text-doge-cream">没有自有合约代码需要审计</b>，全部信任面就是「一笔
          转账 + 现有的狗狗币代币」。
        </P>
      </Section>

      {/* ② Token security */}
      <Section index="②" cn="狗狗币代币安全（公开检测）" en="狗狗币 token security (public scans)">
        <P en>
          The token contract below is the existing 狗狗币 token — we do not own,
          deploy or control it; we only transfer it to the dead address. Public security
          scans (latest):{" "}
          <b className="text-doge-cream">
            0% buy/sell tax, not a honeypot, not mintable, no blacklist, not pausable,
            open-source — risk level LOW.
          </b>
        </P>
        <P>
          下方代币合约是现有的狗狗币，非我们部署 / 控制，我们只是把它转入黑洞
          地址。公开安全检测（最近一次）：
          <b className="text-doge-cream">
            买卖税 0、非貔貅、不可增发、无黑名单、不可暂停、合约开源——风险等级 LOW。
          </b>
        </P>
        <div className="mt-3 space-y-2">
          {AUDITS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2.5 text-sm transition hover:bg-black/50"
            >
              <span className="text-doge-cream/75">
                {a.cn}
                <span className="ml-1.5 text-[11px] text-doge-cream/40">{a.en}</span>
              </span>
              <span className="text-doge-gold">↗</span>
            </a>
          ))}
        </div>
      </Section>

      {/* contract box */}
      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <p className="text-[11px] text-doge-cream/50">狗狗币合约地址 · Token contract (BSC, 56)</p>
        <a
          href={BSCSCAN.address(GGB.address)}
          target="_blank"
          rel="noreferrer"
          className="tnum mt-1 block break-all text-[12px] text-doge-amber"
        >
          {GGB.address} ↗
        </a>
        <p className="mt-2 text-[11px] text-doge-cream/45">
          黑洞地址 · Burn address：{shortAddr(DEAD_ADDRESS)}（标准 dead address）
        </p>
      </div>

      <p className="mt-6 text-center text-[11px] text-doge-cream/35">
        娱乐玄学 · 非投资建议 · 销毁≠拉盘 / Entertainment only · Not financial advice
      </p>
      <div className="mt-3 text-center">
        <a href="/" className="text-[12px] text-doge-gold">
          ← 返回销毁看板 · Back to dashboard
        </a>
      </div>
    </main>
  );
}

function Section({
  index,
  cn,
  en,
  children,
}: {
  index: string;
  cn: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <h2 className="text-sm font-bold text-doge-cream">
        <span className="text-doge-gold">{index}</span> {cn}
      </h2>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-doge-cream/40">{en}</p>
      <div className="mt-2.5 space-y-2.5">{children}</div>
    </section>
  );
}

function P({ children, en }: { children: React.ReactNode; en?: boolean }) {
  return (
    <p
      className={`text-[12px] leading-relaxed ${
        en ? "text-doge-cream/55" : "text-doge-cream/75"
      }`}
    >
      {en ? <span className="mr-1 text-doge-cream/35">EN ·</span> : null}
      {children}
    </p>
  );
}
