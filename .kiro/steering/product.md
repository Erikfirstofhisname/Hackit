---
inclusion: always
---

# Loka product context

Loka helps students discover creative and civic events by ranking student-event matches. The application presents an overall ranking, per-model rankings, and Gaussian-mixture-informed fit tiers.

## Product principles

- Make model choices and ranking results understandable to students.
- Keep the selection-to-results flow fast, responsive, and accessible.
- Preserve useful empty, loading, disabled, and error states.
- Treat model prompt text as preference metadata unless backend behavior is explicitly changed; prompt edits currently do not alter model training or scoring.
- Prefer deterministic, reproducible ranking behavior when changing the ML pipeline.
