"""Train interest-rating models with 5-fold out-of-fold predictions.

Every row gets a held-out prediction (OOF), so evaluation uses all 500 samples
instead of a single small test split. Final models are refit on all data for
ranking demos.
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import Lasso, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "boston_student_creative_events_features.csv"
MODELS_DIR = ROOT / "models"
PRED_PATH = ROOT / "predictions_interest_oof.csv"
METRICS_PATH = ROOT / "model_metrics_interest.csv"

TARGET = "simulated_interest_rating_1_to_10"
DROP_COLS = ["record_id", "data_origin", TARGET]

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

N_SPLITS = 5
RANDOM_STATE = 42


def load_xy() -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    df = pd.read_csv(DATA)
    meta_id = df["record_id"]
    y = df[TARGET]
    X = df.drop(columns=DROP_COLS)
    # Keep only modeled columns (order stable)
    X = X[CATEGORICAL + NUMERIC]
    return X, y, meta_id


def make_preprocessor(*, scale_numeric: bool) -> ColumnTransformer:
    num_steps = StandardScaler() if scale_numeric else "passthrough"
    return ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL,
            ),
            ("num", num_steps, NUMERIC),
        ]
    )


def make_models() -> dict[str, Pipeline]:
    return {
        "hist_gradient_boosting": Pipeline(
            [
                ("prep", make_preprocessor(scale_numeric=False)),
                (
                    "model",
                    HistGradientBoostingRegressor(random_state=RANDOM_STATE),
                ),
            ]
        ),
        "ridge": Pipeline(
            [
                ("prep", make_preprocessor(scale_numeric=True)),
                ("model", Ridge(alpha=1.0)),
            ]
        ),
        "lasso": Pipeline(
            [
                ("prep", make_preprocessor(scale_numeric=True)),
                ("model", Lasso(alpha=0.05, max_iter=10000, random_state=RANDOM_STATE)),
            ]
        ),
    }


def metrics_dict(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    return {
        "mae": mean_absolute_error(y_true, y_pred),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": r2_score(y_true, y_pred),
    }


def run_oof(
    models: dict[str, Pipeline], X: pd.DataFrame, y: pd.Series
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """5-fold OOF predictions for every row + fold metrics."""
    cv = KFold(n_splits=N_SPLITS, shuffle=True, random_state=RANDOM_STATE)
    oof = pd.DataFrame(index=X.index)
    rows = []

    for name, pipe in models.items():
        preds = cross_val_predict(pipe, X, y, cv=cv, n_jobs=1)
        oof[f"pred_{name}"] = preds
        m = metrics_dict(y.to_numpy(), preds)
        rows.append({"model": name, "cv": f"{N_SPLITS}-fold_oof", **m})
        print(
            f"{name:24s}  OOF MAE={m['mae']:.3f}  RMSE={m['rmse']:.3f}  R²={m['r2']:.3f}"
        )

    return oof, pd.DataFrame(rows)


def fit_and_save(models: dict[str, Pipeline], X: pd.DataFrame, y: pd.Series) -> None:
    MODELS_DIR.mkdir(exist_ok=True)
    for name, pipe in models.items():
        pipe.fit(X, y)
        path = MODELS_DIR / f"interest_{name}.joblib"
        joblib.dump(pipe, path)
        print(f"saved {path.name}")


def ranking_demo(pipe: Pipeline, df_raw: pd.DataFrame, student_idx: int = 0) -> None:
    """Score a diverse event slate for one student; print top-10."""
    student = df_raw.iloc[student_idx]
    student_cols = [
        "campus_group",
        "primary_interest",
        "social_comfort_1_to_5",
        "community_impact_importance_1_to_5",
        "apps_currently_used_for_discovery",
    ]

    slate = (
        df_raw.drop_duplicates(
            ["event_type", "event_neighborhood", "event_cost_usd", "cross_campus_event"]
        )
        .head(40)
        .copy()
    )
    for c in student_cols:
        slate[c] = student[c]

    X_slate = slate[CATEGORICAL + NUMERIC]
    slate = slate.copy()
    slate["predicted_interest"] = pipe.predict(X_slate)
    top = slate.sort_values("predicted_interest", ascending=False)[
        ["event_type", "event_neighborhood", "event_cost_usd", "is_free", "predicted_interest"]
    ].head(10)

    print(
        f"\nTop 10 events for student {student['record_id']} "
        f"({student['campus_group']}, {student['primary_interest']}):"
    )
    print(top.to_string(index=False))


def print_global_top10(out: pd.DataFrame, metrics: pd.DataFrame, df_raw: pd.DataFrame) -> None:
    """Print dataset-wide top-10 by best OOF model predictions."""
    best = metrics.sort_values("r2", ascending=False).iloc[0]["model"]
    col = f"pred_{best}"
    merged = df_raw[["record_id", "campus_group", "primary_interest", "event_type",
                     "event_neighborhood", "event_cost_usd", "is_free"]].merge(
        out[["record_id", "actual_interest", col]], on="record_id"
    )
    top = merged.nlargest(10, col).copy()
    top.insert(0, "rank", range(1, 11))
    top = top.rename(columns={col: "predicted_interest"})
    top_path = ROOT / "rankings_top10.csv"
    top.to_csv(top_path, index=False)
    print(f"\nGlobal top 10 by OOF {best}:")
    print(
        top[
            [
                "rank",
                "record_id",
                "campus_group",
                "primary_interest",
                "event_type",
                "is_free",
                "actual_interest",
                "predicted_interest",
            ]
        ].to_string(index=False)
    )
    print(f"wrote {top_path.name}")


def main() -> None:
    X, y, record_id = load_xy()
    models = make_models()

    print(f"5-fold OOF on n={len(X)} (each row predicted once, held out)\n")
    oof, metrics = run_oof(models, X, y)

    out = pd.DataFrame(
        {
            "record_id": record_id,
            "actual_interest": y,
            **{c: oof[c] for c in oof.columns},
        }
    )
    out.to_csv(PRED_PATH, index=False)
    metrics.to_csv(METRICS_PATH, index=False)
    print(f"\nwrote {PRED_PATH.name} ({len(out)} OOF rows) and {METRICS_PATH.name}")

    fit_and_save(models, X, y)

    # Permutation importance on full-data HGB
    hgb = models["hist_gradient_boosting"]
    # Need a matrix after prep for feature names — use sklearn get_feature_names_out
    X_trans = hgb.named_steps["prep"].transform(X)
    feat_names = hgb.named_steps["prep"].get_feature_names_out()
    r = permutation_importance(
        hgb.named_steps["model"],
        X_trans,
        y,
        n_repeats=5,
        random_state=RANDOM_STATE,
        n_jobs=1,
    )
    order = np.argsort(r.importances_mean)[::-1][:10]
    print("\nTop permutation importances (HGB):")
    for i in order:
        print(f"  {feat_names[i]:40s}  {r.importances_mean[i]:.4f}")

    df_raw = pd.read_csv(DATA)
    print_global_top10(out, metrics, df_raw)
    ranking_demo(hgb, df_raw, student_idx=0)


if __name__ == "__main__":
    main()
