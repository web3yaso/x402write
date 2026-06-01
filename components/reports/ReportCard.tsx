import Link from "next/link";
import type { PublishedReport } from "@/lib/reports";

interface Props {
  report: PublishedReport;
}

export function ReportCard({ report }: Props) {
  const { meta, record, priceUsd } = report;
  const [category, ...otherTags] = meta.tags;
  const uidShort = record.attestationUID.slice(0, 6) + "…";

  return (
    <Link href={`/reports/${meta.slug}`} className="card">
      <div className="card-top">
        <div className="card-tags">
          {category && (
            <span className={`tag cat ${category.toLowerCase()}`}>
              {category}
            </span>
          )}
          {otherTags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <span className="eas" title="在 EAS Explorer 验证">
          <span className="chk">✓</span>on-chain
          <span className="uid">EAS:{uidShort}</span>
        </span>
      </div>
      <h2>{meta.title}</h2>
      {meta.summary && <p>{meta.summary}</p>}
      <div className="card-foot">
        <span className="byline">
          <b>{meta.authorName}</b>
          {meta.authorOrg && (
            <span className="plat">{meta.authorOrg}</span>
          )}
        </span>
        <span className="price">{priceUsd}</span>
      </div>
    </Link>
  );
}
