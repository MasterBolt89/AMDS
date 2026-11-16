# 🚀 AMDS — Autonomous Medical Decision Support
### Autonomous Multimodal Health & Operational Risk Intelligence for Deep Space Exploration
**NASA Space Apps Challenge 2026**

---

## 🛰️ Mission Overview & Summary

During long-duration deep-space missions—such as transit to Mars or lunar Artemis operations—communication delays (up to 22 minutes one-way) preclude real-time consultation with terrestrial flight surgeons. The **AMDS (Autonomous Medical Decision Support)** platform provides an autonomous, deterministic, closed-loop clinical and operational intelligence system designed to support astronaut self-sufficiency and flight surgeon situational awareness.

The platform executes a rigorous **closed-loop clinical workflow**:
```text
┌─────────────┐     ┌────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐
│   COLLECT   │ ──> │   ASSESS   │ ──> │   EXPLAIN   │ ──> │     ACT     │ ──> │   REASSESS    │
│ Multi-Modal │     │ Determin-  │     │ Transparent │     │ Evidence-   │     │ Time-Windowed │
│  Telemetry  │     │   istic    │     │ Provenance  │     │  Directed   │     │ Verification  │
└─────────────┘     └────────────┘     └─────────────┘     └─────────────┘     └───────────────┘
```

The system continuously assesses **9 physiological and environmental domains** alongside an integrated **Operational Risk Registry**:

| Domain ID | Category | Scope & Modalities | Primary Metrics | Cadence Policy |
| :--- | :--- | :--- | :--- | :--- |
| `cardiovascular` | Personal Health | Continuous wearable telemetry & Holter ECG | Resting Heart Rate (bpm), HRV SDNN (ms) | Continuous (1 Hz - 10 min) |
| `sleep_circadian` | Personal Health | Actigraphy, sleep staging, circadian phase | Total Sleep Time (h), Core Sleep Efficiency (%) | Daily sleep cycle |
| `behavioral_psych` | Personal Health | Audio/video logs, cognitive throughput batteries | Cognitive Processing Speed (ms), Valence Score | Daily / 48-hour check-in |
| `musculoskeletal` | Personal Health | ARED load cells, muscle dynamometry, DXA | Isokinetic Knee Extensor Peak Torque (N·m) | Weekly / post-exercise |
| `immune_microbio` | Personal Health | Saliva/blood assay, cytokine panels | Salivary sIgA (µg/mL), Cytokine Ratio | 14-day biomarker assay |
| `radiation` | Personal Health | Personal passive/active dosimeters | Cumulative Equivalent Dose (mSv), Flux Rate | Continuous dosimeter |
| `environment_eclss` | Environmental | Cabin atmospheric pressure, gas fractions | Cabin ppO₂ (kPa), CO₂ Partial Pressure (mmHg) | Continuous cabin sensors |
| `sensorimotor_neuro` | Personal Health | Vestibular posture platform, saccadic tracking | Postural Sway Velocity (mm/s), Dynamic Acuity | Bi-weekly flight battery |
| `nutrition` | Personal Health | Metabolic intake logs, body mass scale | Caloric Intake (kcal/d), Total Body Mass (kg) | Daily metabolic logging |

---

## 🛡️ Clinical Epistemology & Safety Guardrails

Space medicine demands strict epistemic honesty. The AMDS platform is architected around foundational clinical safety principles:

### 1. Deterministic Assessment Engine (Zero LLM Hallucinations)
Diagnostic evaluations, baseline drift calculations, and countermeasure triggers are computed through deterministic statistical algorithms and validated aerospace medicine protocols (NASA STD-3001, NASA HRP). Generative AI is never permitted to invent clinical thresholds, forge diagnoses, or bypass safety boundaries.

### 2. Strict Separation of Evidence Types
Every finding and recommendation is tagged with its formal evidence provenance:
* `VALIDATED_STANDARD`: Clinical thresholds established by NASA STD-3001 or aerospace clinical guidelines.
* `STATISTICAL_BASELINE_DRIFT`: Longitudinal statistical deviation ($>2\sigma$ or $>3\sigma$) against the astronaut's personalized pre-mission baseline.
* `EXPERIMENTAL_HEURISTIC`: Spaceflight-validated predictive trends requiring surgeon confirmation.

### 3. `INSUFFICIENT_DATA` is Never Assumed Healthy
Missing samples, expired assay intervals, or lost sensor feeds are explicitly classified as `INSUFFICIENT_DATA` (`#64748B` slate dashed visual state). The system never treats missing data as normal (`NORMAL`), and always displays the overdue cadence rule and days elapsed.

### 4. Sensor Quality & Outlier Isolation
Telemetry points carry explicit data quality tags:
* `VALID`: Verified sensor reading included in trend and baseline calculations.
* `SUSPECT`: Artifactual readings (e.g., motion artifacts, post-exercise spikes). Plotted with amber warning markers and tooltip explanations. By default, **suspect outliers are isolated from the chart's Y-axis scale** to prevent trend compression, with a user toggle to inspect on-scale.
* `MISSING`: Dropped telemetry packets or gaps render as **true line breaks** (`connectNulls={false}`). They are never bridged across time or rendered as zero.

### 5. Communication Latency & Mission-Phase Awareness
The command center adjusts its operational protocol according to Earth-vehicle distance:
* **`ISS_LEO` (Low Earth Orbit):** 2.0-second round-trip latency. Terrestrial Flight Surgeon consultation is directly accessible.
* **`MARS_TRANSIT` (Deep Space):** 720.0-second (12-minute) one-way light time (24-minute round trip). Autonomous guidance protocols and crew-actionable countermeasures activate automatically.

---

## 🏗️ Repository Architecture

```text
NASA-Space/
├── README.md                      # Project documentation and judge walkthrough
├── backend/                       # FastAPI Health Intelligence Service
│   ├── app/
│   │   ├── api/v1/                # Locked /api/v1 REST endpoints
│   │   │   └── endpoints/         # Astronauts, Domains, Recommendations, Telemetry, Simulation
│   │   ├── core/                  # Database session, config, and standardized error envelopes
│   │   ├── intelligence/          # Deterministic health intelligence engines
│   │   │   ├── baseline_engine.py # Personalized baseline calculation (mean, std dev)
│   │   │   ├── cadences.py        # Periodic sample requirements & overdue tracking
│   │   │   ├── cross_domain.py    # Multi-domain correlation & clinical findings
│   │   │   ├── drift_detector.py  # Statistical deviation & threshold assessment
│   │   │   └── reassessment_tracker.py # Time-windowed reassessment & recovery logic
│   │   ├── models/                # Pydantic v2 schemas and SQLAlchemy ORM models
│   │   ├── seed/                  # Seed loader & 4 scenario data fixtures
│   │   └── main.py                # FastAPI application entrypoint & CORS middleware
│   ├── tests/                     # Asynchronous test suite (pytest + httpx)
│   ├── openapi.json               # Full OpenAPI 3.1.0 schema specification
│   └── pyproject.toml             # Python packaging & dependencies (uv managed)
└── frontend/                      # React 19 + TypeScript + Vite Command Center
    ├── src/
    │   ├── api/                   # REST client with automatic schema transformation
    │   ├── components/            # High-density aerospace UI components
    │   │   ├── DomainCard.tsx     # 9-domain grid cards with baseline deltas
    │   │   ├── DomainDetailView.tsx # Time-series charts, outlier toggle, cadence policy
    │   │   ├── FindingsPanel.tsx  # Clinical findings with evidence badges
    │   │   ├── Header.tsx         # Crew selector, comms latency, scenario switcher
    │   │   ├── RecommendationsPanel.tsx # Action logging & closed-loop reassessment
    │   │   ├── StatusBadge.tsx    # Aerospace severity pills (NORMAL, ATTENTION, CRITICAL)
    │   │   ├── TelemetryBatchModal.tsx # Ad-hoc telemetry & lab assay ingestion modal
    │   │   └── OperationalRisksModal.tsx # EVA hypoxia, suit delta-p, and DCS event logger
    │   ├── mocks/                 # Stateful offline mock fixtures for standalone demo
    │   ├── types/                 # Strict TypeScript schemas mirroring /api/v1 contract
    │   ├── App.tsx                # Central command deck view and state orchestration
    │   └── main.tsx               # Client entrypoint
    ├── .env                       # Live backend configuration (VITE_USE_MOCK=false)
    ├── .env.example               # Environment template
    ├── package.json               # Frontend dependencies (Lucide, Recharts)
    └── vite.config.ts             # Vite configuration with port 5173
```

---

## ⚡ Quick Start Instructions

Launch the complete application (FastAPI backend + Vite frontend) with a single cross-platform command:

### 🚀 Unified One-Click Launchers (Recommended)

#### macOS / Linux
```bash
./start-demo.sh
```
*(Automatically syncs Python dependencies with `uv`, boots the FastAPI backend on `http://127.0.0.1:8000`, installs and starts the Vite frontend on `http://127.0.0.1:5173`, opens the dashboard in your default browser, and cleanly shuts down background processes on exit).*

#### Windows
```cmd
start-demo.bat
```
*(Configures tool paths, starts the backend and frontend in separate background shells, and launches `http://127.0.0.1:5173` in your default browser).*

---

### 🛡️ Backend-First Auto-Fallback & Manual Launch
You can also start each service manually or run the frontend standalone:

* **Full-Stack Mode:**
  ```powershell
  # Terminal 1: Live FastAPI Backend
  cd backend; uv sync; uv run uvicorn app.main:app --reload --port 8000

  # Terminal 2: React Vite Command Center
  cd frontend; npm install; npm run dev
  ```
  * **Interactive OpenAPI Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
  * **Frontend Command Center:** [http://localhost:5173](http://localhost:5173)

* **Standalone Frontend Mode (Automatic Browser Mock Fallback):**
  ```powershell
  cd frontend; npm install; npm run dev
  ```
  * The frontend client attempts the live FastAPI backend (`http://127.0.0.1:8000`) first.
  * If the backend is not running, the application **automatically falls back** to the built-in stateful browser mock simulator.
  * A prominent amber warning banner displays at the top of the console:
    > **`HARDCODED MOCK MODE — Live FastAPI backend is not connected. Displaying browser simulation fixtures rather than the Python intelligence engine.`**
  * Evaluators can click the **"Retry Live Connection"** button at any time to re-ping the backend without reloading the page.
  * When connected to the live server, a green **`LIVE FASTAPI ENGINE`** status pill appears in the top header.

---

## 🧪 Verification & Test Suites

Both stacks feature end-to-end automated test suites and type-checking:

### Backend Tests
```bash
cd backend
uv run pytest -v
```
* **Coverage:** 16 tests covering OpenAPI schema compliance, 9-domain dashboard aggregation, statistical drift formulas, cross-domain clinical findings, time-windowed reassessment outcome transitions, scenario seed loading, and RFC 7807 error envelopes.

### Frontend Automated Test Suite (Vitest + RTL)
```bash
cd frontend
npm test
```
* **Coverage:** 22 automated tests across `contractAndScenarios.test.ts`, `DomainCard.test.tsx`, `fallbackConnection.test.ts`, and `fullstackIntegration.test.ts` validating all 4 judge scenarios, 9 domains, 8 Personal vs 1 ECLSS breakdown, strict `INSUFFICIENT_DATA` safety guardrails, auto-fallback connection states, and tabular monospace headline metric displays.

### Frontend Production Build & TypeScript Verification
```bash
cd frontend
npm run build
```
* **Coverage:** Validates 100% strict TypeScript typing across all `/api/v1` interfaces, component trees, and Vite production bundle generation with zero compiler errors.

---

## 🔍 Judge Demo Walkthrough (4 Seeded Scenarios)

The command center includes 4 pre-seeded clinical and operational scenarios centered on astronaut **`astro-101` (`Ares-Lead`)**, selectable directly from the top navigation bar.

### Scenario 1: Nominal ISS Baseline (`nominal_iss_baseline`)
* **Mission Context:** ISS Low Earth Orbit (LEO), Mission Day 42. Comms latency is **2.0s**, with live terrestrial Flight Surgeon consultation active.
* **Clinical Presentation:** All 9 health domains show `NORMAL` (green). Vital signs, cognitive tests, and cabin environment are tightly bounded within $\pm 1\sigma$ of baseline.
* **Key Observations:** The Guidance box instructs standard ground consultation protocols. No critical actions pending.

### Scenario 2: Circadian Drift & Fatigue (`circadian_drift_and_fatigue_01`)
* **Mission Context:** Mars Transit Phase, Mission Day 84. Earth comms latency reaches **720.0 seconds (12.0 minutes one-way)**. Terrestrial consultation is unavailable in real-time (`live_flight_surgeon_available: false`).
* **Clinical Presentation:**
  * `sleep_circadian`: Status `ATTENTION`. Sleep duration dropped to **5.4 hours/night** (baseline: 7.1h, a $-23.9\%$ deficit) with reduced REM percentage.
  * `cardiovascular`: Status `ATTENTION`. Resting heart rate elevated to **68.0 bpm** (baseline: 59.5 bpm, $+14.3\%$).
  * `immune_microbio`: Status `INSUFFICIENT_DATA`. Highlighted in slate dashed lines. Saliva/blood panel is overdue (expected every 14 days; last sample was 25 days ago).
* **Interactive Chart Exploration (`cardiovascular`):**
  1. Click the **Cardiovascular** card to inspect its time-series chart.
  2. Notice the amber marker at Day 83: a **`SUSPECT`** reading of $142.0\text{ bpm}$ (post-exercise sensor motion artifact). By default, it does not blow out the Y-axis scale.
  3. Toggle **"Include Suspect Outliers in Axis Scale"** to observe how the chart safely scales to show the full spike without masking the baseline trend.
  4. Notice the clean gap at Day 82: a **`MISSING`** sensor feed cleanly breaks the line segment rather than bridging across time.
* **Closed-Loop Action Execution:**
  1. Under the **Recommendations** panel, locate `REC-SLEEP_CIRCADIAN-01` ("Advance Sleep Schedule & Blue-Light Protocol").
  2. Click **"Acknowledge & Log Action"**.
  3. Enter an action note (e.g., *"Crew confirmed: shifting sleep schedule by 30 mins and initiating blue-spectrum light attenuation"*).
  4. Submit to observe the recommendation status immediately transition to `ACKNOWLEDGED` with recorded timestamp and crew notes.

### Scenario 3: Post-Action Reassessment Improved (`post_action_reassessment_improved`)
* **Mission Context:** Mars Transit Phase, Mission Day 87 (72 hours following countermeasure initiation).
* **Clinical Presentation:**
  * Reassessment tracking detects resolution: `reassessment.outcome: "IMPROVED"`.
  * `sleep_circadian` recovered to **7.4 hours/night** (`NORMAL`).
  * `cardiovascular` resting HR normalized to **60.5 bpm** (`NORMAL`).
  * Closed-loop verification demonstrates how the platform verifies therapeutic efficacy under deep-space communication delays.

### Scenario 4: EVA Operational Incident & ECLSS Drift (`eva_operational_incident_with_eclss_drift`)
* **Mission Context:** Lunar Surface EVA, Mission Day 91.
* **Operational Risk Registry:** Displays an active `CRITICAL` operational incident:
  * **Event Type:** `HYPOXIA_EVENT` / Suit Delta-P Anomaly during Airlock Prep.
  * **Environmental Impact:** `environment_eclss` drops into `CRITICAL` due to rapid cabin ppO₂ pressure fluctuation.
  * **Cross-Domain Cascade:** Sensorimotor postural sway velocity spikes to **38.2 mm/s** (+42.5%), triggering automated crew abort protocols and cabin re-pressurization guidance.

---

## 💻 Interactive Features to Evaluate

* **Scenario & Crew Switching:** Instantly swap scenarios or switch astronaut profiles via the header dropdowns without restarting any services.
* **Outlier & Gap Inspection:** Open domain detail views to test `VALID`, `SUSPECT`, and `MISSING` telemetry behaviors.
* **Ad-Hoc Telemetry Ingestion:** Click **"Ingest Telemetry"** in the navigation bar to inject ad-hoc heart rate, cognitive, or lab assay data (`POST /api/v1/telemetry/batch`). Resolves overdue cadence states like `immune_microbio` in real-time.
* **Operational Risk Logging:** Click **"Operational Risks"** to view logged spaceflight risks or submit a new hypoxia, decompression sickness (DCS), or dynamic load record (`POST /api/v1/astronauts/{id}/operational-risks`).

---

## 🔒 Security, Compliance & System Specifications

* **RFC 7807 Compliant Error Envelopes:** All 404, 422, and 500 API responses return structured problem details (`detail`, `status_code`, `timestamp`).
* **CORS Middleware:** Configured to support all standard development origins (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`).
* **Database Engine:** Async SQLite via SQLAlchemy with WAL mode, optimized for high-concurrency embedded flight deck hardware.
* **NASA Standards Referenced:**
  * NASA STD-3001 (Space Flight Human-System Standard, Volumes 1 & 2)
  * NASA Human Research Program (HRP) Integrated Research Plan

---

**AMDS (Autonomous Medical Decision Support)** — *Built with precision for the human exploration of the Moon, Mars, and beyond.*
