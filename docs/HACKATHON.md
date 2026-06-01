# x402write Hackathon — Demo Loop Spec

**Document version**: 1.2
**Last updated**: 2026-05-31
**Owner**: Sophie
**Status**: Implementation-ready
**Relation to PRD**: This document is **narrower than `prd.md`** (the long-term v2.0 product vision). It carves out a single end-to-end demo loop suitable for a hackathon weekend. Anything in `prd.md` not listed here is **out of scope** for this milestone.

---

## 1. 目标

跑通**一篇报告的完整生命周期**，全部链上可验证：

1. 作者用钱包签名 → 发布一篇报告（EAS attestation 上 Base Sepolia）
2. 报告进入站点目录（`/reports`），任何人可见摘要
3. 真人用另一个钱包通过 x402 paywall 付费解锁全文
4. AI Agent 通过 AgentCash MCP 调用同一篇报告的付费 API（GET 402 → pay → 200）
5. **首页 For Writers tab 的 Top Earning Authors 榜单刷新后，作者那行的 EARNED 数字上升**（MVP 不做独立 dashboard 页，复用首页榜单作为"看见收益变化"的入口）
6. 报告发布后，平台后台生成一个 **companion（Agent Mode 配套 prompt 包）**：`/reports/[slug]` 页面公开展示 Explainer + 四句可一键复制的读者起手 prompt（看懂 / 套到我的情况 / 边界与误区 / 核实出处）+ 一段 agent setup prompt；付费取全文时，响应里附带结构化的术语表 / 法条地图 / 误区表（属付费内容，公开区不泄露）

这是一个可被 3 分钟录屏完整演示的闭环。

### 1.1 "作者 / Author" 的范围
本文档中的"作者"是一个统称，对应英文 **expert / domain practitioner**。x402write 不是律师专属平台，它的内容供给侧包含但不限于：
* 合规律师（legal / compliance lawyers）
* 智能合约审计师 / 安全研究员（smart-contract auditors, security researchers）
* 税务师 / 注册会计师（tax advisors, CPAs）
* 合规官 / KYC-AML 顾问（compliance officers）
* 链上侦查员 / 反洗钱分析师（on-chain investigators, AML analysts）
* 代币经济 / 协议研究员（tokenomics / protocol researchers）
* 行业分析师 / 实名 KOL（domain analysts,  KOLs）

---

## 3. 验收标准

**Done = 同时满足以下 6 条闭环动作 + 三段 KPI。**

### 3.1 闭环动作（缺一不可）

1. ✅ **作者签名上链**：从 `/publish` 页发起，钱包弹窗签名，EAS attestation tx 上 Base Sepolia 成功，返回 attestation UID + tx hash
2. ✅ **报告进入目录**：上一步完成后刷新 `/reports`，新文章自动出现（从 EAS GraphQL 查询 + 本地 MDX 渲染），徽章 "on-chain ✓ + EAS UID"
3. ✅ **真人 x402 付费**：换一个钱包打开 `/reports/[slug]`，看到 ~24% 预览 + paywall，点 "Unlock"，钱包发 USDC，全文出现，永久可读（同一钱包重访不需要再付）
4. ✅ **Agent 付费**：用 Claude Code + AgentCash MCP，在演示器里说 `调用 x402write.vercel.app/api/v1/articles/<slug> 获取全文`，AgentCash 完成 402→pay→200 流程，全文返回
5. ✅ **收益可见**：刷新首页 For Writers tab，Top Earning Authors 榜单里 demo author 那行的 EARNED 值比开场增加（增量 = price × 2，分别来自 Story 3 真人付费 + Story 4 agent 付费）
6. ✅ **companion 可用**：`/publish` 完成后后台生成 companion（黑客松：seed slug 返回预烘的 `content/companions/<slug>.md`，沿用 URL scrape 的 stub 模式，**不调 LLM**）。打开 `/reports/[slug]`，文章公开区出现 Agent Mode 配套区——Explainer + 四句读者起手 prompt（看懂 / 套用 / 边界 / 核实）+ agent setup prompt，**所有 copy 按钮都 work**；付费返回的 JSON 里带 `companion`（术语表 / 法条地图 / 误区表）

### 3.2 KPI


| 维度     | 指标                                                                                                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **技术** | EAS attestation UID 能在 [https://base-sepolia.easscan.org](https://base-sepolia.easscan.org) 验证到；x402 settlement tx 能在 [https://sepolia.basescan.org](https://sepolia.basescan.org) 验证到 |
| **产品** | 三类用户（作者 / 真人读者 / agent）都能各自完整走一遍流程，无需协同                                                                                                                                                |
| **演示** | 3 分钟录屏内跑完上述 6 步，不剪辑（允许换钱包窗口）                                                                                                                                                           |


---

## 4. 技术栈


| 层           | 选型                                                                      | 备注                                 |
| ----------- | ----------------------------------------------------------------------- | ---------------------------------- |
| Framework   | Next.js 16 App Router + React 19 + TS 5                                 | App Router 必须                      |
| Styling     | Tailwind v4                                                             | 设计 tokens 来自 `01-home.html`        |
| 包管理         | pnpm                                                                    |                                    |
| Node        | v22 LTS                                                                 |                                    |
| 网络          | Base Sepolia (`eip155:84532`)                                           |                                    |
| 链上存证        | EAS (`0x4200000000000000000000000000000000000021` on Base Sepolia, 预部署) |                                    |
| EAS SDK     | `@ethereum-attestation-service/eas-sdk`                                 |                                    |
| x402        | `@x402/next` v2 + `@x402/evm` + `@x402/core` + `@coinbase/x402`         | **不**用 deprecated 的 `x402-next` v1 |
| Facilitator | Coinbase CDP (`https://api.cdp.coinbase.com/platform/v2/x402`)          | 兜底：`https://x402.org/facilitator`  |
| 结算币种        | USDC on Base Sepolia                                                    |                                    |
| 真人钱包        | wagmi v2 + viem + **RainbowKit**                                        | connect + 签名 + 付费一站式               |
| Agent 钱包    | **AgentCash MCP**（用户已装）                                                 | demo 时直接在 Claude Code 里调用          |
| 内容存储        | frontmatter 明文 `.mdx` + **付费 body 加密** `.enc`（仓库内，AES-256-GCM）        | 黑客松不引入 DB；仓库 PUBLIC，付费正文须加密入库（见 §8.7） |
| 元数据来源       | EAS GraphQL + 本地 JSON 索引                                                | 双源对账                               |
| 部署          | Vercel                                                                  | 单 project                          |


### 4.1 `@x402/next` v2 注意

- peerDependency 仍标 Next 15，安装时用 `pnpm install -D --legacy-peer-deps`（或 pnpm `.npmrc` 设 `legacy-peer-deps=true`）
- 用 `withX402` 包 API route handler，**不**用 `proxy.ts`（那是 page route 的方案）
- 我们这次只用 API routes，不会动 page routes

---

## 5. 数据流 / 五个故事

### Story 1 · 作者签名上链（首页 Import → `/publish`）

**前置**：作者已连接钱包（Base Sepolia），钱包里有 Sepolia ETH 付 gas。

**入口（首页）**：For Writers tab 的 Import 输入框。作者粘贴原文 URL（公众号 / Mirror / Substack）→ 点 "Import" → 跳转到 `/publish?source=<url>`。

**MVP 简化**：URL 不真正抓取（公众号反爬战不在黑客松打）。**任何 URL 输入都映射到预置的 seed 文章** `content/reports/otc-freeze-case-001.mdx`。UI 上显示用户输入的 source 字段让 demo 看起来真实；scrape 实现留到 post-MVP。

**`/publish` 页面流程**：

1. 读取 seed 文章 frontmatter（`title`, `tags = [category, jurisdiction]`, `authorName`, `slug`, `summary`, `wordCount`, `publishedAt`）+ markdown body
   - **frontmatter 不含 `priceUsd`** — 价格只在 EAS attestation 上存在，由作者下一步设定
   - `publishedAt` = 原文首次发布日期（ISO 8601 字符串），seed 文章固定写一个真实日期（例如 `2024-01-15`）
2. 渲染预览卡片：
   - Title（只读，from frontmatter）
   - Tags（只读，灰色 pill）
   - 作者名称（只读，from frontmatter）
   - Source URL（只读，from query param）
   - 原发布日期（只读，from frontmatter `publishedAt`）
   - **Price 输入框（可编辑，默认 $0.30，范围 $0.05 – $50）**
   - **Disclaimer textarea（可编辑，预填平台默认模板，最长 500 字符）**
3. "Connect Wallet" 按钮（RainbowKit）→ 连上后 "Sign + Attest" 按钮亮起
4. 客户端计算 `contentHash = keccak256(utf8(markdown_body))`
5. 用 EAS SDK 提交 attestation（schema 详见 §7）：
   ```
   data: {
     contentHash,
     author: wallet.address,
     priceUSDC: parseUnits(userPrice, 6),
     slug,
     title,
     publishedAt: Math.floor(Date.parse(frontmatter.publishedAt) / 1000),
     version: 1,
     disclaimer: userDisclaimer,
   }
   recipient: wallet.address
   revocable: true
   ```
6. 等 tx 上链 → 拿到 `attestationUID`
7. POST 到 `/api/internal/attestations`（内部，非付费），把 `{ slug, attestationUID, txHash, author, priceUSDC, publishedAt, version, disclaimerHash }` 追加到 `data/attestation-index.json`（disclaimer 完整文本仍在链上，索引只存 hash 减少 IO）
8. 跳转 `/reports/<slug>`（或 `/reports` 列表），看到刚发布的文章在列表里

**安全约束**：

- `contentHash` 服务端独立重算并对比 attestation 中的字段，防止前端篡改 markdown
- attestation 链上的 `attester`（即 tx `msg.sender`） 必须 = `/api/internal/attestations` 请求方在 EAS GraphQL 上查到的 attester；这两者本就同步，不一致说明前端伪造，拒绝写入索引
- `slug` whitelist 校验（仅 `[a-z0-9-]{1,80}`）
- `userPrice` 范围校验（$0.05 ≤ value ≤ $50），超界拒绝签名
- `publishedAt` 必须为合法 Unix 时间戳，且**不晚于**当前 attestation 时间（不能声称"未来发布"）
- `disclaimer` ≤ 500 字符，前端在 textarea 强校验，服务端独立再校验一次
- `version` MVP 固定为 1；后端拒绝接收 `version != 1` 的 attestation 索引请求
- **不**把 price / disclaimer / publishedAt 写回 MDX frontmatter（除原本就有的 publishedAt 外）— 唯一权威源是链上 EAS attestation

### Story 2 · 报告进目录 (`/reports`)

**流程**：

1. SSR 时读 `data/attestation-index.json` 拿所有 `{ slug, attestationUID }`
2. 对每个 UID 调 EAS GraphQL（`https://base-sepolia.easscan.org/graphql`）拉 attester 地址、时间戳、状态（revoked?）
3. 渲染 MDX frontmatter + EAS 数据
4. 每张卡片右上角徽章："on-chain ✓ · EAS:0x12ab…"，hover 直跳 EAS Explorer

**降级**：EAS GraphQL 超时时，仅展示 frontmatter，徽章变灰显 "indexing…"。

### Story 3 · 真人 x402 付费 (`/reports/[slug]`)

**流程**：

1. SSR 渲染 frontmatter + markdown 前 **24%**（按字符数截，向后找最近段落边界）
2. 后面盖 paywall 卡片：价格 + "Unlock with wallet" 按钮 + 副文案 "100% 直接到作者钱包"
3. 用户点 Unlock：
  - 客户端用 wagmi 触发 `/api/v1/articles/[slug]` 调用
  - 第一次 fetch → 402，body 含 x402 payment requirements（`payTo` = 作者地址，`maxAmountRequired` = priceUSDC，`network` = Base Sepolia）
  - 客户端用 `@x402/evm` 构造 payment payload（USDC `transferWithAuthorization` EIP-3009）
  - 重发请求带 `X-PAYMENT` header → 200 + 全文 markdown
4. 拿到全文后客户端把它替换进 paywall 位置；同时 localStorage 记 `{ slug, txHash, payer }` 让 reloads 直接拉付费态（但 server 仍是付费墙，localStorage 只是 UX 加速）

**永久可读语义**：服务端**不**做 "已付费名单"，每次访问仍走 x402；但 facilitator 端用 `transferWithAuthorization` 的 `validBefore` 配合 client-side 重用同一笔已结算 tx 的 receipt（基础形式是再付一次，最简单）。**黑客松简化**：每次 reload 都重新付，UX 不完美但 demo 可演。

### Story 4 · Agent 付费 (`/api/v1/articles/[slug]`)

**流程**：

1. 路由用 `withX402` 包：
  ```ts
   export const GET = withX402(async (req, { params }) => {
     // payment 已通过 facilitator 验证（不需要业务侧验签）
     const { content } = await getReportBySlug(params.slug);
     const companion = await getCompanionPaidZone(params.slug); // 〔A〕区：术语表/法条地图/误区表（Story 6）
     return Response.json({ slug: params.slug, content, companion, citation: {...} });
   }, async ({ params }) => {
     // 动态 RouteConfig
     const meta = await getReportMeta(params.slug);
     const author = await getAuthorFromEAS(meta.attestationUID);
     if (!meta || !author) return null; // 触发 404
     return {
       accepts: [{
         scheme: "exact",
         network: "eip155:84532",
         payTo: author,
         maxAmountRequired: meta.priceUSDC,
         description: `x402write — ${meta.title}`,
         mimeType: "text/markdown",
       }],
     };
   });
  ```
2. Agent 侧演示：在 Claude Code 里说 `用 agentcash 工具调 https://<domain>/api/v1/articles/otc-freeze-case-001`，AgentCash MCP 接收 402 → 自动签 USDC → 重试 → 拿到 200 + 内容

**安全约束**：

- slug whitelist 在 RouteConfig 闭包里**优先**判，无效 slug 返回 null → 404，**不走付费墙**
- `payTo` 必须从 EAS 链上数据取，不能从请求方读
- 价格 (`maxAmountRequired`) 同样从服务端取，绝不接受 query param 覆盖
- 402 响应 body 只能含 payment requirements，不能含哪怕一行 markdown 全文

### Story 5 · 收益可见（首页 For Writers tab 榜单实时更新）

**MVP 决策**：**不**做独立 `/dashboard/<author>` 页。复用首页 For Writers tab 已有的 "Top Earning Authors" 榜单（设计稿里本来就是 10 行的排行），把数据源从 mock 切到读 `data/payment-log.json` 实时聚合即可。

**流程**：

1. 首页 For Writers tab 的 `<TopEarningAuthors>` 组件在 SSR / on-demand revalidate 时：
  - 读 `data/payment-log.json`（在 Story 3 / Story 4 的 API route 200 时追加写）
  - 按 `payee` (= author 地址) 聚合 `SUM(amount)` + `COUNT(*)` + 最近一笔 `ts`
  - JOIN `data/attestation-index.json` 拿 author display name（缺省显示 `0x12ab…cd34` 缩写）
  - 按 EARNED 降序取 top 10
2. 真人或 agent 完成一笔付费后，**刷新首页 For Writers tab**就能看到 demo author 那行的 EARNED 数字上升
3. **演示兜底**：若 demo author 不在 top 10，预先手动 seed 一条 $0.00 占位记录 + display name，确保他出现在榜上，便于录屏对比开场 / 收尾差值

**生产路径**：`payment-log.json` 写文件不可扩展；生产环境应改为 facilitator webhook → DB 写入 → 榜单走 DB 查询。MVP 后真正的作者 dashboard 页（独立 balance + 每笔 settlement 详情 + EAS history）也要补回来。

### Story 6 · companion / Agent Mode 配套包（`/reports/[slug]` + 付费响应）

**目标**：每篇报告附一个 companion，让 AI agent 能陪"有一定背景的非专业读者"完成四件事——**看懂 / 套到自己的情况 / 看清边界与误区 / 核实出处**。骨架与分区拆解见设计文档 `after-automation-agent-mode/docs/superpowers/specs/2026-05-29-legal-explainer-agent-mode-design.md`（灵感来自 Dan Shipper 的 *After Automation: Agent Mode*，骨架从"论证文（挑战论点）"改造为"解释文（帮助理解）"）。

**存储**：一篇一个独立文件 `content/companions/<slug>.md`，与 report MDX 解耦，**不进 EAS、不进 frontmatter**。

**companion 文件分区（0 / A / B / C）+ 付费边界**：

| 区 | 内容 | 公开 / 付费 |
| :- | :- | :- |
| 〔0〕免责 & 法域 | 固定免责声明 + 一行【本文法域】 | **公开**——免责声明本就在 EAS `disclaimer` 字段上链（§7），此处复用；法域取自 frontmatter tags |
| 〔A〕作者填充区 | 术语表 / 法条地图 / 误区表（"原文"即文章 body 本身） | **付费**——随 `/api/v1/articles/[slug]` 200 响应返回，**绝不**出现在公开区或 402 body |
| 〔B〕Agent 操作手册 | 告诉 agent 四类请求怎么答 | **公开**——折进 agent setup prompt |
| 〔C〕读者起手 prompt | 四句可直接复制的 prompt，对应四类请求 | **公开** |

**"后台生成"（黑客松 = 假生成 UX + 预烘存档）**：

- 生产路线：`/publish` 完成 attestation 后，后台读 markdown body，按设计文档 `GENERATE.md` 的质量约束生成 companion（B/C 区固定骨架原样保留，只填 0/A 区），作者审核法条准确性后入库。
- **黑客松简化**：沿用 URL scrape 的 stub 模式——`/publish` 后调 `POST /api/internal/companions`，UX 上显示"生成中 → 完成"，但 seed slug 直接返回预先写好并提交进仓库的 `content/companions/otc-freeze-case-001.md`，**本 milestone 不调任何 LLM / Anthropic API**（与 CLAUDE.md 现有 no-LLM 约束一致）。

**渲染（公开区，`/reports/[slug]`）**：

1. 文章预览区旁加一块 Agent Mode 配套区（复用 `shared/DPrompt` 的 copy-prompt 卡片样式）：
   - **Explainer**：一段话讲清这篇讲了什么 + agent 模式一句话
   - **四句读者起手 prompt**（〔C〕区）：每句一个 copy 按钮
   - **agent setup / Connect your agent**：一段一次性贴给 Codex / Claude Code 的 prompt（含〔B〕区操作手册 + 如何对这篇 `GET /api/v1/articles/<slug>` 付费取全文）
2. 这些都属公开 scaffold，付费与否都可见（与免责声明同等公开）。

**付费侧（`/api/v1/articles/[slug]` 200）**：扩展 Story 4 的响应——`{ slug, content, companion: { glossary, legalMap, misconceptions }, citation }`。〔A〕区的术语表 / 法条地图 / 误区表作为结构化引用元数据随全文一起返回，agent 付费后即可喂进工作流。

**安全约束**：

- 〔A〕区（术语表 / 法条地图 / 误区表）是**付费内容**，**不可**出现在公开 scaffold、**不可**出现在 402 body
- companion 文件按 slug whitelist 读取（同 `[a-z0-9-]{1,80}`）
- 法条地图每条标【法域】【是否最新】，区分"作者观点 vs 法律明文规定"；拿不准写"需人工核实"，**绝不编造法条**（生成器质量约束；预烘 seed companion 时由人工保证）

---

## 6. 页面 / 路由清单

```
app/
├── page.tsx                          首页 · 三 tab（移植 01-home.html）
├── reports/
│   ├── page.tsx                      列表（Story 2）
│   └── [slug]/page.tsx               详情 + paywall（Story 3）
├── publish/page.tsx                  签名上链（Story 1，入口为首页 For Writers tab 的 Import 框 → ?source=<url>）
├── api/
│   ├── v1/
│   │   ├── articles/[slug]/route.ts  付费全文 · withX402 包（Story 4）
│   │   ├── articles/route.ts         列表 · 免费 · CORS *
│   │   └── authors/route.ts          作者列表（从 EAS 派生）· 免费
│   └── internal/
│       ├── attestations/route.ts     /publish 完成后回调（写本地索引）
│       └── companions/route.ts       /publish 完成后"生成"companion（黑客松：stub，seed slug 返回预烘文件，Story 6）
├── llms.txt/route.ts                 静态生成
├── .well-known/x402-skill.md         agent 发现入口
└── openapi.json/route.ts             OpenAPI 3.0

components/
├── home/
│   ├── Masthead, NewsletterStrip, Pills, ReadersPanel, AgentsPanel, Footer
│   └── WritersPanel/  含 TopEarningAuthors（读 data/payment-log.json，Story 5）
├── reports/ (ReportCard, Paywall, EASBadge, CompanionPanel)  CompanionPanel = Agent Mode 配套区（Story 6）
├── publish/ (SignAttestForm)
└── shared/ (WalletConnect, DPrompt)

lib/
├── eas.ts                            EAS schema + sdk wrapper
├── content-crypto.ts                 AES-256-GCM encrypt/decrypt（付费正文加密 · §8.7，server-only）
├── reports.ts                        frontmatter loader（getReportMeta）+ getReportBody（读 .enc → 解密，server-only）
├── companions.ts                     companion loader：明文 .md 拆 0/B/C 公开 scaffold；付费〔A〕区读 .A.enc → 解密（Story 6 / §8.7）
├── x402-server.ts                    @x402/next 单例 + dynamic RouteConfig builder
├── x402-client.ts                    fetch wrapper 带 402 auto-pay（基于 @x402/evm）
└── wagmi-config.ts                   wagmi v2 injected（MetaMask only）+ Base Sepolia

content/reports/
├── otc-freeze-case-001.mdx           seed 文章 frontmatter（明文元数据，无 body）
├── otc-freeze-case-001.enc           加密 body（AES-256-GCM，§8.7）
└── _plaintext/                       明文源（.gitignore，永不入库）
    └── otc-freeze-case-001.md        frontmatter + 全文（约 2000 字），跑 encrypt-content.ts 出上面两个文件

content/companions/
├── otc-freeze-case-001.md            预烘 companion 公开区（0/B/C + Explainer，明文，Story 6）
└── otc-freeze-case-001.A.enc         加密〔A〕付费区（术语表/法条地图/误区表，§8.7）

data/
├── attestation-index.json            [{ slug, attestationUID, txHash, author, priceUSDC, publishedAt, version, disclaimerHash }]
└── payment-log.json                  [{ slug, payer, amount, txHash, ts }]

scripts/
├── eas-register-schema.ts            一次性：注册 schema，记录 schemaUID 到 .env
├── encrypt-content.ts                读 _plaintext/<slug>.md → 出 <slug>.mdx（元数据）+ <slug>.enc（加密 body）+ companion .A.enc（§8.7）
└── seed-attest.ts                    自动把 seed 文章 attest 一次（可选，给 demo 提速）
```

---

## 7. EAS Schema 设计

**Schema string**：

```
bytes32 contentHash,
address author,
uint96 priceUSDC,
string slug,
string title,
uint64 publishedAt,
uint16 version,
string disclaimer
```

**Resolver**：none（v1 不需要 onAttest 钩子）

**Revocable**：true（作者可下架，但已付费的 client cache 仍可读 — 黑客松不实现下架 UX，留口子）

**注册脚本**：`scripts/eas-register-schema.ts` 用 SDK 调 `SchemaRegistry.register()`，把返回的 `schemaUID` 写到 `.env.local` 作 `EAS_SCHEMA_UID`。

**字段约束**：

- `contentHash` = `keccak256(utf8(markdown_body))`，**不含** frontmatter
- `priceUSDC` = USDC 6 位小数的整数（例如 $0.30 = 300000），范围 $0.05 – $50
- `slug` = 小写 `[a-z0-9-]`，最长 80
- `title` = 最长 200 字符
- `publishedAt` = 原文首次发布日期的 Unix 时间戳（秒）。**不等于** EAS attestation 时间（后者由合约 `time` 自带）；用于表达"公众号 / Mirror 上的原发布时点"，可早于 attestation 数月或数年
- `version` = 文章版本号，从 `1` 起。MVP 不支持作者更新，固定 `1`；保留字段以便 post-MVP 支持 re-attest 时区分历史版本
- `disclaimer` = 文章随附的免责声明文本，最长 500 字符；可为空字符串。建议作者使用平台默认模板（UI 预填），允许加辖区特化补充。同一段 disclaimer 文本与 article body 一起被 attester 签名背书，作为日后责任分配的链上证据

**消费侧约定**（Story 2 / Story 3 实现时遵守）：

- `/reports` 列表卡片右下角显示 `publishedAt`（`YYYY-MM-DD` 格式）+ `v{version}` mini-badge
- `/reports/[slug]` article header 显示 `publishedAt` 与 attestation 时间（区分原发布 / 上链时间）
- `disclaimer` 文本渲染在文章末尾，**不被 paywall 遮挡** —— 免责声明对未付费读者也必须可见（法律性质要求），与免费预览同等公开

---

## 8. x402 集成关键点

### 8.1 动态 payTo

每篇文章对应不同作者钱包，必须每次请求按 slug 查 EAS → 取 attester 地址作为 payTo。**不能**有一个 hardcoded payTo。

### 8.2 价格服务端权威

价格在 `/publish` 由作者**手动输入**（UI input field），签名前作者看到的金额 = 即将写入 EAS `priceUSDC` 字段的金额。**之后**所有付费路径（真人 paywall、agent endpoint、RouteConfig 的 `maxAmountRequired`）一律从 EAS attestation 的 `priceUSDC` 取（链上不可篡改），**绝不**读 MDX frontmatter。**MDX frontmatter 不写 `priceUsd` 字段**，避免双源对账。

### 8.3 402 响应纪律

402 body 仅含 `paymentRequirements`，**不可**含 markdown 全文、不可含 priceUSD 之外的元数据、不可漏题。错误响应不含 stack trace（生产 build 默认即可）。

### 8.4 重放保护

由 `transferWithAuthorization` (EIP-3009) 的 `nonce` + facilitator 端校验承担，业务侧不实现额外去重。

### 8.5 网络强校验

`lib/x402-server.ts` 启动时断言 `process.env.X402_NETWORK === 'eip155:84532'`，否则 throw。**绝不**让 mainnet 配置和 testnet 私钥混跑。

### 8.6 companion 付费 / 公开边界

companion 文件分公开与付费两半（详见 Story 6）：〔0〕免责 + 〔B〕Agent 操作手册 + 〔C〕读者起手 prompt + Explainer 是**公开 scaffold**，渲染在 `/reports/[slug]`；〔A〕区（术语表 / 法条地图 / 误区表）是**付费内容**，只随 `/api/v1/articles/[slug]` 200 返回，**绝不**进公开区或 402 body。companion 由后台在 publish 后"生成"（黑客松为 stub + 预烘，不调 LLM）。

### 8.7 付费正文加密入库（公开仓库下的付费墙完整性）

**本仓库 GitHub 可见性为 PUBLIC**，付费正文若以明文 MDX 提交即可被任何人在 GitHub 上免费读取、绕过付费墙。付费墙的运行时边界（服务端只发 24% 预览 / 付费后发全文）只堵浏览器侧；**仓库 at-rest 这条泄露面用对称加密单独堵**。

- **加密的**：report markdown body → `content/reports/<slug>.enc`；companion〔A〕付费区 → `content/companions/<slug>.A.enc`。方案 = AES-256-GCM（Node 内置 `crypto`），磁盘格式 base64(`iv(12B) ‖ ciphertext ‖ authTag(16B)`)。
- **明文的（本就公开）**：report frontmatter；companion〔0〕〔B〕〔C〕+ Explainer。
- **密钥** `CONTENT_ENC_KEY`（32B base64）**只在 env**，绝不进 repo；解密**仅 server-side**，绝不下发 client。
- **明文源** `content/reports/_plaintext/`**`.gitignore`**，永不入库。`scripts/encrypt-content.ts` 由明文源生成 `.mdx` 元数据 + `.enc` 密文。
- **数据流**：服务端 `getReportBody(slug)` 读 `.enc` → 解密 → SSR 只切 24%、付费 API 给 100%；`contentHash` 解密后重算对账 EAS。
- **双层防御**：加密堵公开 repo at-rest；运行时仍由服务端决定 24% vs 100%（与 §8.3 / §8.6 一致，付费正文绝不进 402 body / 公开区）。

> 设计文档：`docs/superpowers/specs/2026-05-31-x402write-build-design.md` §1.3。

---

## 9. 环境变量

```bash
# .env.local — never commit

# Coinbase CDP (x402 facilitator)
CDP_API_KEY_ID=
CDP_API_KEY_SECRET=

# x402
X402_NETWORK=eip155:84532
X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
# 兜底:
# X402_FACILITATOR_URL=https://x402.org/facilitator

# EAS
EAS_CONTRACT_ADDRESS=0x4200000000000000000000000000000000000021
EAS_SCHEMA_REGISTRY=0x4200000000000000000000000000000000000020
EAS_SCHEMA_UID=                       # 跑完 register-schema 后填入
EAS_GRAPHQL_URL=https://base-sepolia.easscan.org/graphql

# Wallet (frontend) — 仅 MetaMask injected，无 WalletConnect（已去 RainbowKit/WC）
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Content encryption (付费正文加密入库 · §8.7) — 32B base64，openssl rand -base64 32
CONTENT_ENC_KEY=                      # 仅 env，绝不进 repo；服务端解密付费 body / companion〔A〕区

# Demo wallets (optional, for seed scripts)
DEMO_AUTHOR_PRIVATE_KEY=              # 仅测试网，绝不复用 mainnet 私钥
```

`.env.local.example` 列出全部，值留空。`.gitignore` 必须 ignore `.env.local`。

---

## 10. 安全审查清单（commit 前必查）

照搬 Mini-MVP §五并裁剪：

```
[ ] .env.local 未进 git index
[ ] 没有任何文件包含 *_KEY、*_SECRET、PRIVATE_KEY 的真实值
[ ] 没有 console.log 打印环境变量或钱包私钥
[ ] 没有引入 deprecated 的 x402-next v1
[ ] /api/v1/articles/[slug] slug whitelist 校验在 withX402 RouteConfig 闭包之前
[ ] 402 response body 不含全文 markdown
[ ] 价格从 EAS 链上 / 服务端取，不接受 query 覆盖
[ ] payTo 从 EAS attester 取，不接受 query 覆盖
[ ] 启动时断言 X402_NETWORK === eip155:84532
[ ] /publish 签名时 attestation 的 attester 由当前 connected wallet 派生（前端不能传入第三方地址）
[ ] /publish 的 price input 校验 $0.05 ≤ value ≤ $50，超界拒绝签名
[ ] /publish 的 publishedAt 不晚于当前时间（拒绝声称"未来发布"）
[ ] /publish 的 disclaimer 长度 ≤ 500 字符（前端 + /api/internal/attestations 双重校验）
[ ] /publish 的 version 字段固定为 1，索引接收时拒绝其他值
[ ] MDX frontmatter 不含 priceUsd / disclaimer 字段（避免双源），价格与 disclaimer 仅在 EAS attestation 上存在
[ ] contentHash 服务端独立重算并对比
[ ] CORS *  仅用在 /api/v1/articles 列表、/api/v1/authors、llms.txt、x402-skill.md
[ ] 钱包地址做 EVM 地址格式校验（viem.isAddress）
[ ] companion 的〔A〕区（术语表/法条地图/误区表）不出现在公开 scaffold、不出现在 402 body（属付费内容）
[ ] companion 文件按 slug whitelist 读取（同 `[a-z0-9-]{1,80}`）
[ ] companion "后台生成" 为 stub + 预烘，本 milestone 不引入任何 LLM / Anthropic API 调用
[ ] 付费正文（report body + companion〔A〕区）只以密文 .enc 入库，仓库内无任何明文付费正文
[ ] CONTENT_ENC_KEY 仅在 env（.env.local + Vercel），未进 git index；解密仅 server-side，key 不下发 client
[ ] content/reports/_plaintext/ 已被 .gitignore 忽略（明文源永不入库）
[ ] 解密后的全文只在服务端使用：SSR 仅输出 24% 预览，付费 API 才输出 100%，402 body 仍不含全文
```

---

## 11. 里程碑 / Phase

按可演示节点分：


| Phase                             | 估时         | 节点条件（demo 录屏角度）                                                                                   |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| 0 · Scaffold                      | 1h         | `pnpm dev` 跑起来，主页空壳 + RainbowKit connect 按钮可用                                                     |
| 1 · 01-home 移植                    | 2-3h       | 首页三 tab 切换、prompt 卡填入、copy 按钮全部 work；视觉对齐设计稿                                                      |
| 2 · EAS 集成                        | 2-3h       | `pnpm tsx scripts/eas-register-schema.ts` 注册 schema 成功，`/publish` 能签名 + 出 tx + EAS Explorer 可查    |
| 3 · MDX 内容层                       | 1-2h       | `/reports` 列表渲染 seed 文章 + EAS 徽章；`/reports/[slug]` 预览正常                                           |
| 4 · x402 paywall + agent endpoint | 3-4h       | 真人钱包 Unlock 全流程通；curl + AgentCash MCP 都能 402→pay→200                                              |
| 4.5 · companion / Agent Mode 配套包  | 1-1.5h     | 预烘 `content/companions/otc-freeze-case-001.md`；`/reports/[slug]` 出现 Agent Mode 配套区（Explainer + 四句起手 prompt + agent setup），copy 按钮全 work；付费响应带 companion〔A〕区；`POST /api/internal/companions` stub 通 |
| 5 · Leaderboard 接真实数据             | 0.5-1h     | 首页 For Writers tab 的 `TopEarningAuthors` 从 mock 切到 `payment-log.json` 聚合；一次成功付费刷新榜单即可看到 EARNED 增长 |
| 6 · 演示稿 + README                  | 1h         | 3 分钟录屏脚本 + .env.local.example + DEPLOY.md                                                         |
| **合计**                            | **11-17h** |                                                                                                   |


---

## 12. 3 分钟演示脚本

录屏前打开三个浏览器窗口分别用三个钱包（author / reader / 旁观者）。

**00:00–00:25 · 开场**：首页三 tab 各停 5 秒，强调"作者签名→真人付费→Agent 调用→收益到账"。

**00:25–01:15 · Story 1**：在首页 For Writers tab 的 Import 框粘贴一个公众号 URL → 点 "Import" → 跳到 `/publish` → 看到预览（title / tags / 作者名 / source）+ Price 输入框 → 把 Price 调到 $0.30 → 连接 **author 钱包** → 点 "Sign + Attest" → 钱包弹窗签 → tx pending → confirmed + EAS UID 出现 → 一键打开 EAS Explorer 给观众看一眼。

**01:15–01:30 · Story 2**：跳转到 `/reports`，刚 attest 的文章出现在列表，徽章 "on-chain ✓"。

**01:30–02:10 · Story 3 + Story 6**：打开 `/reports/otc-freeze-case-001`，先指一下文章旁的 **Agent Mode 配套区**——Explainer + 四句读者起手 prompt（点一下 copy 演示可用）+ agent setup prompt。再换 **reader 钱包**，点 Unlock → x402 流程 → USDC 转出 → 全文出现（全文里同时带回结构化的术语表 / 法条地图 / 误区表）。

**02:10–02:40 · Story 4**：开终端，跑 Claude Code，输入 `用 agentcash 工具调用 https://x402write.vercel.app/api/v1/articles/otc-freeze-case-001`（这段正是上一步公开区里 **copy 的 agent setup prompt**——companion 把人与 agent 两条路径串起来）。AgentCash MCP 自动完成 402→pay→200，返回全文 + companion〔A〕区 JSON。

**02:40–03:00 · Story 5**：回首页 → 切 For Writers tab → 滚到 Top Earning Authors 榜 → demo author 那行 EARNED 数字比开场多了 (price × 2)。可顺手点旁边 BaseScan 链接抽查任意一笔 settlement tx 收尾。

---

## 13. 未来优化方案（Post-MVP Roadmap）

本节列出黑客松刻意砍掉、但产品化必须补回的优化项。按优先级（P0 = 上线前必做）分级。每项标注它替换的 MVP 简化。

### 13.1 x402 付费的 entitlement 层（P0）— buy-once 语义

**MVP 现状**：付费全文端点 `/api/v1/articles/[slug]` 由 `withX402` 包裹，**服务端无状态、按请求计费**，不维护「已付费名单」（§5 Story 3）。这是 x402 **per-request 协议的固有特性，不是缺陷**——它对 Story 4 的 agent「按调用付费」是理想模型；但对 Story 3 的真人「买一次、反复读」是缺口，MVP 仅用 **localStorage 缓存全文**规避重复扣款（清缓存 / 换浏览器 / 换钱包即需重付）。

**生产方案**（三选一或组合，按强度递增）：

1. **客户端缓存（MVP 现状）**：localStorage 存全文，仅 UX 加速，非鉴权。换设备即失效。
2. **付费后签发访问令牌（session / JWT）**：首次 `402→pay→200` 成功后服务端签发短期令牌，后续请求带令牌不再付。简单、无需持久化作者-读者关系表，但令牌过期后要么重付要么续签。
3. **服务端 entitlement 表（推荐终态）**：facilitator webhook → DB 记 `{ payer, slug, settlementTx, paidAt }`；后续同一 payer 对同一 slug 的请求查表直接放行，不再走 x402。这才是真正的「买断永久可读」，且跨设备生效。

**结算 receipt 复用**：每笔结算都有链上 settlement tx 作收据，可用于事后对账 / 争议核验。

### 13.2 payment-log 从文件迁移到 DB（P0）

**MVP 现状**：付费成功在 API route 里 append 写 `data/payment-log.json`（§5 Story 5）。

**问题**：Serverless / 并发下写文件不可靠；Vercel 文件系统只读，`/tmp` 不持久。
**生产方案**：facilitator webhook → DB（Postgres / KV）写入；Top Earning Authors 榜单与作者 dashboard 均改走 DB 查询。13.1 的 entitlement 表与本表可合一。

### 13.3 真正的作者 Dashboard 页（P1）

**MVP 现状**：复用首页 For Writers tab 的 Top Earning Authors 榜单作为「看见收益」的入口，不做独立页（§5 Story 5）。
**生产方案**：独立 `/dashboard/<author>`：钱包余额 + 每笔 settlement 明细（tx / payer / 金额 / 时间）+ 该作者全部文章的 EAS attestation history + revoke 操作。

### 13.4 读者 onboarding：内嵌钱包（P1）

**MVP 现状**：只支持 MetaMask（injected connector），假设读者自带钱包且预先充值。
**生产方案**：接 Privy（或 CDP Embedded Wallet）做 email / 社交登录 → 内嵌钱包，让非 crypto 读者也能一键付 $0.30。因 connect 层隔离在 `lib/wagmi-config.ts`，这是 connector 级改动，EAS / x402 签名代码不变。详见构建设计文档 `docs/superpowers/specs/2026-05-31-x402write-build-design.md` §1.1。

### 13.5 真实 URL 抓取（P1）

**MVP 现状**：任何 Import URL 都映射到预置 seed 文章，不真抓取（§5 Story 1 MVP 简化）。
**生产方案**：实现公众号 / Mirror / Substack 的正文抓取与清洗（公众号反爬需专门处理），生成真实 frontmatter + markdown body。

### 13.6 companion 真实生成（P1）

**MVP 现状**：companion 为 stub + 预烘存档，`POST /api/internal/companions` 不调 LLM（§5 Story 6 黑客松简化）。
**生产方案**：publish 后台读 markdown body，按设计文档 `GENERATE.md` 质量约束用 LLM 生成 0/A 区（B/C 区固定骨架保留），**作者审核法条准确性后入库**。法条地图每条须标【法域】【是否最新】、区分「作者观点 vs 法律明文」，拿不准写「需人工核实」，绝不编造。

### 13.7 文章版本与下架（P2）

**MVP 现状**：`version` 固定为 1，不支持作者更新；revocable=true 但不实现下架 UX（§7）。
**生产方案**：支持 re-attest 产生 `version > 1` 的新 attestation 并保留历史；实现 revoke UX（下架后新读者不可购，已付费 client cache 仍可读）。

---

**Document end.**