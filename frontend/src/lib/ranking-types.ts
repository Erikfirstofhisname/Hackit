export type ModelInfo = {
  id: string;
  name: string;
  task: string;
  learner: string;
  default_prompt: string;
};

export type RankRow = {
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

export type TierSummary = {
  tier: string;
  tier_rank: number;
  count: number;
  mean_ensemble_score: number;
};

export type PerModel = {
  id: string;
  name: string;
  task: string;
  learner: string;
  prompt: string;
  metrics: Record<string, number>;
  top10: RankRow[];
};

export type RunResult = {
  n_rows: number;
  n_folds: number;
  models_run: string[];
  tier_summary: TierSummary[];
  top10: RankRow[];
  per_model: Record<string, PerModel>;
};

export type StoredRankingSession = {
  result: RunResult;
  modelIds: string[];
  prompts: Record<string, string>;
  savedAt: number;
};
