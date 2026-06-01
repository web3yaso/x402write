"use client";

import { useState } from "react";
import { ReadersPanel } from "./ReadersPanel";
import { WritersPanel } from "./WritersPanel";
import { AgentsPanel } from "./AgentsPanel";

type Tab = "readers" | "writers" | "agents";

const TABS: { key: Tab; label: React.ReactNode }[] = [
  { key: "readers", label: "Try it" },
  { key: "writers", label: "For Writers" },
  { key: "agents", label: <>For Agents <span className="soon">SOON</span></> },
];

export function HomeTabs() {
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

      {tab === "readers" && <ReadersPanel />}
      {tab === "writers" && <WritersPanel />}
      {tab === "agents" && <AgentsPanel />}
    </>
  );
}
