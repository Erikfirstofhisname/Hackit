"""Train/test prediction models + GMM tier ranking for Loka."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.linear_model import Lasso, LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.mixture import GaussianMixture
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "boston_student_creative_events_features.csv"

RANDOM_STATE = 42
N_SPLITS = 3  # faster for the API (still proper CV)
TOP_N = 10
N_TIERS = 3
TIER_NAMES = ["Tier A — High fit", "Tier B — Mid fit", "Tier C — Lower fit"]

CATEGORICAL = [
    "campus_group",
    "primary_interest",
    "event_type",
    "event_neighborhood",
    "preferred_time",
    "cost_band",
]
NUMERIC = [
    "travel_time_minutes",
    "event_cost_usd",
    "interest_match_score_1_to_5",
    "social_comfort_1_to_5",
    "community_impact_importance_1_to_5",
    "cross_campus_event",
    "apps_currently_used_for_discovery",
    "is_free",
    "log1p_cost",
    "is_cross_campus",
    "civic_fit",
    "cross_campus_x_impact",
    "community_engagement_index",
]

# Catalog of the 8 prediction targets (prompt boxes on the frontend)
MODEL_CATALOG: list[dict[str, Any]] = [
    {
        "id": "interest_rating",
        "name": "Interest rating",
        "task": "regression",
        "default_prompt": "Predict how interested a student will be in this event (1–10).",
        "learner": "lasso",
    },
    {
        "id": "high_interest",
        "name": "High-interest engage",
        "task": "binary",
        "default_prompt": "Will this student engage (rating ≥ 6)?",
        "learner": "logistic",
    },
    {
        "id": "event_type",
        "name": "Event type fit",
        "task": "multiclass",
        "default_prompt": "Which event type best fits this student?",
        "learner": "hgb_clf",
    },
    {
        "id": "preferred_time",
        "name": "Preferred time",
        "task": "multiclass",
        "default_prompt": "When is this student most likely to show up?",
        "learner": "hgb_clf",
    },
    {
        "id": "neighborhood",
        "name": "Neighborhood",
        "task": "multiclass",
        "default_prompt": "Which neighborhood will they prefer?",
        "learner": "hgb_clf",
    },
    {
        "id": "cost_band",
        "name": "Cost band tolerance",
        "task": "multiclass",
        "default_prompt": "What cost band will they accept (free/low/mid/high)?",
        "learner": "hgb_clf",
    },
    {
        "id": "cross_campus",
        "name": "Cross-campus affinity",
        "task": "binary",
        "default_prompt": "Will they cross campus silos for this event?",
        "learner": "logistic",
    },
    {
        "id": "civic_affinity",
        "name": "Civic affinity",
        "task": "regression",
        "default_prompt": "How strong is civic / community-service fit?",
        "learner": "ridge",
    },
]


def _preprocessor(*, scale_numeric: bool) -> ColumnTransformer:
    return ColumnTransformer(
        [
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL,
            ),
            ("num", StandardScaler() if scale_numeric else "passthrough", NUMERIC),
        ]
    )


def _feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    return df[CATEGORICAL + NUMERIC].copy()


def _features_for_target(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
    """Drop leakage columns that equal or define the target."""
    X = _feature_frame(df)
    leak = {
        "event_type": ["event_type"],
        "preferred_time": ["preferred_time"],
        "event_neighborhood": ["event_neighborhood"],
        "cost_band": ["cost_band", "event_cost_usd", "is_free", "log1p_cost"],
        "cross_campus_event": ["cross_campus_event", "is_cross_campus", "cross_campus_x_impact"],
        "civic_fit": ["civic_fit"],
    }
    drop = leak.get(target_col, [])
    return X.drop(columns=[c for c in drop if c in X.columns], errors="ignore")


def _make_pipe(learner: str, task: str) -> Pipeline:
    if learner == "lasso":
        return Pipeline(
            [
                ("prep", _preprocessor(scale_numeric=True)),
                ("model", Lasso(alpha=0.05, max_iter=20000, random_state=RANDOM_STATE)),
            ]
        )
    if learner == "ridge":
        return Pipeline(
            [
                ("prep", _preprocessor(scale_numeric=True)),
                ("model", Ridge(alpha=1.0)),
            ]
        )
    if learner == "logistic":
        return Pipeline(
            [
                ("prep", _preprocessor(scale_numeric=True)),
                (
                    "model",
                    LogisticRegression(
                        max_iter=5000, random_state=RANDOM_STATE, solver="lbfgs"
                    ),
                ),
            ]
        )
    if learner == "hgb_clf":
        return Pipeline(
            [
                ("prep", _preprocessor(scale_numeric=False)),
                (
                    "model",
                    HistGradientBoostingClassifier(
                        random_state=RANDOM_STATE,
                        max_depth=4,
                        max_iter=80,
                        learning_rate=0.1,
                    ),
                ),
            ]
        )
    # default regressor
    return Pipeline(
        [
            ("prep", _preprocessor(scale_numeric=False)),
            (
                "model",
                HistGradientBoostingRegressor(
                    random_state=RANDOM_STATE, max_depth=4, max_iter=80
                ),
            ),
        ]
    )


def _target_series(df: pd.DataFrame, model_id: str) -> tuple[pd.Series, str]:
    if model_id == "interest_rating":
        return df["simulated_interest_rating_1_to_10"], "simulated_interest_rating_1_to_10"
    if model_id == "high_interest":
        return (df["simulated_interest_rating_1_to_10"] >= 6).astype(int), "high_interest"
    if model_id == "event_type":
        return df["event_type"], "event_type"
    if model_id == "preferred_time":
        return df["preferred_time"], "preferred_time"
    if model_id == "neighborhood":
        return df["event_neighborhood"], "event_neighborhood"
    if model_id == "cost_band":
        return df["cost_band"], "cost_band"
    if model_id == "cross_campus":
        return df["cross_campus_event"].astype(int), "cross_campus_event"
    if model_id == "civic_affinity":
        return df["civic_fit"].astype(float), "civic_fit"
    raise KeyError(model_id)


def _json_safe(obj: Any) -> Any:
    """Convert numpy / pandas scalars so FastAPI can JSON-encode the payload."""
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return _json_safe(obj.tolist())
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        val = float(obj)
        return None if np.isnan(val) else val
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if obj is None:
        return None
    try:
        if pd.isna(obj):
            return None
    except (TypeError, ValueError):
        pass
    return obj


def _score_vector(
    task: str, y_true: np.ndarray, pred: np.ndarray, proba: np.ndarray | None
) -> np.ndarray:
    """Per-row ranking score in [0, 1]-ish space for GMM / top-10."""
    if task == "regression":
        # higher predicted value = better fit for ranking
        p = pred.astype(float)
        lo, hi = np.nanmin(p), np.nanmax(p)
        if hi - lo < 1e-9:
            return np.zeros_like(p)
        return (p - lo) / (hi - lo)
    if task == "binary":
        if proba is not None:
            return proba[:, 1] if proba.ndim == 2 else proba
        return pred.astype(float)
    # multiclass: probability of true class when available, else correct=1
    if proba is not None and proba.ndim == 2:
        # use max class probability as confidence × correctness soft score
        return proba.max(axis=1)
    return (pred == y_true).astype(float)


def run_pipeline(
    selected_ids: list[str],
    prompts: dict[str, str] | None = None,
    n_tiers: int = N_TIERS,
    top_n: int = TOP_N,
) -> dict[str, Any]:
    prompts = prompts or {}
    df = pd.read_csv(DATA)
    catalog = {m["id"]: m for m in MODEL_CATALOG}
    ids = [i for i in selected_ids if i in catalog]
    if not ids:
        ids = [m["id"] for m in MODEL_CATALOG]

    cv = KFold(n_splits=N_SPLITS, shuffle=True, random_state=RANDOM_STATE)
    per_model: dict[str, Any] = {}
    score_cols: list[str] = []

    for mid in ids:
        meta = catalog[mid]
        y, y_col = _target_series(df, mid)
        X = _features_for_target(df, y_col)
        # Align categoricals present in X
        cat = [c for c in CATEGORICAL if c in X.columns]
        num = [c for c in NUMERIC if c in X.columns]

        pipe = _make_pipe(meta["learner"], meta["task"])
        # rebuild prep for possibly reduced columns
        scale = meta["learner"] in {"lasso", "ridge", "logistic"}
        pipe = Pipeline(
            [
                (
                    "prep",
                    ColumnTransformer(
                        [
                            (
                                "cat",
                                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                                cat,
                            ),
                            (
                                "num",
                                StandardScaler() if scale else "passthrough",
                                num,
                            ),
                        ]
                    ),
                ),
                ("model", pipe.named_steps["model"]),
            ]
        )

        metrics: dict[str, float] = {}
        proba = None
        le = None

        if meta["task"] == "regression":
            pred = cross_val_predict(pipe, X, y, cv=cv, n_jobs=1)
            metrics = {
                "mae": float(mean_absolute_error(y, pred)),
                "rmse": float(np.sqrt(mean_squared_error(y, pred))),
                "r2": float(r2_score(y, pred)),
            }
            scores = _score_vector("regression", y.to_numpy(), pred, None)
        elif meta["task"] == "binary":
            # one CV pass — derive labels from probabilities
            proba = cross_val_predict(
                pipe, X, y, cv=cv, method="predict_proba", n_jobs=1
            )
            pred = (proba[:, 1] >= 0.5).astype(int)
            metrics = {
                "accuracy": float(accuracy_score(y, pred)),
                "f1": float(f1_score(y, pred, zero_division=0)),
            }
            scores = _score_vector("binary", y.to_numpy(), pred, proba)
        else:
            le = LabelEncoder()
            y_enc = le.fit_transform(y)
            proba = cross_val_predict(
                pipe, X, y_enc, cv=cv, method="predict_proba", n_jobs=1
            )
            pred_enc = np.argmax(proba, axis=1)
            pred = le.inverse_transform(pred_enc)
            metrics = {
                "accuracy": float(accuracy_score(y_enc, pred_enc)),
                "f1_macro": float(
                    f1_score(y_enc, pred_enc, average="macro", zero_division=0)
                ),
            }
            scores = _score_vector("multiclass", y_enc, pred_enc, proba)

        score_name = f"score_{mid}"
        df[score_name] = scores
        score_cols.append(score_name)

        # per-model top 10 by ranking score
        rank_df = df[
            [
                "record_id",
                "campus_group",
                "primary_interest",
                "event_type",
                "event_neighborhood",
                "is_free",
                "simulated_interest_rating_1_to_10",
                score_name,
            ]
        ].copy()
        rank_df = rank_df.sort_values(score_name, ascending=False).head(top_n)
        rank_df.insert(0, "rank", range(1, len(rank_df) + 1))

        per_model[mid] = {
            "id": mid,
            "name": meta["name"],
            "task": meta["task"],
            "learner": meta["learner"],
            "prompt": prompts.get(mid) or meta["default_prompt"],
            "metrics": metrics,
            "top10": _json_safe(rank_df.to_dict(orient="records")),
        }

    # Ensemble score = mean of available model scores
    df["ensemble_score"] = df[score_cols].mean(axis=1)

    # GMM tiers on ensemble (+ individual scores if enough dims)
    gmm_features = df[score_cols].to_numpy()
    if gmm_features.shape[1] == 1:
        gmm_features = np.column_stack([gmm_features, df["ensemble_score"]])
    gmm_features = np.nan_to_num(gmm_features, nan=0.0)

    n_components = min(n_tiers, max(2, len(df) // 20))
    gmm = GaussianMixture(
        n_components=n_components, random_state=RANDOM_STATE, covariance_type="full"
    )
    labels = gmm.fit_predict(gmm_features)
    # Order clusters by mean ensemble score (high → Tier A)
    cluster_means = {
        k: float(df.loc[labels == k, "ensemble_score"].mean()) for k in range(n_components)
    }
    order = sorted(cluster_means, key=cluster_means.get, reverse=True)
    tier_map = {cluster: TIER_NAMES[i] if i < len(TIER_NAMES) else f"Tier {i+1}" for i, cluster in enumerate(order)}
    df["tier"] = [tier_map[int(c)] for c in labels]
    df["tier_rank"] = [order.index(int(c)) + 1 for c in labels]

    overall = (
        df.sort_values(["tier_rank", "ensemble_score"], ascending=[True, False])
        .head(top_n)[
            [
                "record_id",
                "campus_group",
                "primary_interest",
                "event_type",
                "event_neighborhood",
                "is_free",
                "simulated_interest_rating_1_to_10",
                "ensemble_score",
                "tier",
                "tier_rank",
            ]
        ]
        .copy()
    )
    overall.insert(0, "rank", range(1, len(overall) + 1))

    tier_summary = []
    for i, cluster in enumerate(order):
        mask = labels == cluster
        tier_summary.append(
            {
                "tier": tier_map[cluster],
                "tier_rank": i + 1,
                "count": int(mask.sum()),
                "mean_ensemble_score": float(df.loc[mask, "ensemble_score"].mean()),
            }
        )

    return _json_safe(
        {
            "n_rows": int(len(df)),
            "n_folds": N_SPLITS,
            "models_run": ids,
            "prompts": {mid: per_model[mid]["prompt"] for mid in ids},
            "tier_summary": tier_summary,
            "top10": overall.to_dict(orient="records"),
            "per_model": per_model,
        }
    )
