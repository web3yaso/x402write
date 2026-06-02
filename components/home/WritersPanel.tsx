"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopEarningAuthors } from "./TopEarningAuthors";
import type { LeaderboardRow, WriterStats } from "@/lib/leaderboard";

export function WritersPanel({ leaderboard, writerStats }: { leaderboard: LeaderboardRow[]; writerStats: WriterStats }) {
  const router = useRouter();
  const [src, setSrc] = useState("");
  const importGo = () => router.push("/publish?source=" + encodeURIComponent(src));

  return (
    <section className="panel active" id="panel-writers">
      <h1 className="display">{"你的文章已经很有价值\n现在Agent也可以付费阅读"}</h1>
      <p className="sub">{"导入你的公众号文章,可先预览再建账户。\n我们还会为每篇自动配上场景 prompt,帮读者把文章用到自己的处境上 —— \n真人与 Agent 同价付费阅读,款项直达你的钱包。"}</p>

      <div className="big-input">
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") importGo(); }}
          placeholder="cryptolaw_cn  ·  公众号名 / Mirror URL / Substack URL"
        />
        <button onClick={importGo}>Import</button>
      </div>
      <p className="input-hint">历史文章 + 后续新发可一次性授权</p>

      <div className="stats">
        <div className="stat">
          <div className="lbl">Total Articles Purchased</div>
          <div className="val">{writerStats.totalPurchased.toLocaleString()}</div>
          <div className="delta">{writerStats.authorCount} author{writerStats.authorCount === 1 ? "" : "s"}</div>
        </div>
        <div className="stat">
          <div className="lbl">Total Earned by Authors</div>
          <div className="val acc">{writerStats.totalEarned}</div>
          <div className="delta">0% platform fee</div>
        </div>
      </div>

      <TopEarningAuthors rows={leaderboard} />
    </section>
  );
}
