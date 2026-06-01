"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const ARTICLES = [
  {
    cat: "Governance · 跨境",
    price: "$0.30",
    q: "重构链上契约:从 DAO 的治理困局到 RWA 的资产编程革命",
    how: "链上合伙制(劳动主导资本)范式 · 数字权益单元的法律定义 · RWA 三层资产编程终局",
    author: "Alex Fan · LXDAO · 公众号",
    href: "/reports/onchain-partnership-rwa",
  },
];

const CHIPS = [
  ["Alex Fan", "LXDAO"],
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
          <Link className="guide-card" href={a.href} key={i}>
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
