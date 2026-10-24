import type { RunResult, StoredRankingSession } from "./ranking-types";

const STORAGE_KEY = "loka.ranking.session.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function isRunResult(value: unknown): value is RunResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.n_rows === "number" &&
    typeof v.n_folds === "number" &&
    Array.isArray(v.models_run) &&
    Array.isArray(v.tier_summary) &&
    Array.isArray(v.top10) &&
    typeof v.per_model === "object" &&
    v.per_model !== null
  );
}

function isStoredSession(value: unknown): value is StoredRankingSession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    isRunResult(v.result) &&
    Array.isArray(v.modelIds) &&
    typeof v.prompts === "object" &&
    v.prompts !== null &&
    typeof v.savedAt === "number"
  );
}

export function saveRankingSession(
  result: RunResult,
  modelIds: string[],
  prompts: Record<string, string>
): void {
  if (!isBrowser()) return;
  const payload: StoredRankingSession = {
    result,
    modelIds: [...modelIds],
    prompts: { ...prompts },
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadRankingSession(): StoredRankingSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredSession(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRankingSession(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** True when two model-id lists contain the same set (order-independent). */
export function sameModelSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((id, i) => id === sb[i]);
}

export async function parseApiError(res: Response): Promise<string> {
  const text = await res.text();
  let msg = text || `Request failed (${res.status})`;
  try {
    const j = JSON.parse(text) as {
      detail?: string;
      error?: string;
      hint?: string;
    };
    msg = j.detail || j.error || msg;
    if (j.hint) msg = `${msg} — ${j.hint}`;
  } catch {
    /* plain text */
  }
  return msg;
}
