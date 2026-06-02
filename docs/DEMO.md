# x402write · 3 分钟演示脚本

闭环:**发布上链 → 进目录 → 真人付费 → Agent 付费 → 收益上升**。全程 Base Sepolia,
EAS 与 x402 结算均可在区块浏览器验证。对应验收标准见 [HACKATHON.md](HACKATHON.md) §3.1。

---

## 开演前准备(录屏外)

**两个钱包(关键:互不相同,且都不是作者收款地址)**
- **作者钱包**:`/publish` 签名发布用;有少量 Base Sepolia ETH 付 gas。
- **读者钱包**:付费解锁用;在 Base Sepolia 持有 **≥ $1 测试 USDC**(faucet.circle.com),
  且**不能等于文章作者地址**(自付会被 facilitator 拒:`self_send_not_allowed`)。
- MetaMask 网络切到 **Base Sepolia (84532)**。

**重置到干净开场**
```bash
pnpm reset-demo      # 清空 payment-log(EARNED 归 0)+ 撤下 /publish 导入示例文章
pnpm dev
```
- 打开首页 → **For Writers** tab,记下作者当前 EARNED(应为 `$0.00`)。
- AgentCash MCP(或你的 agent 演示器)已就绪。

---

## 录屏脚本(~3 分钟)

### ① 发布上链(~40s)
- 打开 `/publish`,展示待发布文章(导入示例)。
- 用**作者钱包**签名 → 弹窗确认 → 返回 **attestation UID + tx hash**。
- 一句话点出:作者身份 + 内容哈希 + 定价已写进 EAS,链上可验证。

### ② 进入目录(~20s)
- 刷新 `/reports`(或首页「收录文章」)→ 新文章出现,带 **on-chain ✓ EAS** 徽章。
- 点徽章可跳 base-sepolia.easscan.org 验证(可选)。

### ③ 真人付费解锁(~50s)
- 打开该文 `/reports/[slug]`,展示 ~24% 预览 + paywall(标注"100% 归作者,平台 0 抽成")。
- 切到**读者钱包**,点「用钱包付 $X 解锁全文」→ 钱包签名 → **全文展开**。
- 强调:同一钱包重访无需再付(localStorage 永久解锁)。
- (可选)basescan 看 USDC 结算 tx。

### ④ Agent 付费(~40s)
- 切到文章页的 **Agent Mode**,复制 "setup prompt"。
- 在 Claude Code / agent 演示器粘贴并说:`读取 x402write 这篇文章的全文`。
- Agent 读 `/SKILL.md` → 对 `/api/v1/articles/<slug>` 走 **402 → pay → 200**,
  拿到全文 + companion(术语表 / 法条地图 / 误区表),给出带出处的回答。

### ⑤ 收益可见(~20s)
- 回首页 **For Writers** tab 刷新 → 作者那行 **EARNED 上升**
  (增量 = 价格 × 2,分别来自真人与 agent 两笔付费)。
- 收尾:一条内容,真人和 agent 同价付费,作者全额到账,全程链上可查。

---

## 常见卡点(现场自救)

| 现象 | 原因 / 处理 |
|---|---|
| 解锁报「无法购买自己的文章」 | 读者钱包 = 作者地址。换一个非作者钱包。 |
| 解锁报「测试 USDC 余额不足」 | 去 faucet.circle.com 领 Base Sepolia USDC;确认网络是 84532。 |
| 解锁报「网络不匹配」 | MetaMask 切到 Base Sepolia (84532)。 |
| EARNED 没涨 | 确认在 For Writers tab 且已刷新;本地跑(非 Vercel)才会持久化(见 DEPLOY.md)。 |
| 发布后文章没出现 | 本地 dev 才写目录;Vercel 上 `/publish` 不持久化(只读 FS,见 DEPLOY.md)。 |
