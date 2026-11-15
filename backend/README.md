# NASA Space Apps Challenge 2026 — Astronaut Health Monitoring System
## Backend & Deterministic Health Intelligence Engine

This service powers the health intelligence layer for long-duration spaceflight missions (ISS Low Earth Orbit and Autonomous Mars Transit). It implements strict scientific safety protocols, zero-variance statistical baseline drift detection, cadence-aware data freshness monitoring, closed-loop intervention reassessment, and event-based operational risk logging.

---

### Core Scientific & Medical Principles

1. **Strictly No Invented Medical Cutoffs:** We do not hardcode unvalidated clinical thresholds. Instead, status alerts are triggered by deterministic **Cadence-Aware Freshness** and **Individual Statistical Personal Baseline Drift** ($|Z| \ge 2.0$), labeled transparently with `evidence_type: "STATISTICAL_BASELINE_DRIFT"` and `is_validated_clinical_threshold: false`.
2. **Deterministic & Explainable:** Zero ungrounded generative LLM clinical diagnostic authority. Calculations are 100% reproducible and grounded in spaceflight human research literature (NASA-STD-3001, NASA HRP Evidence Books).
3. **Data Quality Integrity:** Measurements flagged as `SUSPECT` (sensor noise) or `MISSING` (telemetry gaps) are excluded from baseline calculations, yet preserved in time-series outputs so the frontend charts gaps and warning markers. Missing or stale data produces `INSUFFICIENT_DATA`—it is never assumed normal.
4. **Mission Context Separation:** Adapts consultation guidance and communication delays (`ISS_LEO` at 2s vs. `MARS_TRANSIT` at 720s autonomous support) without altering underlying clinical math.
5. **Clear Scope Demarcation:**
   - **Musculoskeletal:** Exercise logs track countermeasure compliance only; they do not measure bone mineral density (BMD).
   - **Immune:** Wearables do not measure immune function; relies on periodic lab assays.
   - **Radiation:** Exposure history logging; does not compute individual cancer probability.
   - **ECLSS:** Habitat environmental telemetry; distinct from individual physiology.

---

### The Nine Health Domains

| Domain ID | Category | Headline Metric | Expected / Stale Interval | Scope Notice |
| :--- | :--- | :--- | :--- | :--- |
| `cardiovascular` | `PERSONAL_HEALTH` | `resting_hr_bpm` | 1.0h / 4.0h | Autonomic response & deconditioning tracking |
| `sleep_circadian` | `PERSONAL_HEALTH` | `sleep_duration_hours` | 24.0h / 48.0h | Rest interval & circadian alignment |
| `behavioral_psych` | `PERSONAL_HEALTH` | `cognitive_fatigue_score` | 24.0h / 48.0h | Subjective resilience & cognitive load |
| `musculoskeletal` | `PERSONAL_HEALTH` | `exercise_adherence_pct` | 24.0h / 48.0h | Countermeasure adherence (does not measure BMD) |
| `immune_microbio` | `PERSONAL_HEALTH` | `crp_biomarker_mg_l` | 168.0h / 336.0h | Periodic lab assays only (wearables cannot measure) |
| `radiation` | `PERSONAL_HEALTH` | `daily_dose_msv` | 24.0h / 48.0h | Dosimeter tracking (does not diagnose ARS/cancer) |
| `environment_eclss`| `ENVIRONMENTAL_ECLSS`| `co2_partial_pressure_mmhg`| 1.0h / 4.0h | Spacecraft habitat air quality & life support |
| `sensorimotor_neuro`| `PERSONAL_HEALTH` | `postural_instability_score`| 24.0h / 72.0h | Neurovestibular & SANS symptom monitoring |
| `nutrition` | `PERSONAL_HEALTH` | `caloric_intake_kcal` | 24.0h / 48.0h | Caloric adherence & hydration logs |

---

### Deterministic Seed Scenarios (Judge Demos)

Load any of these 4 scenarios at any time via `POST /api/v1/simulation/load`:

1. **`nominal_iss_baseline`**: Low-latency ISS mission (2s delay). All 9 domains valid and within personal baselines (`NORMAL` status, 0 active findings).
2. **`circadian_drift_and_fatigue_01`**: High-latency Mars Transit (720s delay, autonomous crew). Demonstrates cross-domain `ATTENTION` (`FINDING-CROSS-CIRCADIAN-AUTONOMIC-FATIGUE`), overdue immune assay (`INSUFFICIENT_DATA`), and `SUSPECT`/`MISSING` telemetry chart points.
3. **`post_action_reassessment_improved`**: Closed-loop intervention follow-up. Demonstrates an acknowledged circadian recommendation transitioning to `outcome: "IMPROVED"` after follow-up recovery telemetry.
4. **`eva_operational_incident_with_eclss_drift`**: Demonstrates discrete event-based operational risk logging (`/operational-risks`) alongside an `environment_eclss` statistical trend shift while keeping personal physiological domains cleanly separated.

---

### Quickstart & Developer Commands

Inside the `backend/` directory:

```bash
# 1. Install dependencies and activate virtual environment via uv
cd backend
uv sync

# 2. Run the test suite (16 tests covering contracts, drift math, closed-loop flows, errors)
uv run pytest -v

# 3. Start the FastAPI development server
uv run uvicorn app.main:app --reload --port 8000
```

#### API & Documentation Endpoints
- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI 3.1 JSON Specification:** [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)
- **Static Contract Export:** [backend/openapi.json](file:///Users/tanmaibollu/Desktop/CS/Hackathons/FS%2026/HealthMonitoring/NASA-Space/backend/openapi.json)
- **Healthcheck:** [http://localhost:8000/health](http://localhost:8000/health)

---

### Frontend Developer Integration Guide

- **CORS:** Fully enabled (`allow_origins=["*"]`) for independent local frontend development.
- **Base URL:** `http://localhost:8000/api/v1`
- **TypeScript Type Generation:** Use `backend/openapi.json` with tools like `openapi-typescript` to generate strict frontend types:
  ```bash
  npx openapi-typescript backend/openapi.json -o ../frontend/src/types/api.ts
  ```
- **Error Handling:** All `4xx` and `5xx` errors return a standard JSON envelope:
  ```json
  {
    "error": {
      "code": "ASTRONAUT_NOT_FOUND",
      "message": "Astronaut with ID 'astro-999' does not exist.",
      "field": "astronaut_id"
    }
  }
  ```

