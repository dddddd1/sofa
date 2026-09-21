import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Harper Cloud</span>
          <span className="text-xs uppercase tracking-widest text-harper-clay">
            Modular Sofas · Made to your layout
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          A modular sofa, configured live in 3D.
        </h1>
        <p className="max-w-xl text-lg text-black/60">
          Pick modules, a performance fabric, legs and power. Watch the layout, price and BOM
          update in real time — with white-glove delivery across the US.
        </p>

        <Link
          href="/products/harper-cloud"
          className="rounded-full bg-harper-ink px-8 py-4 text-sm font-medium text-white transition hover:opacity-90"
        >
          Configure the Harper Cloud →
        </Link>

        <p className="text-xs text-black/40">
          Shared SSR/ISR catalog · Same-domain Three.js configurator
        </p>
      </main>
    </>
  );
}