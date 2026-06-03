# x402write

> 给专家的链上付费阅读 —— **一篇报告,真人和 AI 同价付费,款项直达作者,平台 0 抽成。**

律师、审计师、税务师、合规官把 Web3 风险报告**签名上链**,读者(真人或 AI Agent)用 USDC **按篇付费**解锁全文。谁是作者、内容有没有被改、定价多少、付了多少 —— 全部写在 **Base** 上,任何人可验证。**没有平台抽成、没有 API key、没有对账纠纷。**

> Hackathon MVP,跑在 **Base Sepolia** 测试网。Agent 钱包用 **Cobo Agentic Wallet**。完整规格见 [docs/HACKATHON.md](docs/HACKATHON.md)。

## 一句话理解

```
作者签名上链  →  报告进目录  →  真人 & AI Agent 同价付 USDC(x402)  →  款项直达作者钱包(0 抽成)
```

把一篇文章签名写进一条 **EAS 存证**(作者 + 内容哈希 + 价格)→ 自动进站点目录、带可验证徽章 → 真人点 Unlock、Agent 走 `402 → 付款 → 200`,**同一个价格** → USDC 实时结算进作者钱包,首页 EARNED 榜单立刻上涨。

## 完整生命周期(五步,每步链上可验证)

| # | 谁 | 做什么 |
|---|---|---|
| 1 | **作者** | 在 `/publish` 导入文章、自己定价,钱包签名把 `contentHash + author + price` 写成一条 **EAS 存证**(返回 attestation UID + tx hash)。 |
| 2 | **目录** | 存证一上链,报告自动进 `/reports` 和首页「收录文章」,每张卡片带 `on-chain ✓ EAS` 徽章,可跳浏览器验证。 |
| 3 | **真人读者** | 报告页先看 ~24% 预览 + paywall;点 Unlock,钱包发一笔 USDC(**x402 on Base**),全文展开,**付一次永久可读**。 |
| 4 | **AI Agent** | 读 [`/SKILL.md`](public/SKILL.md):先 `GET /api/v1/articles` 发现目录,再对某篇走 `402 → 付款 → 200` 拿全文 + companion。**和真人完全同价,无需 API key。** |
| 5 | **作者** | 两笔付费直达钱包后,刷新首页 For Writers 的 Top Earning Authors,该作者 EARNED **即刻上涨**,每笔都能在 basescan 对到链上交易。 |

> **Companion**:每篇文章配 Agent Mode 包 —— 公开的 Explainer + 读者起手 prompt;付费区附术语表 / 法条地图 / 误区表。

## 为什么要上链

- **出处可证** —— 服务端重算 `keccak256(正文)` 比对,attester 必须等于作者地址;文章被篡改或冒名直接拒绝入库。
- **真人 / Agent 同价** —— 价格由作者写在链上,真人 x402 和 Agent 读到的是同一个数字,无歧视定价、无隐藏加价。
- **0 抽成直付** —— 每笔通过 x402 实时结算到作者钱包,平台不碰钱、不做中间账户,链上可查、无需信任对账。

## 给 Agent 的 API

| 端点 | 价格 | 说明 |
|---|---|---|
| `GET /api/v1/articles` | 免费 | 列目录(元数据 + `price` + `read` 路径);支持 `?q=` `?tag=` `?author=` 过滤 |
| `GET /api/v1/articles/{slug}` | 作者定价 | `402 → 付款 → 200`,返回全文 markdown + companion + 链上 citation |

闭环:**列目录 → 拿某项的 `read` 路径 → GET 它付费读全文**。接入说明见 [`public/SKILL.md`](public/SKILL.md);付款用 **Cobo Agentic Wallet**(原生 x402,Base Sepolia 链 `TBASE_SETH`)。

## 演示:基于 Cobo 的阅读 Agent

演示里有一个独立的「阅读 Agent」——它替用户发现、付费、读完 x402write 的文章再作答。四层各司其职:

| 组件 | 职责 |
|---|---|
| **Vercel AI SDK** | **Agent 编排** —— 理解用户问题、决定调哪个端点、把全文组织成带出处的回答 |
| **x402** | **付费阅读协议** —— 命中 `402 Payment Required` 时按协议付费并重试,拿到 `200` 全文 |
| **Cobo Agentic Wallet** | **钱包执行与权限强制** —— 实际持有 USDC、签名并提交 x402 付款;所有链上动作都在策略内执行 |
| **Cobo pact** | **用户授权边界** —— 用户一次性批准的策略(花多少、付给谁、在哪条链);Agent 只能在此边界内花钱,越界即被拒 |

**串起来的一次问答:**

```
用户提问
  → [Vercel AI SDK] Agent 决定读哪篇:GET /api/v1/articles?q=… 发现目录
  → 取该项的 read 路径:GET /api/v1/articles/{slug} → 命中 402
  → [x402] 把 Payment-Required 交给钱包
  → [Cobo Agentic Wallet] 在 [pact] 授权边界内签名并付 USDC(Base Sepolia)
  → 重试拿到 200 全文 + companion
  → [Vercel AI SDK] Agent 带作者 + 链上存证出处作答
```

## 技术栈

Next.js 16 (App Router) · React 19 · TypeScript · viem/wagmi ·
[x402](https://x402.org)(`@x402/*` + Coinbase CDP facilitator)· [EAS](https://attest.org) · Vitest。
文章正文 **AES-256-GCM 加密**存储(`.enc`),仅付费后服务端解密。

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

付费解锁需要:读者钱包在 **Base Sepolia** 上持有测试 USDC(faucet 见 [docs.base.org/.../network-faucets](https://docs.base.org/base-chain/network-information/network-faucets),Coinbase CDP faucet 发 USDC),且**不能是文章作者本人地址**(自付会被拒)。

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
