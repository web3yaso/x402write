import { getPublishData } from "@/lib/publish-data";
import { SignAttestForm } from "@/components/publish/SignAttestForm";
import { Masthead } from "@/components/home/Masthead";
import { Footer } from "@/components/home/Footer";

export default async function PublishPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const { meta, contentHash } = getPublishData();
  return (
    <>
      <Masthead />
      <main className="pub">
        <SignAttestForm meta={meta} contentHash={contentHash} source={source ?? ""} />
      </main>
      <Footer />
    </>
  );
}
