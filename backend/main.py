"""Loka API — train/test models, GMM tiers, rankings."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.ml import MODEL_CATALOG, run_pipeline

app = FastAPI(title="Loka API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    model_ids: list[str] = Field(
        default_factory=lambda: [m["id"] for m in MODEL_CATALOG]
    )
    prompts: dict[str, str] = Field(default_factory=dict)
    n_tiers: int = 3
    top_n: int = 10


@app.get("/api/health")
def health():
    return {"ok": True, "service": "loka"}


@app.get("/api/models")
def list_models():
    return {
        "models": [
            {
                "id": m["id"],
                "name": m["name"],
                "task": m["task"],
                "learner": m["learner"],
                "default_prompt": m["default_prompt"],
            }
            for m in MODEL_CATALOG
        ]
    }


@app.post("/api/run")
def run(req: RunRequest):
    try:
        return run_pipeline(
            selected_ids=req.model_ids,
            prompts=req.prompts,
            n_tiers=req.n_tiers,
            top_n=req.top_n,
        )
    except Exception as exc:  # noqa: BLE001 — surface ML errors to the UI
        from fastapi import HTTPException

        raise HTTPException(status_code=500, detail=str(exc)) from exc
