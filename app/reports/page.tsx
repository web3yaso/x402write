import { Masthead } from "@/components/home/Masthead";
import { Footer } from "@/components/home/Footer";
import { ReportCard } from "@/components/reports/ReportCard";
import { listPublishedReports } from "@/lib/reports";

export default function ReportsPage() {
  const reports = listPublishedReports();
  return (
    <>
      <Masthead />
      <main className="reports">
        <p className="eyebrow">Story 2 · On-chain catalog</p>
        <h1 className="display">报告目录</h1>
        <p className="sub">链上可验证内容库 · 每篇附 EAS attestation,价格与作者来自链上。</p>
        {reports.length === 0 ? (
          <p className="sub">还没有已上链的报告。</p>
        ) : (
          <div className="cards">
            {reports.map((r) => (
              <ReportCard key={r.meta.slug} report={r} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
