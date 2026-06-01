"use client";

import { useState } from "react";

export function NewsletterStrip() {
  const [shown, setShown] = useState(true);
  if (!shown) return null;
  return (
    <div className="news">
      <div className="news-inner">
        <span><b>Newsletter:</b> <a href="#">追踪每月合规动态 →</a></span>
        <button className="news-close" aria-label="close" onClick={() => setShown(false)}>×</button>
      </div>
    </div>
  );
}
