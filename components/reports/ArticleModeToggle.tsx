"use client";
import { useEffect, useState } from "react";

export function ArticleModeToggle({ human, agent }: { human: React.ReactNode; agent: React.ReactNode }) {
  const [mode, setMode] = useState<"human" | "agent">("human");
  useEffect(() => {
    const saved = localStorage.getItem("x402write_article_mode");
    if (saved === "agent" || saved === "human") setMode(saved);
  }, []);
  function pick(m: "human" | "agent") { setMode(m); localStorage.setItem("x402write_article_mode", m); }
  return (
    <>
      {mode === "human" ? human : agent}
      <div className="mode-toggle" role="tablist" aria-label="阅读模式">
        <button
          className={mode === "human" ? "active" : ""}
          role="tab"
          aria-selected={mode === "human"}
          onClick={() => pick("human")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          Human
        </button>
        <button
          className={mode === "agent" ? "active" : ""}
          role="tab"
          aria-selected={mode === "agent"}
          onClick={() => pick("agent")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="7" width="16" height="13" rx="2" />
            <path d="M12 3v4M9 14h.01M15 14h.01" />
          </svg>
          Agent
        </button>
      </div>
    </>
  );
}
