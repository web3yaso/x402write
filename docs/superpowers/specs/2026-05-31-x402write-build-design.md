# x402write 黑客松构建设计（决策层）

**日期**: 2026-05-31
**作者**: Sophie（与 Claude 协作 brainstorm）
**关系**: 本文档**不重复** `docs/HACKATHON.md`（v1.2，实现就绪的 demo loop spec）。它在 HACKATHON.md 之上叠一层 **本次 brainstorm 的决策、对 PRD 的偏离、构建排序、真跑 vs stub 边界、风险点**。凡 HACKATHON.md 已规定且本文未推翻者，一律以 HACKATHON.md 为准。

---

## 1. 本次确定的决策

### 1.1 钱包连接层 —— 偏离 PRD
- **去掉 RainbowKit，去掉 WalletConnect**。MVP 只支持 **MetaMask**。
- 采用 **纯 wagmi v2 + viem + `injected()` connector**，自写一个极简 `<ConnectButton>`（未连：`Connect MetaMask`；已连：地址缩写 + 断开）。
- **理由**：只有一个钱包，不需要 RainbowKit 的多钱包选择 modal；RainbowKit 默认配置绑 WalletConnect 并要求 projectId，去掉它即彻底移除 WalletConnect 依赖与 `NEXT_PUBLIC_WC_PROJECT_ID`。
- **隔离**：connect 层封装在 `lib/wagmi-config.ts` + `components/shared/WalletConnect.tsx`。EAS SDK 与 `@x402/evm` 的签名代码坐在 viem 的 `WalletClient`/signer 上，与 connect 层解耦。
- **可演进性**：未来要加 Privy（读者 email/社交登录 → 内嵌钱包 onboarding）或 RainbowKit，都是 **connector 级改动**，EAS/x402 签名代码无需改动。Privy 的价值点是 `prd.md` v2.0 的「非专业读者 onboarding」，本黑客松闭环假设钱包预先充值，故不上。

**对 PRD 的偏离（需在实现时同步修订 HACKATHON.md）**：
- §4 技术栈「真人钱包 = wagmi v2 + viem + **RainbowKit**」→ 改为 wagmi v2 + viem + injected connector（无 RainbowKit）。
- §9 环境变量 `NEXT_PUBLIC_WC_PROJECT_ID` → **删除**。

### 1.2 内容来源
- seed 文章 `content/reports/otc-freeze-case-001.mdx` 与 companion `content/companions/otc-freeze-case-001.md` 的**正文由 Sophie 提供**。
- 落地策略：先放**结构占位**——正确的 frontmatter schema（§7 字段）+ companion 0/A/B/C 四区骨架 + 明显的 `<!-- 待粘贴 -->` 标记，让 Phase 0–2 脚手架可跑；正文到位后替换。
- Story 6 引用的 `legal-explainer-agent-mode-design.md` 仓库内不存在；companion 的 0/A/B/C 分区与付费边界以 HACKATHON.md §5 Story 6 + §8.6 为准，足以实现。

---

## 2. 凭证现状 → 真跑 vs stub 边界

| 能力 | 现状 | 方案 |
|---|---|---|
| 测试网钱包（Base Sepolia，含 gas / USDC） | ✅ 有 | Story 1（签名上链）/ Story 3（真人付费）可真跑 |
| Coinbase CDP key（`CDP_API_KEY_ID/SECRET`） | ✅ 有 | x402 facilitator 用 CDP（`x402.org/facilitator` 兜底） |
| EAS schema UID | ❌ 未注册 | 写 `scripts/eas-register-schema.ts`，**由 Sophie 跑一次**，结果写入 `.env.local` 的 `EAS_SCHEMA_UID` |
| WalletConnect projectId | — | **不再需要**（1.1 决策） |
| seed 正文 + companion 正文 | ⏳ Sophie 提供 | 先占位，后替换 |

---

## 3. 构建排序（对齐 PRD §11 Phase，标可演示节点）

| Phase | 节点条件 | 依赖/备注 |
|---|---|---|
| 0 · 脚手架 | `pnpm dev` 起，主页空壳 + **injected connect 按钮**可用 | Next.js 16 App Router + React 19 + TS5 + Tailwind v4 + pnpm；`.npmrc` 设 `legacy-peer-deps=true` |
| 1 · 首页移植 | 三 tab 切换、prompt 卡填入、copy 按钮全 work，视觉对齐 | 源：`docs/mockups/01-home.html` + `tokens.css` + `base.css` |
| 2 · EAS | schema 注册脚本跑通；`/publish` 签名出 tx + EAS Explorer 可查 | 需 Sophie 跑注册脚本 |
| 3 · MDX 内容层 | `/reports` 列表 + `[slug]` 预览（前 24%） | 需 seed 正文，缺则用占位 |
| 4 · x402 | 真人 Unlock 全流程 + agent endpoint（`withX402`）402→pay→200 | CDP facilitator |
| 4.5 · companion | 预烘 companion + `/reports/[slug]` Agent Mode 区（Explainer + 四句起手 prompt + agent setup）copy 全 work；付费响应带〔A〕区；`/api/internal/companions` stub | 需 companion 正文，缺则占位 |
| 5 · 榜单接真数据 | `TopEarningAuthors` 从 mock 切到 `data/payment-log.json` 聚合，付费后刷新可见 EARNED 增长 | |
| 6 · 收尾 | 3 分钟演示稿 + README + `.env.local.example`（无 WC 项）+ DEPLOY.md | |

---

## 4. 风险点（实现时盯）

1. **`@x402/next` v2 + Next 16 peer-dep**：装包用 `legacy-peer-deps=true`（PRD §4.1）。v2 的 `withX402` API 与网上 v1（`x402-next`）教程不同——以官方 v2 类型为准，**不照搬旧例**。安全清单要求 slug whitelist 在 RouteConfig 闭包**之前**判（无效 slug → 404，不走付费墙）。
2. **「永久可读」黑客松简化**：每次 reload 重新付（PRD §3 Story3 已认账）。录屏时知悉此点。
3. **`data/payment-log.json` 写文件**：Serverless / 并发下不可靠。本机 demo 可接受；部署 Vercel 时写文件系统是已知雷（只读 FS / `/tmp` 不持久），DEPLOY.md 标红，生产路径为 facilitator webhook → DB。
4. **402 body 纪律**：402 响应体只含 payment requirements，**绝不**含一行 markdown 全文，不漏题（PRD §8.3）。companion〔A〕区（术语表/法条地图/误区表）属付费内容，不进公开 scaffold、不进 402 body（PRD §8.6）。
5. **价格 / payTo 服务端权威**：`maxAmountRequired` 与 `payTo` 一律从 EAS 链上数据取，绝不接受 query 覆盖（PRD §8.1/8.2）。MDX frontmatter 不写 `priceUsd`。
6. **网络强校验**：`lib/x402-server.ts` 启动断言 `X402_NETWORK === 'eip155:84532'`，否则 throw（PRD §8.5）。

---

## 5. 不变项（沿用 HACKATHON.md，不在此重述）

页面/路由清单（§6）、EAS schema 设计（§7）、五个故事数据流（§5）、安全审查清单（§10）、3 分钟演示脚本（§12）——全部以 HACKATHON.md 为准，仅按本文 §1 的钱包层偏离调整。
