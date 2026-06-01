"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const ARTICLES = [
  { cat: "Enforcement · 大陆", price: "$0.30", q: "OTC 卖 USDT 后银行卡被冻,24 小时内该做什么?", how: "5 分钟区分风控/司法冻结 · 7 步应对清单 · 训诫书该不该签 · 4 个可复制 prompt", author: "陈律师 · 公众号" },
  { cat: "Compliance · 大陆", price: "$0.20", q: "境内做 OTC 商家,会不会被认定帮信罪?", how: "最低合规门槛 · 帮信 vs 掩隐的认定边界 · 留痕清单 · 3 个可复制 prompt", author: "OTC 法律日记 · 公众号" },
  { cat: "License · 香港", price: "$0.25", q: "香港 VATP 牌照:条件、时间表和资本要求?", how: "申请门槛拆解 · 时间线与成本 · 常见驳回理由 · 2 个可复制 prompt", author: "Lex Web3 · Mirror" },
  { cat: "Tax · 跨境", price: "$0.15", q: "跨境收 USDT 当劳务报酬,境内个税怎么报?", how: "申报口径 · 折算与凭证 · 真实补税案例 · 2 个可复制 prompt", author: "币圈合规观察 · 公众号" },
  { cat: "Sanctions · 链上", price: "$0.10", q: "钱包被加进 OFAC SDN 名单后,链上还能转出吗?", how: "SDN 链上后果 · 合规出口 · 误伤申诉路径 · 2 个可复制 prompt", author: "Web3 合规小组 · 飞书" },
  { cat: "Case · 大陆", price: "$0.20", q: "NFT 在大陆被定性为虚拟商品的近期判例?", how: "判例时间线 · 定性逻辑 · 对发行方的启示 · 2 个可复制 prompt", author: "CN Crypto Court · Substack" },
];

const CHIPS = [
  ["币圈合规观察", "公众号"], ["SG MAS Watcher", "Substack"], ["Lex Web3", "Mirror"],
  ["ChainLaw HK", "公众号"], ["Paige Zhao", "Mirror"], ["OTC 法律日记", "公众号"],
  ["CN Crypto Court", "Substack"], ["Web3 合规小组", "飞书"],
];

export function ReadersPanel() {
  const router = useRouter();
  const find = () => router.push("/reports");

  return (
    <section className="panel active" id="panel-readers">
      <h1 className="display">你的问题,<em>已经有人写过答案</em>。</h1>
      <p className="sub">搜索你的处境,付费阅读实名律师写的对应文章,即得答案。</p>
      <p className="powered">Powered by MPP on Tempo and x402 on Base</p>

      <div className="big-input">
        <input
          type="text"
          placeholder="我的工行卡因 OTC 出金被冻结,下一步怎么办?"
          onKeyDown={(e) => { if (e.key === "Enter") find(); }}
        />
        <button onClick={find}>Find</button>
      </div>
      <p className="input-hint">付费阅读对应文章即得答案 · 付费直达作者</p>

      <div className="sec-title" style={{ fontSize: "21px", fontWeight: 700 }}>收录文章</div>
      <p className="guide-lead">每篇都由实名作者汇编自真实案例。付费后不仅能读到全文,还附场景 prompt —— 复制丢进你常用的 AI,帮你把文章用到自己的处境上,理解并解决问题。</p>
      <div className="guide-grid">
        {ARTICLES.map((a, i) => (
          <Link className="guide-card" href="/reports" key={i}>
            <div className="g-top"><span className="g-cat">{a.cat}</span><span className="g-price">{a.price}</span></div>
            <div className="g-q">{a.q}</div>
            <div className="g-how">{a.how}</div>
            <div className="g-foot"><span className="g-author">{a.author}</span></div>
          </Link>
        ))}
      </div>

      <div className="sec-title muted" style={{ marginTop: "48px" }}>Supported Authors</div>
      <div className="chips">
        {CHIPS.map(([name, via], i) => (
          <span className="chip" key={i}>{name} <span className="via">· {via}</span></span>
        ))}
      </div>

      <div className="sec-actions">
        找不到对应文章? <Link href="/reports">浏览全部收录</Link> · <a href="#">订阅 $19/月 畅读所有作者</a>
      </div>
    </section>
  );
}
