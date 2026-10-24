/** Display helpers — do not change underlying values, only presentation. */

export function humanize(value: string | number | undefined | null): string {
  if (value == null || value === "") return "—";
  const s = String(value);
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function taskBadgeLabel(task: string): string {
  switch (task) {
    case "regression":
      return "Score prediction";
    case "binary":
      return "Yes / no";
    case "multiclass":
      return "Category match";
    default:
      return humanize(task);
  }
}

export const MODEL_DESCRIPTIONS: Record<string, string> = {
  interest_rating: "Estimates how interested a student would be in an event.",
  high_interest: "Flags whether a student is likely to engage with an event.",
  event_type: "Suggests which event format fits the student best.",
  preferred_time: "Finds when a student is most likely to show up.",
  neighborhood: "Points toward neighborhoods that fit their preferences.",
  cost_band: "Reflects how sensitive they are to ticket price.",
  cross_campus: "Checks openness to events beyond their own campus.",
  civic_affinity: "Measures fit with community and civic-minded events.",
};

export function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "We couldn’t reach the ranking service. Check your connection and try again.";
  }
  if (lower.includes("api unavailable") || lower.includes("8000") || lower.includes("upstream")) {
    return "The ranking service isn’t available right now. Make sure it’s running, then try again.";
  }
  if (lower.includes("select at least one")) {
    return "Select at least one model before generating rankings.";
  }
  if (lower.includes("timeout") || lower.includes("aborted")) {
    return "This run took too long and timed out. Try fewer models, or try again.";
  }
  // Strip overly technical FastAPI dumps while keeping a usable message
  if (raw.length > 220) {
    return "Something went wrong while training. Please try again in a moment.";
  }
  return raw;
}

export function metricLabel(key: string): string {
  const map: Record<string, string> = {
    mae: "Average error (MAE)",
    rmse: "Error spread (RMSE)",
    r2: "Fit quality (R²)",
    accuracy: "Accuracy",
    f1: "Balance score (F1)",
    f1_macro: "Balance score (F1)",
  };
  return map[key] ?? humanize(key);
}

export function metricHint(key: string): string | null {
  const map: Record<string, string> = {
    mae: "Lower is better — average distance from the true rating.",
    rmse: "Lower is better — penalizes larger misses more.",
    r2: "Closer to 1 is better — how much of the rating we explain.",
    accuracy: "Share of labels predicted correctly.",
    f1: "Balances precision and recall for yes/no calls.",
    f1_macro: "Balances precision and recall across categories.",
  };
  return map[key] ?? null;
}

export function tierTone(tierRank: number | undefined): "a" | "b" | "c" | "none" {
  if (tierRank === 1) return "a";
  if (tierRank === 2) return "b";
  if (tierRank === 3) return "c";
  return "none";
}
