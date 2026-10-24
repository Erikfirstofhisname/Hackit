import Link from "next/link";
import { LokaWordmark } from "./LokaWordmark";

export function RunFirstEmpty() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-8">
      <header className="animate-rise mb-10 max-w-2xl">
        <h1 className="text-5xl leading-none sm:text-6xl">
          <LokaWordmark />
        </h1>
      </header>
      <div
        className="animate-rise max-w-lg rounded-[var(--radius)] border border-line bg-fog/60 px-5 py-6 shadow-[var(--shadow-soft)]"
        role="status"
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
          Run models first
        </h2>
        <p className="mt-2 text-ink/70">
          No saved ranking was found in this browser tab. Configure models on
          the home page, generate rankings, then return here.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-[var(--radius)] bg-leaf-deep px-4 text-sm font-semibold text-sand hover:bg-leaf"
        >
          Go to model configuration
        </Link>
      </div>
    </main>
  );
}
