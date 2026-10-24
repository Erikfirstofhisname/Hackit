"""Engineer cost- and community-based features for the synthetic events dataset.

Skips cost_per_budget until a student budget/comfort field exists.
"""

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "boston_student_creative_events_synthetic.xlsx"
OUT_CSV = ROOT / "boston_student_creative_events_features.csv"
OUT_XLSX = ROOT / "boston_student_creative_events_features.xlsx"


def cost_band(cost: int) -> str:
    if cost == 0:
        return "free"
    if cost <= 10:
        return "low"
    if cost <= 20:
        return "mid"
    return "high"


def engineer(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    # --- Cost features ---
    out["is_free"] = (out["event_cost_usd"] == 0).astype(int)
    out["cost_band"] = out["event_cost_usd"].map(cost_band)
    out["log1p_cost"] = np.log1p(out["event_cost_usd"])
    # cost_per_budget: deferred — needs student_budget / cost comfort field

    # --- Community features ---
    out["is_cross_campus"] = out["cross_campus_event"].astype(int)
    out["civic_fit"] = out["community_impact_importance_1_to_5"] * (
        out["event_type"] == "community_service"
    ).astype(int)
    out["cross_campus_x_impact"] = (
        out["cross_campus_event"] * out["community_impact_importance_1_to_5"]
    )

    # Normalized 0–1 parts of community_engagement_index
    impact_n = (out["community_impact_importance_1_to_5"] - 1) / 4.0
    cross_n = out["cross_campus_event"].astype(float)
    # More discovery apps → higher app fatigue → lower engagement contribution
    app_fatigue = (out["apps_currently_used_for_discovery"] - 1) / 5.0
    low_app_fatigue = 1.0 - app_fatigue
    out["community_engagement_index"] = (impact_n + cross_n + low_app_fatigue) / 3.0

    return out


def main() -> None:
    df = pd.read_excel(SRC, sheet_name="in")
    featured = engineer(df)
    featured.to_csv(OUT_CSV, index=False)
    featured.to_excel(OUT_XLSX, index=False, sheet_name="features")
    new_cols = [
        "is_free",
        "cost_band",
        "log1p_cost",
        "is_cross_campus",
        "civic_fit",
        "cross_campus_x_impact",
        "community_engagement_index",
    ]
    print(f"wrote {OUT_CSV.name} and {OUT_XLSX.name} ({len(featured)} rows)")
    print(featured[new_cols].describe(include="all").to_string())
    print("\ncost_band counts:\n", featured["cost_band"].value_counts().to_string())
    print("is_free rate:", featured["is_free"].mean())


if __name__ == "__main__":
    main()
