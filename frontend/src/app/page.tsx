"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LokaWordmark } from "@/components/LokaWordmark";
import { OptionDialog } from "@/components/OptionDialog";
import type { ModelInfo, RunResult } from "@/lib/ranking-types";
import { parseApiError, saveRankingSession } from "@/lib/ranking-session";
import {
  MODEL_DESCRIPTIONS,
  friendlyError,
  taskBadgeLabel,
} from "@/lib/format";
import { MODEL_OPTIONS, optionLabel } from "@/lib/model-options";

export default function Home() {
  const router = useRouter();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [openPopup, setOpenPopup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setModelsLoading(true);
    fetch("/api/models")
      .then((r) => {
        if (!r.ok) throw new Error("API unavailable — start the FastAPI backend.");
        return r.json();
      })
      .then((data: { models: ModelInfo[] }) => {
        setModels(data.models);
        const p: Record<string, string> = {};
        const s: Record<string, boolean> = {};
        data.models.forEach((m) => {
          const first = MODEL_OPTIONS[m.id]?.[0];
          p[m.id] = first?.value ?? m.default_prompt;
          s[m.id] = true;
        });
        setPrompts(p);
        setSelected(s);
      })
      .catch((e: Error) => setError(friendlyError(e.message)))
      .finally(() => setModelsLoading(false));
  }, []);

  const popupModel = models.find((m) => m.id === openPopup) ?? null;
  const popupOpts = openPopup ? MODEL_OPTIONS[openPopup] ?? [] : [];
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    models.forEach((m) => {
      next[m.id] = true;
    });
    setSelected(next);
  };

  const clearAll = () => {
    const next: Record<string, boolean> = {};
    models.forEach((m) => {
      next[m.id] = false;
    });
    setSelected(next);
  };

  const openDialog = (id: string) => {
    returnFocusRef.current = triggerRefs.current[id] ?? null;
    setOpenPopup(id);
  };

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOpenPopup(null);
    try {
      const model_ids = Object.entries(selected)
        .filter(([, on]) => on)
        .map(([id]) => id);
      if (!model_ids.length) throw new Error("Select at least one model.");

      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_ids, prompts, top_n: 100, n_tiers: 3 }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res));
      }
      const data: RunResult = await res.json();
      saveRankingSession(data, model_ids, prompts);
      router.push("/results");
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Run failed"));
    } finally {
      setLoading(false);
    }
  }, [prompts, selected, router]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-8 sm:pt-10">
      <header className="animate-rise mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-leaf uppercase">
          Boston · creative · civic
        </p>
        <h1 className="text-6xl leading-none sm:text-7xl">
          <LokaWordmark />
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/75 sm:text-lg">
          Loka helps you discover which student–event pairings fit best. Choose
          prediction models, set preferences, and generate clear ranked
          recommendations.
        </p>
      </header>

      <ol className="animate-rise mb-10 grid gap-3 sm:grid-cols-3">
        {[
          { n: "1", t: "Choose models", d: "Pick which predictions to include." },
          { n: "2", t: "Set preferences", d: "Open each card and choose an option." },
          { n: "3", t: "Generate rankings", d: "Train, score, and review tiers." },
        ].map((s) => (
          <li
            key={s.n}
            className="rounded-[var(--radius)] border border-line bg-fog/50 px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf">
              Step {s.n}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-ink">
              {s.t}
            </p>
            <p className="mt-1 text-sm text-ink/65">{s.d}</p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="models-heading" className="mb-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="models-heading"
              className="font-[family-name:var(--font-display)] text-2xl text-ink"
            >
              Models
            </h2>
            <p className="mt-1 text-sm text-ink/60" aria-live="polite">
              {modelsLoading
                ? "Loading models…"
                : `${selectedCount} of ${models.length} selected`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={loading || modelsLoading || !models.length}
              className="min-h-11 rounded-[var(--radius)] border border-line px-3 text-sm font-medium text-ink hover:border-leaf disabled:opacity-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={loading || modelsLoading || !models.length}
              className="min-h-11 rounded-[var(--radius)] border border-line px-3 text-sm font-medium text-ink hover:border-leaf disabled:opacity-50"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={run}
              disabled={loading || modelsLoading || !models.length || selectedCount === 0}
              className="min-h-11 rounded-[var(--radius)] bg-leaf-deep px-5 text-sm font-semibold text-sand shadow-[var(--shadow-soft)] transition hover:bg-leaf disabled:opacity-50"
            >
              {loading ? "Working…" : "Train, test & rank"}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-[var(--radius)] border border-clay/35 bg-clay/10 px-4 py-3 text-sm text-clay"
          >
            {error}
          </p>
        )}

        {loading && (
          <div
            className="mb-5 rounded-[var(--radius)] border border-leaf/30 bg-fog/70 px-4 py-4"
            aria-busy="true"
            aria-live="polite"
          >
            <p className="font-semibold text-ink">Training & ranking in progress</p>
            <p className="mt-1 text-sm text-ink/70">
              Loka is evaluating your selected models. This usually takes one to
              two minutes. Please keep this tab open.
            </p>
            <p className="animate-pulse-soft mt-3 text-sm text-leaf-deep">
              Working…
            </p>
          </div>
        )}

        {modelsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-40 border border-line" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {models.map((m) => {
              const included = !!selected[m.id];
              return (
                <article
                  key={m.id}
                  className={`rounded-[var(--radius)] border p-4 transition ${
                    included
                      ? "border-leaf-deep/50 bg-fog/80 shadow-[var(--shadow-soft)]"
                      : "border-line bg-sand/70 opacity-90"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-[family-name:var(--font-display)] text-lg text-ink">
                          {m.name}
                        </h3>
                        <span className="rounded-full border border-line bg-sand px-2 py-0.5 text-xs text-ink/70">
                          {taskBadgeLabel(m.task)}
                        </span>
                        <span className="sr-only">
                          {included ? "Selected" : "Not selected"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink/65">
                        {MODEL_DESCRIPTIONS[m.id] ??
                          "Predicts a useful fit signal for event discovery."}
                      </p>
                    </div>
                    <label className="flex min-h-11 min-w-11 cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium text-ink/70">
                      <input
                        type="checkbox"
                        checked={included}
                        disabled={loading}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [m.id]: e.target.checked,
                          }))
                        }
                        className="size-5 accent-leaf-deep"
                        aria-label={`Use ${m.name}`}
                      />
                      Use
                    </label>
                  </div>

                  <button
                    type="button"
                    ref={(el) => {
                      triggerRefs.current[m.id] = el;
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={openPopup === m.id}
                    disabled={loading}
                    onClick={() => openDialog(m.id)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius)] border border-line bg-sand px-3 py-3 text-left text-ink transition hover:border-leaf/60 disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs uppercase tracking-wide text-ink/45">
                        Selected option
                      </span>
                      <span className="mt-0.5 block text-base leading-snug">
                        {optionLabel(m.id, prompts[m.id] ?? "")}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-leaf-deep">
                      Choose
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {popupModel && (
        <OptionDialog
          model={popupModel}
          options={popupOpts}
          value={prompts[popupModel.id] ?? ""}
          returnFocusRef={returnFocusRef}
          onClose={() => setOpenPopup(null)}
          onSelect={(value) => {
            setPrompts((p) => ({ ...p, [popupModel.id]: value }));
            setSelected((s) => ({ ...s, [popupModel.id]: true }));
            setOpenPopup(null);
          }}
        />
      )}
    </main>
  );
}
