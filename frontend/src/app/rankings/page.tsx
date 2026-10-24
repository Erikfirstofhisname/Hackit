"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LokaWordmark } from "@/components/LokaWordmark";
import { MetricsBlock } from "@/components/MetricsBlock";
import { RankTable } from "@/components/RankTable";
import { ResultsOverview } from "@/components/ResultsOverview";
import { RunFirstEmpty } from "@/components/RunFirstEmpty";
import {
  loadRankingSession,
  parseApiError,
  sameModelSet,
} from "@/lib/ranking-session";
import type { RunResult, StoredRankingSession } from "@/lib/ranking-types";
import { friendlyError, taskBadgeLabel } from "@/lib/format";

type Mode = "individual" | "merged";

export default function RankingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
          <p className="animate-pulse-soft text-sm text-ink/55">
            Loading rankings…
          </p>
        </main>
      }
    >
      <RankingsInner />
    </Suspense>
  );
}

function RankingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode: Mode = modeParam === "merged" ? "merged" : "individual";

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<StoredRankingSession | null>(null);
  const [activeModel, setActiveModel] = useState<string>("");
  const [mergeSelected, setMergeSelected] = useState<Record<string, boolean>>(
    {}
  );
  const [mergedResult, setMergedResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadRankingSession();
    setSession(s);
    if (s) {
      const first =
        s.result.models_run.find((id) => s.result.per_model[id]) ??
        s.result.models_run[0] ??
        "";
      setActiveModel(first);
      const sel: Record<string, boolean> = {};
      s.result.models_run.forEach((id) => {
        sel[id] = true;
      });
      setMergeSelected(sel);
      setMergedResult(null);
    }
    setReady(true);
  }, []);

  const setMode = (next: Mode) => {
    router.replace(`/rankings?mode=${next}`);
  };

  const selectedSubset = useMemo(
    () =>
      Object.entries(mergeSelected)
        .filter(([, on]) => on)
        .map(([id]) => id),
    [mergeSelected]
  );

  const canMerge = selectedSubset.length >= 2;

  const selectAllMerge = () => {
    if (!session) return;
    const next: Record<string, boolean> = {};
    session.result.models_run.forEach((id) => {
      next[id] = true;
    });
    setMergeSelected(next);
  };

  const clearMerge = () => {
    if (!session) return;
    const next: Record<string, boolean> = {};
    session.result.models_run.forEach((id) => {
      next[id] = false;
    });
    setMergeSelected(next);
  };

  const generateMerged = useCallback(async () => {
    if (!session || !canMerge) return;
    setError(null);

    if (sameModelSet(selectedSubset, session.modelIds)) {
      setMergedResult(session.result);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_ids: selectedSubset,
          prompts: session.prompts,
          top_n: 100,
          n_tiers: 3,
        }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res));
      }
      const data: RunResult = await res.json();
      setMergedResult(data);
    } catch (e) {
      setError(
        friendlyError(e instanceof Error ? e.message : "Merged run failed")
      );
      setMergedResult(null);
    } finally {
      setLoading(false);
    }
  }, [session, canMerge, selectedSubset]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        <p className="animate-pulse-soft text-sm text-ink/55">Loading rankings…</p>
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
        <div>
          <p className="mb-2 text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
            Ranking explorer
          </p>
          <h1 className="text-5xl leading-none sm:text-6xl">
            <LokaWordmark />
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/results"
            className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-ink/20 px-4 text-sm font-medium text-ink hover:border-leaf hover:text-leaf"
          >
            Back to results
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-ink/20 px-4 text-sm font-medium text-ink hover:border-leaf hover:text-leaf"
          >
            Start another run
          </Link>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Ranking mode"
        className="animate-rise mb-8 inline-flex flex-wrap gap-1 rounded-[var(--radius)] border border-line bg-fog/50 p-1"
      >
        {(
          [
            ["individual", "Individual ranking"],
            ["merged", "Merged ranking"],
          ] as const
        ).map(([id, label]) => {
          const selected = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`rank-tab-${id}`}
              aria-controls={`rank-panel-${id}`}
              onClick={() => setMode(id)}
              className={`min-h-11 rounded-[calc(var(--radius)-2px)] px-4 text-sm font-medium ${
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

      {mode === "individual" ? (
        <section
          id="rank-panel-individual"
          className="animate-rise space-y-6"
          role="tabpanel"
          aria-labelledby="rank-tab-individual"
        >
          <div className="max-w-sm">
            <label
              htmlFor="individual-model"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50"
            >
              Model
            </label>
            <select
              id="individual-model"
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="min-h-11 w-full rounded-[var(--radius)] border border-line bg-sand px-3 text-sm text-ink"
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
            <p className="text-sm text-ink/60">
              No ranking data for this model in the saved session.
            </p>
          )}
        </section>
      ) : (
        <section
          id="rank-panel-merged"
          className="animate-rise space-y-6"
          role="tabpanel"
          aria-labelledby="rank-tab-merged"
        >
          <p className="max-w-2xl text-sm leading-relaxed text-ink/70">
            Choose which models from your completed run to include. Generating a
            new subset retrains those models and rebuilds the ensemble + GMM
            tiers — this can take one or two minutes. We do not merge the stored
            top-ten lists in the browser.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllMerge}
              disabled={loading}
              className="min-h-11 rounded-[var(--radius)] border border-line px-3 text-sm font-medium text-ink hover:border-leaf disabled:opacity-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearMerge}
              disabled={loading}
              className="min-h-11 rounded-[var(--radius)] border border-line px-3 text-sm font-medium text-ink hover:border-leaf disabled:opacity-50"
            >
              Clear
            </button>
            <span className="px-1 text-sm text-ink/55" aria-live="polite">
              {selectedSubset.length} selected
            </span>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {result.models_run.map((id) => {
              const m = result.per_model[id];
              return (
                <li key={id}>
                  <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-line bg-fog/50 px-3 py-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-5 accent-leaf-deep"
                      checked={!!mergeSelected[id]}
                      disabled={loading}
                      onChange={(e) =>
                        setMergeSelected((s) => ({
                          ...s,
                          [id]: e.target.checked,
                        }))
                      }
                      aria-label={`Include ${m?.name ?? id}`}
                    />
                    <span>
                      <span className="block font-medium text-ink">
                        {m?.name ?? id}
                      </span>
                      <span className="block text-xs text-ink/50">
                        {m
                          ? taskBadgeLabel(m.task)
                          : "Missing model detail"}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {!canMerge && (
            <p
              role="status"
              className="rounded-[var(--radius)] border border-clay/35 bg-clay/10 px-4 py-3 text-sm text-clay"
            >
              Select at least two models to build a merged ranking.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius)] border border-clay/35 bg-clay/10 px-4 py-3 text-sm text-clay"
            >
              {error}
            </p>
          )}

          {loading && (
            <div
              className="rounded-[var(--radius)] border border-leaf/30 bg-fog/70 px-4 py-4"
              aria-busy="true"
              aria-live="polite"
            >
              <p className="font-semibold text-ink">Retraining subset…</p>
              <p className="mt-1 text-sm text-ink/70">
                This usually takes one to two minutes. Keep this tab open.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={generateMerged}
            disabled={!canMerge || loading}
            aria-busy={loading}
            className="min-h-11 rounded-[var(--radius)] bg-leaf-deep px-5 text-sm font-semibold text-sand transition hover:bg-leaf disabled:opacity-50"
          >
            {loading ? "Working…" : "Generate merged ranking"}
          </button>

          {mergedResult && (
            <div className="border-t border-line pt-8">
              <ResultsOverview
                result={mergedResult}
                tableTitle="Merged rankings"
              />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
