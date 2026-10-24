"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LokaWordmark } from "@/components/LokaWordmark";
import { MetricsBlock } from "@/components/MetricsBlock";
import { RankTable } from "@/components/RankTable";
import { ResultsOverview } from "@/components/ResultsOverview";
import { RunFirstEmpty } from "@/components/RunFirstEmpty";
import { loadRankingSession } from "@/lib/ranking-session";
import type { StoredRankingSession } from "@/lib/ranking-types";

type Tab = "overall" | "individual";

export default function ResultsPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<StoredRankingSession | null>(null);
  const [tab, setTab] = useState<Tab>("overall");
  const [activeModel, setActiveModel] = useState("");

  useEffect(() => {
    const s = loadRankingSession();
    setSession(s);
    if (s) {
      const first =
        s.result.models_run.find((id) => s.result.per_model[id]) ??
        s.result.models_run[0] ??
        "";
      setActiveModel(first);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-8">
        <p className="animate-pulse-soft text-sm text-ink/55" aria-live="polite">
          Loading results…
        </p>
      </main>
    );
  }

  if (!session) {
    return <RunFirstEmpty />;
  }

  const { result } = session;
  const active = activeModel ? result.per_model[activeModel] : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-8 sm:pt-10">
      <header className="animate-rise mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
            Results
          </p>
          <h1 className="text-5xl leading-none sm:text-6xl">
            <LokaWordmark />
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/70 sm:text-base">
            Higher scores indicate a stronger ranking fit under the models you
            selected. Tiers group those fits into high, mid, and lower bands.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius)] border border-ink/20 px-4 text-sm font-medium text-ink hover:border-leaf hover:text-leaf"
        >
          Start another run
        </Link>
      </header>

      <div
        role="tablist"
        aria-label="Results view"
        className="animate-rise mb-8 inline-flex flex-wrap gap-1 rounded-[var(--radius)] border border-line bg-fog/50 p-1"
      >
        {(
          [
            ["overall", "Overall ranking"],
            ["individual", "Individual models"],
          ] as const
        ).map(([id, label]) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`tab-${id}`}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-[calc(var(--radius)-2px)] px-4 text-sm font-medium transition ${
                selected
                  ? "bg-leaf-deep text-sand"
                  : "text-ink hover:bg-sand"
              }`}
            >
              {label}
              {selected ? <span className="sr-only"> (selected)</span> : null}
            </button>
          );
        })}
      </div>

      {tab === "overall" ? (
        <section
          id="panel-overall"
          role="tabpanel"
          aria-labelledby="tab-overall"
          className="animate-rise space-y-10"
        >
          <ResultsOverview result={result} tableTitle="Overall rankings" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/rankings?mode=individual"
              className="block min-h-11 rounded-[var(--radius)] border border-line bg-sand/80 p-5 transition hover:border-leaf/50"
            >
              <p className="font-[family-name:var(--font-display)] text-xl text-ink">
                Open ranking explorer
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Browse individual model tables in a dedicated view.
              </p>
            </Link>
            <Link
              href="/rankings?mode=merged"
              className="block min-h-11 rounded-[var(--radius)] border border-line bg-sand/80 p-5 transition hover:border-leaf/50"
            >
              <p className="font-[family-name:var(--font-display)] text-xl text-ink">
                Build a merged ranking
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Re-run a smaller model subset and rebuild ensemble tiers.
              </p>
            </Link>
          </div>
        </section>
      ) : (
        <section
          id="panel-individual"
          role="tabpanel"
          aria-labelledby="tab-individual"
          className="animate-rise space-y-6"
        >
          <div className="max-w-md">
            <label
              htmlFor="results-model"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50"
            >
              Model
            </label>
            <select
              id="results-model"
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="min-h-11 w-full rounded-[var(--radius)] border border-line bg-sand px-3 text-sm text-ink outline-none focus-visible:border-leaf"
            >
              {result.models_run.map((id) => (
                <option key={id} value={id}>
                  {result.per_model[id]?.name ?? id}
                </option>
              ))}
            </select>
          </div>

          {active ? (
            <>
              <MetricsBlock model={active} />
              <RankTable
                title={`Rankings — ${active.name}`}
                rows={active.top10 ?? []}
                scoreKey={`score_${active.id}`}
              />
            </>
          ) : (
            <p className="text-sm text-ink/60" role="status">
              No ranking data for this model in the saved session.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
