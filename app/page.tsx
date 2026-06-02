import { Masthead } from "@/components/home/Masthead";
import { NewsletterStrip } from "@/components/home/NewsletterStrip";
import { HomeTabs } from "@/components/home/HomeTabs";
import { Footer } from "@/components/home/Footer";
import { listReaderCatalog } from "@/lib/reports";
import { listLeaderboard, getWriterStats } from "@/lib/leaderboard";

// Reads the attestation index per request → don't statically cache (also keeps
// the Phase-5 leaderboard live, and surfaces freshly published articles).
export const dynamic = "force-dynamic";

export default function Home() {
  // 收录文章 = every published report, newest first (incl. the /publish import
  // example once it has been published — matches the /reports catalog).
  const readerArticles = listReaderCatalog();
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
