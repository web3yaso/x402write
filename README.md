# x402write

**给专家的链上付费阅读平台。** 律师、审计师、税务师、合规官等专业作者发布 Web3 风险报告,
读者(真人或 AI agent)用 USDC 按篇付费解锁全文,**收入 100% 归作者,平台 0 抽成**,
作者身份与定价用 EAS 在 Base 上链存证。

> Hackathon MVP,跑在 **Base Sepolia** 测试网。完整规格见 [docs/HACKATHON.md](docs/HACKATHON.md)。

## 它怎么运转

一篇报告的完整生命周期,全程链上可验证:

1. **发布** — 作者在 `/publish` 用钱包签名,把"作者 + 内容哈希 + 定价"做成 EAS attestation 上链。
2. **目录** — 报告进入 `/reports` 与首页「收录文章」,任何人可见摘要 + `on-chain ✓ EAS` 徽章。
3. **真人付费** — 读者在 `/reports/[slug]` 看到 ~24% 预览 + paywall,用另一个钱包通过 **x402** 付 USDC 解锁,永久可读。
4. **Agent 付费** — AI agent 读取 [`/SKILL.md`](public/SKILL.md),对 `/api/v1/articles/<slug>` 走 `402 → pay → 200` 拿到全文 + 结构化 companion。
5. **收益可见** — 首页 For Writers 榜单的作者 EARNED,随真实付费实时上升(数据来自 `payment-log`)。
6. **Companion** — 每篇文章配 Agent Mode 包:公开的 Explainer + 读者起手 prompt;付费区附术语表 / 法条地图 / 误区表。

## 技术栈

Next.js 16 (App Router) · React 19 · TypeScript · viem/wagmi ·
[x402](https://x402.org)(`@x402/*` + Coinbase CDP facilitator)· EAS(`@ethereum-attestation-service/eas-sdk`)· Vitest。
文章正文 AES-256-GCM 加密存储(`.enc`),仅付费后服务端解密。

## 本地开发

```bash
pnpm install
cp .env.local.example .env.local      # 填 CDP 凭证 / CONTENT_ENC_KEY / DEMO_AUTHOR_PRIVATE_KEY
                                       # 详见 .env.local.example 注释

pnpm register-schema                   # 一次性:注册 EAS schema,把 UID 回填 .env.local
pnpm seed yaoqian-crypto-liability web3-illegal-employment   # seed 文章上链 + 入目录

pnpm dev                               # http://localhost:3000
pnpm test                              # 全量单测(Vitest)
```

付费解锁需要:读者钱包在 **Base Sepolia** 上持有测试 USDC(faucet.circle.com),
且**不能是文章作者本人地址**(自付会被拒)。

## 常用脚本

| 命令 | 作用 |
|---|---|
| `pnpm dev` / `build` / `start` / `test` | 开发 / 构建 / 生产启动 / 测试 |
| `pnpm register-schema` | 注册 EAS schema(一次性) |
| `pnpm seed <slug…>` | 把文章上链并写入目录 |
| `pnpm reset-demo` | 重置到干净的演示开场(清 payment-log + 撤下导入示例) |
| `pnpm tsx scripts/encrypt-content.ts <slug>` | 把明文文章加密成 `.mdx` + `.enc` |

## 部署 & 演示

- 部署到 Vercel + serverless 文件写入注意事项:[DEPLOY.md](DEPLOY.md)
- 3 分钟演示脚本:[docs/DEMO.md](docs/DEMO.md)
