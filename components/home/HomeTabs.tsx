"use client";

import { useState } from "react";
import { ReadersPanel } from "./ReadersPanel";
import { WritersPanel } from "./WritersPanel";
import { AgentsPanel } from "./AgentsPanel";
import type { PublishedReport } from "@/lib/reports";
import type { LeaderboardRow, WriterStats } from "@/lib/leaderboard";

type Tab = "readers" | "writers" | "agents";

const TABS: { key: Tab; label: React.ReactNode }[] = [
  { key: "readers", label: "Try it" },
  { key: "writers", label: "For Writers" },
  { key: "agents", label: "For Agents" },
];

export function HomeTabs({ readerArticles, leaderboard, writerStats }: {
  readerArticles: PublishedReport[];
  leaderboard: LeaderboardRow[];
  writerStats: WriterStats;
}) {
  const [tab, setTab] = useState<Tab>("readers");

  function select(t: Tab) {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="pills-wrap">
        <div className="pills" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`pill${tab === t.key ? " active" : ""}`}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => select(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "readers" && <ReadersPanel articles={readerArticles} />}
      {tab === "writers" && <WritersPanel leaderboard={leaderboard} writerStats={writerStats} />}
      {tab === "agents" && <AgentsPanel />}
    </>
  );
}
