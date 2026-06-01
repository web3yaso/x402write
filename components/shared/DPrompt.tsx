"use client";

import { useState } from "react";

export function DPrompt({ label, body }: { label: string; body: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="dprompt">
      <span className="dprompt-lbl">{label}</span>
      <button className={`copy${copied ? " copied" : ""}`} onClick={handleCopy}>
        {copied ? "copied" : "copy"}
      </button>
      <div className="body">{body}</div>
    </div>
  );
}
