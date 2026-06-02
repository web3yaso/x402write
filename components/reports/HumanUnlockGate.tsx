"use client";
import { UnlockGate } from "./UnlockGate";
import { FullArticle } from "./FullArticle";
import type { ArticlePaid } from "@/lib/x402-client";

export function HumanUnlockGate({
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
      renderFull={(full: ArticlePaid) => <FullArticle full={full} />}
      ctaClassName="pw-cta"
    />
  );
}
