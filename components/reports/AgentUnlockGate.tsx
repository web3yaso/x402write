"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMarkdown } from "@/lib/markdown";
import { UnlockGate } from "./UnlockGate";
import type { ArticlePaid } from "@/lib/x402-client";

function AgentFullContent({ full }: { full: ArticlePaid }) {
  return (
    <div className="ag-unlocked">
      <div className="ag-unlocked-note">
        ✓ 已解锁 · {full.citation.author} · 全文已展开
      </div>
      <div className="ag-unlocked-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {normalizeMarkdown(full.content)}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function AgentUnlockGate({
  slug,
  priceUsd,
  preview,
}: {
  slug: string;
  priceUsd: string;
  preview: React.ReactNode;
}) {
  return (
    <UnlockGate
      slug={slug}
      priceUsd={priceUsd}
      preview={preview}
      renderFull={(full: ArticlePaid) => <AgentFullContent full={full} />}
      ctaClassName="cta"
    />
  );
}
