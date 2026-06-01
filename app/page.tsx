import { WalletConnect } from "@/components/shared/WalletConnect";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 flex h-15 items-center justify-between border-b border-line bg-paper/90 px-6 backdrop-blur">
        <span className="font-mono text-lg font-bold text-crimson">x402write</span>
        <WalletConnect />
      </header>
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-crimson">
          Phase 0 · scaffold
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">
          Ask a Chinese crypto compliance writer anything.
        </h1>
        <p className="mt-4 max-w-prose text-ink-soft">
          Home content lands in Phase 1 (port of docs/mockups/01-home.html). For now this
          shell proves the app boots and MetaMask connect works.
        </p>
      </main>
    </div>
  );
}
