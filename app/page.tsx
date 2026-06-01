import { Masthead } from "@/components/home/Masthead";
import { NewsletterStrip } from "@/components/home/NewsletterStrip";
import { HomeTabs } from "@/components/home/HomeTabs";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Masthead />
      <NewsletterStrip />
      <main>
        <HomeTabs />
      </main>
      <Footer />
    </>
  );
}
