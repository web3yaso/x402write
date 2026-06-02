import { notFound } from "next/navigation";
import { getPublishedReport, getReportBody } from "@/lib/reports";
import { previewSlice } from "@/lib/preview";
import { getCompanionPublic } from "@/lib/companions";
import { ArticleBody } from "@/components/reports/ArticleBody";
import { Paywall } from "@/components/reports/Paywall";
import { HumanUnlockGate } from "@/components/reports/HumanUnlockGate";
import { AgentMode } from "@/components/reports/AgentMode";
import { ArticleModeToggle } from "@/components/reports/ArticleModeToggle";

export default async function ReportDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = getPublishedReport(slug);
  if (!report) notFound();
  const preview = previewSlice(getReportBody(slug), 0.24);
  const easUrl = `https://base-sepolia.easscan.org/attestation/view/${report.record.attestationUID}`;
  const companion = getCompanionPublic(slug);

  const humanView = (
    <>
      <header className="hm-mast">
        <a href="/" className="hm-brand"><span className="mark"></span>x402write</a>
        <a href="/reports" className="hm-back">← 收录目录</a>
      </header>
      <div className="hm-grid" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
        <article className="hm-article">
          <div className="hm-pub">
            原发布 {report.meta.publishedAt} ·{" "}
            <a href={easUrl} target="_blank" rel="noreferrer">on-chain ✓ EAS:{report.record.attestationUID.slice(0, 6)}…</a>
          </div>
          <hr className="hm-rule" />
          <h1 className="hm-title">{report.meta.title}</h1>
          <p className="hm-deck">{report.meta.summary}</p>
          <div className="hm-byline">
            <span className="hm-av">{report.meta.authorName.slice(0, 1)}</span>
            <div>
              <div className="hm-au-name">{report.meta.authorName}</div>
              <div className="hm-au-role">{[report.meta.authorOrg, ...report.meta.tags].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          <HumanUnlockGate
            slug={slug}
            priceUsd={report.priceUsd}
            preview={
              <>
                <ArticleBody markdown={preview} title={report.meta.title} />
                <Paywall priceUsd={report.priceUsd} authorName={report.meta.authorName} />
              </>
            }
          />
        </article>
      </div>
    </>
  );

  const agentView = (
    <AgentMode
      slug={slug}
      title={report.meta.title}
      priceUsd={report.priceUsd}
      authorName={report.meta.authorName}
      companion={companion}
      sourceUrl={report.meta.sourceUrl}
    />
  );

  return (
    <div className="article">
      <ArticleModeToggle human={humanView} agent={agentView} />
    </div>
  );
}
