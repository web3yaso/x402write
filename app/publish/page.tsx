import { getPublishData } from "@/lib/publish-data";
import { SignAttestForm } from "@/components/publish/SignAttestForm";

export default async function PublishPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const { meta, contentHash } = getPublishData();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-2xl font-bold text-ink">发布报告</h1>
      <p className="mb-8 text-sm text-ink-mute">签名上链你的文章 · Base Sepolia · EAS</p>
      <SignAttestForm meta={meta} contentHash={contentHash} source={source ?? ""} />
    </main>
  );
}
