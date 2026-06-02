import { Masthead } from "@/components/home/Masthead";
import { NewsletterStrip } from "@/components/home/NewsletterStrip";
import { HomeTabs } from "@/components/home/HomeTabs";
import { Footer } from "@/components/home/Footer";
import { listPublishedReports } from "@/lib/reports";
import { listLeaderboard, getWriterStats } from "@/lib/leaderboard";

// The DAO/RWA article is the /publish import example, not a reader-catalog item.
const IMPORT_EXAMPLE_SLUG = "onchain-partnership-rwa";

// Reads the attestation index per request → don't statically cache (also keeps
// the Phase-5 leaderboard live).
export const dynamic = "force-dynamic";

export default function Home() {
  // 收录文章 = published reports minus the import example, newest first.
  const readerArticles = listPublishedReports()
    .filter((r) => r.meta.slug !== IMPORT_EXAMPLE_SLUG)
    .sort((a, b) => (a.meta.publishedAt < b.meta.publishedAt ? 1 : -1));
  const leaderboard = listLeaderboard();
  const writerStats = getWriterStats();
  return (
    <>
      <Masthead />
      <NewsletterStrip />
      <main>
        <HomeTabs readerArticles={readerArticles} leaderboard={leaderboard} writerStats={writerStats} />
      </main>
      <Footer />
    </>
  );
}
