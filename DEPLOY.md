# 部署指南（Vercel · Base Sepolia 测试网）

x402write 是 Next.js 16（App Router）应用，部署到 Vercel。全程跑在 **Base Sepolia**
测试网,USDC 为测试币,EAS 存证在 base-sepolia.easscan.org 可验证。

---

## 1. 环境变量

在 Vercel 项目 **Settings → Environment Variables** 按 `.env.local.example` 逐项填入。

| 变量 | 作用 | 暴露面 |
|---|---|---|
| `X402_NETWORK` | 固定 `eip155:84532`(代码会校验,填错即报错) | server |
| `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` | Coinbase CDP x402 facilitator 凭证(结算 USDC) | server（密钥,勿暴露) |
| `CONTENT_ENC_KEY` | 解密文章正文(`.enc`)的 32 字节密钥;`openssl rand -base64 32` | server（密钥) |
| `EAS_CONTRACT_ADDRESS` / `EAS_SCHEMA_REGISTRY` | Base Sepolia EAS 合约(用默认值即可) | server |
| `EAS_SCHEMA_UID` / `NEXT_PUBLIC_EAS_SCHEMA_UID` | schema UID,来自 `scripts/eas-register-schema.ts` | server / client |
| `EAS_GRAPHQL_URL` / `BASE_SEPOLIA_RPC_URL` | EAS 查询 + 链 RPC | server |
| `DEMO_AUTHOR_PRIVATE_KEY` | **仅本地 seed 脚本用**,Vercel 上不需要;**永远别用主网私钥** | 本地 only |

> `NEXT_PUBLIC_*` 会打进前端包,只放非敏感值。CDP 密钥与 `CONTENT_ENC_KEY` 绝不能加 `NEXT_PUBLIC_` 前缀。

---

## 2. ⚠️ Serverless 文件系统是只读的(重要)

本仓库用两个 JSON 文件做存储,运行时会写入:

- `data/payment-log.json` — 每次付费解锁追加一条(排行榜数据来源)
- `data/attestation-index.json` — `/publish` 发布成功后追加一条目录记录

**Vercel 的函数文件系统是只读的(只有 `/tmp` 可写且实例间不共享)**,所以:

- **付费解锁照常工作**:`appendPaymentLog` 已改为 best-effort(`lib/payment-log.ts`)——
  写入失败只打日志、不影响已结算的付费返回全文。代价:**Vercel 上排行榜 EARNED 不会增长**
  (重启即丢)。
- **`/publish` 发布在 Vercel 上不会持久化**:`appendIndex` 写入会失败,新文章刷新后消失。
  目录里已 commit 的 seed 文章(`data/attestation-index.json`)正常可读、可付费。

### 生产化做法
把这两处换成持久存储(任选其一),即可让发布 + 排行榜在线上真正生效:

- **Vercel KV / Upstash Redis**:把 `readPaymentLog/appendPaymentLog` 与
  `readIndex/appendIndex` 改写为读写 KV(list / hash)。
- **Postgres(Neon/Supabase)或任意 DB**:同上,JSON 文件 → 表。

迁移面很小:只需替换 `lib/payment-log.ts` 和 `lib/attestation-index.ts` 里的读写实现,
读写签名保持不变,上层(API 路由、排行榜)无需改动。

---

## 3. 部署步骤

```bash
# 1) 推到 GitHub,在 Vercel 导入该仓库(框架自动识别 Next.js)
# 2) 配好第 1 节的环境变量(Production + Preview)
# 3) Deploy
```

构建命令 `next build`、输出目录默认即可。首页与文章页是 `force-dynamic`(每次请求读目录/日志),
无需额外配置。

> 若 `AgentMode` 里引用的域名不是 `x402write.vercel.app`,记得同步 `components/reports/AgentMode.tsx`
> 和 `public/SKILL.md` 里的绝对 URL。

---

## 4. 链上前置(一次性)

```bash
pnpm install
cp .env.local.example .env.local   # 填好 CDP / CONTENT_ENC_KEY / DEMO_AUTHOR_PRIVATE_KEY

# 注册 EAS schema(打印 SCHEMA_UID,回填到 .env.local 与 Vercel)
pnpm tsx scripts/eas-register-schema.ts

# 把 seed 文章上链 + 写入目录(本地)
pnpm tsx scripts/seed-attest.ts yaoqian-crypto-liability web3-illegal-employment
```

`DEMO_AUTHOR_PRIVATE_KEY` 对应钱包需要少量 Base Sepolia ETH 付 gas;
faucet 列表见 https://docs.base.org/base-chain/network-information/network-faucets
(Coinbase CDP faucet 同时发 ETH + 测试 USDC)。

---

## 5. 演示前重置

```bash
pnpm tsx scripts/reset-demo.ts   # 清空 payment-log + 撤下 /publish 导入示例,回到干净开场
```

详见 [docs/DEMO.md](docs/DEMO.md)。
