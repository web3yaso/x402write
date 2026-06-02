"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMarkdown } from "@/lib/markdown";
import type { ArticlePaid } from "@/lib/x402-client";

export function FullArticle({ full }: { full: ArticlePaid }) {
  return (
    <div className="hm-body">
      <div className="unlocked-note">
        ✓ 已解锁 · {full.citation.author} · 全文已展开
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizeMarkdown(full.content, { title: full.title })}
      </ReactMarkdown>
    </div>
  );
}
