"use client";

import { useCallback, useEffect, useState } from "react";

type ModelInfo = {
  id: string;
  name: string;
  task: string;
  learner: string;
  default_prompt: string;
};

type RankRow = {
  rank: number;
  record_id: string;
  campus_group: string;
  primary_interest: string;
  event_type: string;
  event_neighborhood: string;
  is_free: number;
  simulated_interest_rating_1_to_10: number;
  ensemble_score?: number;
  tier?: string;
  tier_rank?: number;
  [key: string]: string | number | undefined;
};

type TierSummary = {
  tier: string;
  tier_rank: number;
  count: number;
  mean_ensemble_score: number;
};

type PerModel = {
  id: string;
  name: string;
  task: string;
  learner: string;
  prompt: string;
  metrics: Record<string, number>;
  top10: RankRow[];
};

type RunResult = {
  n_rows: number;
  n_folds: number;
  models_run: string[];
  tier_summary: TierSummary[];
  top10: RankRow[];
  per_model: Record<string, PerModel>;
};

/** Popup choices per model (no free typing). */
const MODEL_OPTIONS: Record<string, { label: string; value: string }[]> = {
  interest_rating: [
    { label: "Any interest level", value: "Predict interest rating 1–10 (any level)." },
    { label: "Prioritize high (7+)", value: "Prioritize students/events with high interest (7+)." },
    { label: "Prioritize mid (4–6)", value: "Focus on mid-range interest fits (4–6)." },
    { label: "Surface low (<4)", value: "Flag low-interest mismatches (below 4)." },
  ],
  high_interest: [
    { label: "Engage if rating ≥ 6", value: "Binary: engage when predicted rating ≥ 6." },
    { label: "Stricter (≥ 7)", value: "Binary: engage when predicted rating ≥ 7." },
    { label: "Looser (≥ 5)", value: "Binary: engage when predicted rating ≥ 5." },
  ],
  event_type: [
    { label: "Any event type", value: "Predict best-fit event type (all classes)." },
    { label: "Creative workshop", value: "Prefer creative_workshop." },
    { label: "Art showcase", value: "Prefer art_showcase." },
    { label: "Community service", value: "Prefer community_service." },
    { label: "Networking", value: "Prefer networking." },
    { label: "Coworking", value: "Prefer coworking." },
    { label: "Local market", value: "Prefer local_market." },
  ],
  preferred_time: [
    { label: "Any time slot", value: "Predict preferred time (all slots)." },
    { label: "Weekend afternoon", value: "Prefer weekend_afternoon." },
    { label: "Weekend evening", value: "Prefer weekend_evening." },
    { label: "Weekend morning", value: "Prefer weekend_morning." },
    { label: "Weekday afternoon", value: "Prefer weekday_afternoon." },
    { label: "Weekday evening", value: "Prefer weekday_evening." },
  ],
  neighborhood: [
    { label: "Any neighborhood", value: "Predict neighborhood preference (all areas)." },
    { label: "Back Bay", value: "Prefer Back Bay." },
    { label: "Downtown", value: "Prefer Downtown." },
    { label: "Fenway", value: "Prefer Fenway." },
    { label: "Cambridge", value: "Prefer Cambridge." },
    { label: "Roxbury", value: "Prefer Roxbury." },
    { label: "Dorchester", value: "Prefer Dorchester." },
    { label: "Jamaica Plain", value: "Prefer Jamaica Plain." },
  ],
  cost_band: [
    { label: "Any cost band", value: "Predict cost-band tolerance (free/low/mid/high)." },
    { label: "Free only", value: "Prefer free events." },
    { label: "Low (≤ $10)", value: "Prefer low cost band." },
    { label: "Mid ($11–20)", value: "Prefer mid cost band." },
    { label: "High ($20+)", value: "Prefer high cost band." },
  ],
  cross_campus: [
    { label: "Either", value: "Predict cross-campus affinity (yes/no)." },
    { label: "Prefer cross-campus", value: "Prefer cross-campus events." },
    { label: "Same-campus only", value: "Prefer same-campus events." },
  ],
  civic_affinity: [
    { label: "Any civic fit", value: "Predict civic / community-service affinity." },
    { label: "Strong civic fit", value: "Prioritize strong civic_fit scores." },
    { label: "Community service focus", value: "Prioritize community_service civic match." },
    { label: "Moderate only", value: "Focus on moderate civic affinity." },
  ],
};

function optionLabel(modelId: string, promptValue: string): string {
  const opts = MODEL_OPTIONS[modelId] ?? [];
  return opts.find((o) => o.value === promptValue)?.label ?? "Choose option";
}

export default function Home() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [openPopup, setOpenPopup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showPerModel, setShowPerModel] = useState(false);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  useEffect(() => {
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
        if (data.models[0]) setActiveModel(data.models[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!openPopup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPopup(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [openPopup]);

  const popupModel = models.find((m) => m.id === openPopup) ?? null;
  const popupOpts = openPopup ? MODEL_OPTIONS[openPopup] ?? [] : [];

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
        body: JSON.stringify({ model_ids, prompts, top_n: 10, n_tiers: 3 }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = text || `Run failed (${res.status})`;
        try {
          const j = JSON.parse(text) as { detail?: string; error?: string; hint?: string };
          msg = j.detail || j.error || msg;
          if (j.hint) msg = `${msg} — ${j.hint}`;
        } catch {
          /* plain text */
        }
        throw new Error(msg);
      }
      const data: RunResult = await res.json();
      setResult(data);
      setShowPerModel(false);
      if (data.models_run[0]) setActiveModel(data.models_run[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }, [prompts, selected]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
      <header className="animate-rise mb-14 max-w-2xl">
        <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-leaf uppercase">
          Boston · creative · civic
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-6xl leading-[0.95] tracking-tight text-ink sm:text-7xl">
          Loka
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/75">
          Eight model boxes — open each popup to pick an option, then train and
          rank with GMM tiers.
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
            Models
          </h2>
          <button
            type="button"
            onClick={run}
            disabled={loading || !models.length}
            className="rounded-md bg-leaf-deep px-5 py-2.5 text-sm font-semibold text-sand transition hover:bg-leaf disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse-soft">
                Training & ranking… (can take up to ~1 min)
              </span>
            ) : (
              "Train, test & rank"
            )}
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-md border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {models.map((m, i) => {
            const included = !!selected[m.id];
            return (
              <div
                key={m.id}
                className="animate-rise border border-line bg-fog/60 p-4"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-lg text-ink">
                      {m.name}
                    </p>
                    <p className="text-xs text-ink/50">
                      {m.task} · {m.learner}
                    </p>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-ink/60">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={(e) =>
                        setSelected((s) => ({ ...s, [m.id]: e.target.checked }))
                      }
                      className="size-4 accent-leaf"
                    />
                    Use
                  </label>
                </div>

                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setOpenPopup(m.id)}
                  className="flex w-full items-center justify-between gap-3 border border-line bg-sand/90 px-3 py-3 text-left text-ink transition hover:border-leaf/50"
                >
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wide text-ink/45">
                      Selected option
                    </span>
                    <span className="mt-0.5 block text-base leading-snug">
                      {optionLabel(m.id, prompts[m.id] ?? "")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-leaf">
                    Choose ▾
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {popupModel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpenPopup(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="loka-option-title"
            className="animate-rise flex max-h-[85vh] w-full max-w-lg flex-col border border-line bg-sand shadow-[0_24px_80px_rgba(20,33,43,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-line px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">
                Choose option
              </p>
              <h3
                id="loka-option-title"
                className="mt-1 font-[family-name:var(--font-display)] text-2xl text-ink"
              >
                {popupModel.name}
              </h3>
              <p className="mt-1 text-sm text-ink/55">
                {popupModel.task} · {popupModel.learner}
              </p>
            </div>

            <ul className="flex-1 overflow-y-auto px-2 py-2" role="listbox">
              {popupOpts.map((o) => {
                const active = prompts[popupModel.id] === o.value;
                return (
                  <li key={o.value} className="px-2 py-1">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setPrompts((p) => ({
                          ...p,
                          [popupModel.id]: o.value,
                        }));
                        setSelected((s) => ({ ...s, [popupModel.id]: true }));
                        setOpenPopup(null);
                      }}
                      className={`w-full rounded-sm border px-4 py-3.5 text-left transition ${
                        active
                          ? "border-leaf bg-fog"
                          : "border-transparent hover:border-line hover:bg-fog/70"
                      }`}
                    >
                      <span className="block text-base font-medium leading-snug text-ink">
                        {o.label}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink/60">
                        {o.value}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setOpenPopup(null)}
                className="text-sm font-medium text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <section className="animate-rise space-y-10 border-t border-line pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
                Results
              </h2>
              <p className="text-sm text-ink/60">
                {result.n_rows} rows · {result.n_folds}-fold CV ·{" "}
                {result.models_run.length} models · GMM tiers
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPerModel((v) => !v)}
              className="border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:border-leaf hover:text-leaf"
            >
              {showPerModel
                ? "Show overall top 10"
                : "See individual model rankings"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {result.tier_summary.map((t) => (
              <div
                key={t.tier}
                className="border border-line bg-fog/50 px-4 py-3"
              >
                <p className="font-[family-name:var(--font-display)] text-lg">
                  {t.tier}
                </p>
                <p className="text-sm text-ink/60">
                  {t.count} events · mean score{" "}
                  {t.mean_ensemble_score.toFixed(3)}
                </p>
              </div>
            ))}
          </div>

          {!showPerModel ? (
            <RankTable
              title="Top 10 — ensemble + GMM tier"
              rows={result.top10}
              showTier
            />
          ) : (
            <div className="space-y-6">
              <div className="max-w-sm">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  Model rankings
                </label>
                <select
                  value={activeModel ?? ""}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="w-full border border-line bg-sand px-3 py-2 text-sm text-ink outline-none focus:border-leaf"
                >
                  {result.models_run.map((id) => (
                    <option key={id} value={id}>
                      {result.per_model[id]?.name ?? id}
                    </option>
                  ))}
                </select>
              </div>
              {activeModel && result.per_model[activeModel] && (
                <>
                  <MetricsBlock model={result.per_model[activeModel]} />
                  <RankTable
                    title={`Top 10 — ${result.per_model[activeModel].name}`}
                    rows={result.per_model[activeModel].top10}
                    scoreKey={`score_${activeModel}`}
                  />
                </>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function MetricsBlock({ model }: { model: PerModel }) {
  return (
    <p className="text-sm text-ink/70">
      <span className="font-semibold text-ink">{model.name}</span>
      {" · "}
      {Object.entries(model.metrics)
        .map(([k, v]) => `${k} ${v.toFixed(3)}`)
        .join(" · ")}
    </p>
  );
}

function RankTable({
  title,
  rows,
  showTier,
  scoreKey,
}: {
  title: string;
  rows: RankRow[];
  showTier?: boolean;
  scoreKey?: string;
}) {
  return (
    <div>
      <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl">
        {title}
      </h3>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-leaf-deep text-sand">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Campus</th>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Free</th>
              {showTier && <th className="px-3 py-2 font-medium">Tier</th>}
              <th className="px-3 py-2 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const score =
                showTier && r.ensemble_score != null
                  ? Number(r.ensemble_score)
                  : scoreKey && r[scoreKey] != null
                    ? Number(r[scoreKey])
                    : null;
              return (
                <tr key={`${r.rank}-${r.record_id}`} className="odd:bg-fog/40">
                  <td className="px-3 py-2">{r.rank}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.record_id}</td>
                  <td className="px-3 py-2">{r.campus_group}</td>
                  <td className="px-3 py-2">
                    {r.event_type}
                    <span className="block text-xs text-ink/45">
                      {r.event_neighborhood}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.is_free ? "yes" : "no"}</td>
                  {showTier && (
                    <td className="px-3 py-2 text-xs">{r.tier}</td>
                  )}
                  <td className="px-3 py-2 tabular-nums">
                    {score != null ? score.toFixed(3) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
