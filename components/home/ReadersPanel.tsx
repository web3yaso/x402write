"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routeForQuery } from "@/lib/query-route";
import type { PublishedReport } from "@/lib/reports";

const SAMPLE_QUESTION = "为 web3 公司工作,有什么风险?";

export function ReadersPanel({ articles }: { articles: PublishedReport[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Empty input → demo the sample question; otherwise route by the reader's text.
  const find = () => router.push(routeForQuery(query.trim() || SAMPLE_QUESTION));

  // "Supported Authors" chips = the distinct authors of the catalog articles.
  const chips = Array.from(
    new Map(
      articles.map((a) => [a.meta.authorName, a.meta.authorOrg ?? a.meta.tags[1] ?? ""]),
    ).entries(),
  );

  return (
    <section className="panel active" id="panel-readers">
      <h1 className="display">你的问题,<em>已经有人写过答案</em>。</h1>
      <p className="sub">搜索你的处境,付费阅读实名作者写的对应文章,即得答案。</p>
      <p className="powered">Powered by MPP on Tempo and x402 on Base</p>

      <div className="big-input">
        <input
          type="text"
          placeholder={SAMPLE_QUESTION}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") find(); }}
        />
        <button onClick={find}>Find</button>
      </div>
      <p className="input-hint">付费阅读对应文章即得答案 · 付费直达作者</p>

      <div className="sec-title" style={{ fontSize: "21px", fontWeight: 700 }}>收录文章</div>
      <p className="guide-lead">每篇都由实名作者汇编自真实案例。付费后不仅能读到全文,还附场景 prompt —— 复制丢进你常用的 AI,帮你把文章用到自己的处境上,理解并解决问题。</p>
      <div className="guide-grid">
        {articles.map((a) => (
          <Link className="guide-card" href={`/reports/${a.meta.slug}`} key={a.meta.slug}>
            <div className="g-top">
              <span className="g-cat">{a.meta.tags[0]}</span>
              <span className="g-price">{a.priceUsd}</span>
            </div>
            <div className="g-q">{a.meta.title}</div>
            <div className="g-how">{a.meta.summary}</div>
            <div className="g-foot">
              <span className="g-author">{a.meta.authorName}{a.meta.authorOrg ? ` · ${a.meta.authorOrg}` : ""}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="sec-title muted" style={{ marginTop: "48px" }}>Supported Authors</div>
      <div className="chips">
        {chips.map(([name, via]) => (
          <span className="chip" key={name}>{name}{via ? <span className="via"> · {via}</span> : null}</span>
        ))}
      </div>

      <div className="sec-actions">
        找不到对应文章? <Link href="/reports">浏览全部收录</Link> · <a href="#">订阅 $19/月 畅读所有作者</a>
      </div>
    </section>
  );
}
