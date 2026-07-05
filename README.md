# 狗狗上香 (DogPray)

开源社区 dApp —— 为 BNB 链上的中文 meme 币 **狗狗币** 提供「用即通缩」的链上体验：
**烧一点狗狗币求每日「回本签」、登「烧狗榜」，每一笔销毁都在链上公开可验证。** 界面支持 **简体 / 繁体 / English**。

> 🟢 Live: https://burn.gougoubi.uk
> 狗狗币合约: `0xb05678ed0c9559955559de864829a0c8af574444`（BSC, 18 decimals）
> ⚠️ 娱乐玄学 · 非投资建议 · 销毁 ≠ 拉盘

## 它做什么

| 功能 | 路由 | 说明 |
|---|---|---|
| 🔥 销毁看板 | `/` | 实时读取黑洞地址 `0x…dEaD` 的狗狗币余额 = 累计销毁；BscScan 可核对 |
| 🎴 每日回本签 | `/qian` | 连钱包 → 烧固定数量狗狗币到黑洞 → 链上校验 → 出一张确定性「回本签」运势卡（可分享/可验证）|
| 🏆 烧狗榜 | `/board` | 累计销毁排行 |
| 🛡️ 安全说明 | `/security` | 信任设计 + 代币公开安全检测链接 |

## 信任设计（为什么开源）

本 dApp **不部署任何自有智能合约**。链上只做两件事：

1. **只读**公开数据（`balanceOf` / `totalSupply`）；
2. 一笔**标准 ERC-20 `transfer`** 到黑洞地址 `0x…dEaD` —— **从不 `approve`、从不申请授权额度**。

出签 / 榜单 / 校验在服务端、以链上交易回执核对。开源就是为了让任何人都能亲自读代码、核对这一点。

## 技术栈

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind**（构建用 webpack：`next build --webpack`）
- **钱包连接**：Reown AppKit + wagmi v3（只配 BSC 56；只单笔 transfer、绝不 approve）
- **多语言**：自建轻量 i18n（`lib/i18n*`），简体 / 繁体 / English，无第三方库
- **部署**：Cloudflare Workers（`@opennextjs/cloudflare`）+ **D1**（烧狗榜主存储，`INSERT OR IGNORE` 原子去重）/ KV（回退）
- **链上读取**：公共 BSC RPC（无需 API key）
- **签卡 PNG**：`next/og`（satori），`?lang=` 跟随界面 **简 / 繁 / 英** 三语（字体子集见 `lib/cardFont.ts`）

## 本地运行

```bash
npm install
cp .env.example .env.local
# 在 .env.local 填入你自己的 NEXT_PUBLIC_REOWN_PROJECT_ID（dashboard.reown.com 免费）
npm run dev   # http://localhost:3000
```

## 部署（Cloudflare，$0 起）

需要：一个 Cloudflare 账号、一个 D1 数据库 + 一个 KV namespace、一个免费 Reown projectId。
按 `wrangler.toml` 注释创建资源并把返回的 id 填回，然后：

```bash
npx wrangler kv namespace create GGB_KV     # 把 id 填回 wrangler.toml
npx wrangler d1 create ggb-leaderboard      # 把 database_id 填回 wrangler.toml（烧狗榜主存储）
npx wrangler secret put CRON_SECRET         # 生产必需（fail-closed）；TELEGRAM_* 可选
npm run deploy
```

> 部署后首个请求会自动建表 + 从旧 KV 幂等回迁榜单数据（零手动迁移）。

## License

[MIT](LICENSE)

---

本项目为**社区自制**赋能产品，与狗狗币代币方无隶属关系。娱乐玄学，非投资建议，DYOR。
