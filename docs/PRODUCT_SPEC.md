# ROLE

You are the principal engineer, ML engineer, product engineer, UX engineer, and technical architect responsible for building a hackathon-quality working prototype called **ArogyaMesh**.

Do not merely generate mock screens or a frontend demo.

Build a functioning end-to-end application with:
- realistic synthetic PHC data
- working APIs
- persistence
- demand forecasting
- stock-out prediction
- data confidence / TruthScore
- donor-safe redistribution optimization
- emergency simulation
- personnel/service-capacity modelling
- cross-district redistribution
- federated-learning demonstration
- offline PHC operation
- Gemini-powered explanations
- automated tests
- reproducible seed/demo scenario

The application must be polished enough to demonstrate live to hackathon judges.

---

# 0. FIRST ACTION: INSPECT AND PLAN

Before changing code:

1. Inspect the entire repository.
2. Read any existing:
   - README
   - AGENTS.md
   - package manifests
   - environment files
   - database schema
   - existing architecture
3. Preserve useful existing work.
4. Identify missing dependencies and broken configuration.
5. Produce a concise implementation plan ordered by dependency.
6. Then implement it.

If the repository is empty, scaffold the application.

Do not ask me broad product questions unless a missing piece makes implementation genuinely impossible.

When details are unspecified, make the best technically sound decision consistent with this specification.

Do not replace requirements with simpler mock implementations without clearly documenting why.

---

# 1. PRODUCT

## Name

**ArogyaMesh**

## Positioning

**A federated resilience autopilot for India's Primary Health Centre network.**

## Core promise

ArogyaMesh predicts which PHC is likely to experience a medicine/resource shortage **before patients are affected**, determines whether the underlying resource data can be trusted, and recommends the safest cross-district redistribution without creating a shortage at the donor facility.

## Core product loop

**VERIFY → PREDICT → SIMULATE → REDISTRIBUTE → LEARN**

### VERIFY
Determine whether incoming inventory/resource data is sufficiently fresh and internally consistent to trust.

### PREDICT
Forecast medicine demand, patient footfall, beds and service capacity.

### SIMULATE
Model the future state of the PHC network under normal conditions or emergencies.

### REDISTRIBUTE
Recommend donor-safe resource transfers across PHCs and districts.

### LEARN
Demonstrate federated predictive learning across multiple states without moving raw state-level data into one training dataset.

---

# 2. THE REAL-WORLD PROBLEM

Existing systems can record inventory.

ArogyaMesh must solve the harder decision problem:

> Can we determine what is likely to fail next, how confident we are in the underlying data, and what intervention prevents the failure without moving the crisis somewhere else?

The prototype must explicitly address:

- medicine stocks
- patient footfall
- bed availability
- medical personnel attendance
- personnel/service capacity
- future demand
- stock-out warnings
- health emergencies
- cross-district redistribution
- state-level federated learning
- unreliable/stale inventory data
- intermittent connectivity

Do NOT position ArogyaMesh as replacing existing government health systems.

Treat it as an **intelligence and resilience layer that could integrate with e-Aushadhi/HMIS/ABDM-like systems.**

For the hackathon prototype, use synthetic/integration-adapter data only.

---

# 3. PRODUCT PRINCIPLES

These requirements are non-negotiable.

## 3.1 Prediction is not the same as truth

Never assume an inventory number is correct merely because it exists in the database.

Every critical resource must have:
- recorded quantity
- last update timestamp
- last reconciliation timestamp
- anomaly indicators
- data source
- estimated confidence
- TruthScore from 0–100

Display **forecast confidence** separately from **data confidence**.

---

## 3.2 Never solve one PHC's shortage by creating another

Every redistribution recommendation must simulate the donor after the proposed transfer.

A donor is valid only when its predicted shortage risk remains below configured safety thresholds.

This is one of the application's most important differentiators.

---

## 3.3 Human approval

The system may automatically generate an optimized redistribution recommendation.

It must NOT claim to autonomously execute real government medicine movement.

Workflow:

AI recommendation
→ explanation
→ officer review
→ Approve / Reject
→ simulated dispatch state

---

## 3.4 No sensitive patient data

The prototype must use synthetic aggregated health data.

Do not create unnecessary patient-level PII.

Keep data at:
- PHC
- resource
- time-series
- aggregated disease/symptom
- attendance/service-capacity

levels.

---

## 3.5 Gemini is not the forecasting engine

Do not use an LLM to invent demand numbers.

Use deterministic/statistical/ML models for:
- demand forecasting
- risk prediction
- redistribution
- anomaly detection

Gemini may:
- explain recommendations
- summarize incidents
- answer officer questions using structured model outputs
- translate explanations
- produce district briefings

If Gemini is unavailable, provide a deterministic fallback explanation so the demo remains functional.

---

# 4. TARGET USERS

Create role-aware experiences for:

### PHC operator / pharmacist
Needs:
- stock recording
- receiving stock
- dispensing stock
- physical reconciliation
- alerts
- offline operation

### Medical Officer
Needs:
- patient footfall
- staffing
- service capacity
- local warnings

### District Health / Logistics Officer
Needs:
- district map
- risk ranking
- cross-PHC resource optimization
- transfer approval
- emergency simulation

### State / National observer
Needs:
- aggregate network resilience
- federated-model status
- district/state comparisons
- emergency monitoring

For the prototype, authentication may be demo-role based rather than production identity infrastructure.

---

# 5. TECH STACK

Prefer the following unless the existing repository strongly indicates otherwise.

## Frontend

- Next.js
- TypeScript
- App Router
- React
- Tailwind CSS
- accessible component primitives
- TanStack Query where useful
- Zustand or lightweight equivalent only when global client state is genuinely required

## Offline

Build the PHC operator experience as a PWA.

Use:
- Service Worker
- IndexedDB
- queued offline operations
- synchronization when connectivity returns
- visible online/offline indicator
- conflict handling

## Backend

Prefer:

- Python FastAPI for core API/ML/optimization service

or, if repository architecture already strongly favors TypeScript:

- Fastify for application API
- separate Python ML service

Keep boundaries clean.

## Database

PostgreSQL.

Use migrations.

Do not store important application state only in memory.

## ML / analytics

Use Python ecosystem:
- pandas
- numpy
- scikit-learn
- TensorFlow/Keras where required
- TensorFlow Federated if practical

If TensorFlow Federated creates environmental/dependency instability, implement a mathematically correct **FedAvg simulation** with separate state datasets and clearly document it.

Do not fake federated learning by concatenating data from all states.

## Google ecosystem

Design integration points for:

- Gemini on Vertex AI
- Google Cloud Run
- BigQuery / analytics
- Google Maps Platform
- Route Optimization API

External services must be wrapped behind interfaces/adapters.

The local demo must still work without paid cloud credentials.

Provide mocked/local fallback implementations.

---

# 6. REPOSITORY STRUCTURE

Use a clean monorepo similar to:

```text
/
  apps/
    web/
    api/
  services/
    ml/
  packages/
    shared/
  data/
    synthetic/
  scripts/
  docs/
  tests/
  docker/
  .env.example
  docker-compose.yml
  README.md
  AGENTS.md
```

Adjust if the repo already has a sensible structure.

Create a concise `AGENTS.md` containing stable engineering instructions, not the entire product specification.

Put detailed architecture/product documentation under `docs/`.

---

# 7. DOMAIN MODEL

Create normalized entities approximately covering:

## Geography

State
- id
- name
- code

District
- id
- state_id
- name
- latitude
- longitude

PHC
- id
- district_id
- name
- latitude
- longitude
- population_served
- facility_type
- connectivity_status

---

## Medicine

Medicine
- id
- generic_name
- category
- unit
- criticality
- shelf_life_days
- cold_chain_required

InventoryBatch
- id
- phc_id
- medicine_id
- batch_number
- expiry_date
- quantity
- received_at

InventoryEvent
- id
- phc_id
- medicine_id
- type
- quantity
- timestamp
- source
- sync_status

Possible event types:
- RECEIVE
- DISPENSE
- TRANSFER_IN
- TRANSFER_OUT
- ADJUSTMENT
- RECONCILIATION

---

## Inventory snapshot

ResourceSnapshot
- phc_id
- medicine_id/resource_id
- recorded_quantity
- estimated_quantity
- last_event_at
- last_sync_at
- last_reconciliation_at
- truth_score
- anomaly_flags

---

## Footfall

DailyFootfall
- phc_id
- date
- total_patients
- fever_cases
- respiratory_cases
- maternal_cases
- diabetes_cases
- other aggregate categories as useful

No identifiable patient data.

---

## Beds

BedSnapshot
- phc_id
- timestamp
- total_beds
- occupied_beds
- available_beds

---

## Personnel

StaffMember
- id
- phc_id
- role
- demo_name
- status

AttendanceRecord
- staff_id
- date
- check_in
- check_out
- status

Roles:
- doctor
- nurse
- pharmacist
- lab technician

---

## Service capacity

ServiceCapacitySnapshot
- phc_id
- timestamp
- required_doctors
- available_doctors
- required_nurses
- available_nurses
- required_pharmacists
- available_pharmacists
- predicted_footfall
- capacity_score
- expected_overflow

---

## Forecast

Forecast
- id
- phc_id
- resource_type
- resource_id
- generated_at
- forecast_date
- predicted_demand
- lower_bound
- upper_bound
- stock_out_probability
- predicted_days_remaining
- model_version

---

## Transfer

TransferRecommendation
- id
- resource_id
- recipient_phc_id
- donor_phc_id
- quantity
- recipient_risk_before
- recipient_risk_after
- donor_risk_before
- donor_risk_after
- distance_km
- rationale
- status

Status:
- PROPOSED
- APPROVED
- REJECTED
- DISPATCHED
- COMPLETED

---

## Emergency scenario

EmergencyScenario
- id
- name
- affected_region
- start_date
- duration
- disease_or_event
- demand_multiplier
- footfall_multiplier
- staffing_multiplier

SimulationRun
- id
- scenario_id
- created_at
- before_metrics
- intervention_plan
- after_metrics

---

# 8. SYNTHETIC DEMO DATA

Generate deterministic seeded data.

Minimum:

- 3 states
- 3 districts per state
- 8–12 PHCs per district
- approximately 75–100 PHCs total

Include at least 20 representative medicines.

Seed realistic variation in:
- daily demand
- seasonal patterns
- stock levels
- lead times
- staffing
- beds
- facility size
- connectivity
- outbreaks
- unreliable records

Generate at least 90 days of historical data.

Ensure one deterministic scripted demo scenario exists:

### Hero scenario

PHC-A currently appears healthy.

Current ORS stock:
approximately 700–900 units.

Forecast:
stock-out in approximately 4–5 days.

Risk:
approximately 90%+.

PHC-B appears to have surplus but transferring the naive amount should make PHC-B unsafe.

PHC-C should provide part of the required stock.

Optimized recommendation should split donor quantities such that:

Recipient risk:
~90% → below 10%

Donor B:
remains below approximately 10–15% shortage risk

Donor C:
remains below approximately 10–15% shortage risk

Do not hardcode these values directly in UI components.

They should come through the actual forecasting/optimization pipeline from seeded data.

---

# 9. TRUTHSCORE ENGINE

Implement a transparent TruthScore between 0 and 100.

Inputs may include:

- data freshness
- time since last physical reconciliation
- missing event rate
- stock event consistency
- impossible negative inventory
- sudden unexplained adjustments
- offline sync lag
- mismatch between expected and observed depletion
- suspicious batch totals

Example conceptual weighting:

```text
freshness                30%
physical reconciliation  25%
event consistency         20%
sync completeness         15%
anomaly penalty           10%
```

You may improve the formula.

Expose component breakdown.

Example response:

```json
{
  "truthScore": 54,
  "level": "low",
  "components": {
    "freshness": 12,
    "reconciliation": 9,
    "eventConsistency": 16,
    "syncCompleteness": 11,
    "anomalyAdjustment": 6
  },
  "reasons": [
    "Last physical reconciliation was 9 days ago",
    "17 offline transactions synced late",
    "Consumption anomaly detected"
  ]
}
```

TruthScore must materially affect forecasting uncertainty.

Low-confidence data should widen prediction intervals and/or reduce recommendation confidence.

---

# 10. SHADOW / LATENT DEMAND

Implement an approach to avoid the classic stock-out bias:

When inventory is zero, dispensed quantity may be zero even though patient demand continues.

Estimate latent demand using signals such as:
- historical demand before stock-out
- patient footfall
- relevant aggregate disease categories
- nearby PHC patterns
- day-of-week
- seasonal trend
- stock availability
- previous censored periods

Expose:

- observed dispensing
- estimated demand
- estimated unmet demand

Example:

```text
Observed dispensing: 0
Estimated true demand: 104/day
Estimated unmet demand: 104/day
```

Do not label zero dispensing during zero inventory as zero demand.

Add tests specifically for this behavior.

---

# 11. FORECASTING ENGINE

Forecast at minimum:

- patient footfall
- medicine demand
- stock depletion
- bed utilization
- service capacity

Required horizons:
- 1 day
- 3 days
- 7 days
- 14 days

The model does not need to be research-grade, but it must be:
- mathematically valid
- deterministic/reproducible
- evaluated
- explainable enough for a hackathon demo

Generate confidence intervals.

Provide model evaluation metrics in an internal `/model-health` or admin view.

Possible metrics:
- MAE
- RMSE
- MAPE when appropriate

Never manufacture accuracy claims.

---

# 12. STOCK-OUT RISK

For every PHC/medicine calculate:

- predicted demand
- effective/estimated stock
- days of cover
- stock-out probability
- expected shortage date
- prediction confidence
- data TruthScore

Example UI:

```text
ORS

Recorded stock          782
Estimated usable stock  746
TruthScore               91/100

Expected demand          167/day
Days of cover            4.5

Stock-out probability    93%
Expected shortage        5 Oct

Forecast confidence      89%
```

---

# 13. DONOR-SAFE REDISTRIBUTION ENGINE

This is a flagship feature.

Given a recipient shortage:

1. Determine required quantity.
2. Search donors:
   - same district first
   - neighboring districts
   - district warehouse/state reserve if represented
3. Compute safe transferable quantity for each donor.
4. Simulate donor future demand after transfer.
5. Reject donors that become unsafe.
6. Optimize transfer mix.

Objectives should consider:
- recipient shortage risk
- donor shortage risk
- safety reserve
- distance
- travel time
- resource criticality
- expiry
- FEFO
- cold-chain compatibility
- transport capacity where modelled

A simplified objective is acceptable but must be explicit and tested.

Conceptually:

```text
minimize:
recipient_shortage_risk
+ donor_shortage_risk
+ travel_cost
+ expiry_waste
```

subject to:

```text
donor_stock_after_transfer >= donor_safety_stock
recipient_requirement_satisfied
cold_chain_constraints_satisfied
donor_future_risk <= configured_threshold
```

Show rejected alternatives and why they were rejected.

Example:

```text
PHC-B is geographically closest.

Rejected naive transfer: 700 units.

Reason:
Donor shortage probability would increase from 7% to 68%.

Safe quantity from PHC-B:
380.

Remaining requirement:
220.

PHC-C can safely contribute:
220.
```

This must appear in the UI.

---

# 14. CROSS-DISTRICT BEHAVIOR

Explicitly demonstrate transfers between districts.

Example:

```text
Kurnool District
PHC-017
↓ shortage

same-district search
↓ insufficient safe stock

Nandyal District
PHC-008 → 280 units

Anantapur District reserve → 220 units
```

UI should make district boundaries visible.

---

# 15. PERSONNEL ATTENDANCE → SERVICE CAPACITY

Show raw attendance because it is part of the challenge.

Also derive a more meaningful capacity metric.

Example:

```text
Doctor      1 / 1
Nurses      1 / 2
Pharmacist  1 / 1

Predicted patients: 121

Clinical/service capacity: 74%

Expected overflow:
31 patients
```

Capacity should depend on:
- present staff
- role
- expected footfall
- configurable throughput assumptions

Clearly label these assumptions in documentation.

Do not use facial recognition.

---

# 16. BED CAPACITY

Track:
- total beds
- occupied beds
- available beds
- predicted admissions
- expected discharges where simulated
- predicted occupancy

Alert before projected occupancy exceeds threshold.

---

# 17. EMERGENCY SIMULATOR

Build a prominent feature:

## SIMULATE HEALTH EMERGENCY

Allow selecting:
- disease/event
- district/state
- severity
- duration

Presets:
- dengue surge
- heatwave/dehydration surge
- respiratory outbreak

Example:

```text
Dengue
+250% disease-linked demand
14 days
Kurnool district
```

Run the network forward in simulated time.

Show timeline:

```text
Day 1  normal
Day 3  demand rising
Day 4  PHC-11 medicine threshold breach
Day 5  PHC-7 bed overload
Day 6  PHC-14 service-capacity overload
Day 7  spillover affects PHC-18
```

Then provide:

## OPTIMIZE RESPONSE

Run redistribution/capacity interventions.

Compare:

```text
WITHOUT AROGYAMESH
7 critical facility failures
184 estimated unmet resource events

WITH RECOMMENDED PLAN
1 critical facility failure
21 estimated unmet resource events
```

Only show impact numbers that are produced by the simulation.

Label them clearly as simulation results, not real-world clinical claims.

---

# 18. CASCADING FAILURE MODEL

Do not treat metrics as totally independent.

Implement at least a simplified network effect:

Staff shortage
→ reduced facility service capacity
→ overflow patients routed to neighboring PHCs
→ neighboring footfall increases
→ medicine demand increases
→ bed utilization changes
→ shortage risks change

This may be rule-based rather than a causal AI model.

Document assumptions.

The purpose is to show network resilience.

---

# 19. FEDERATED LEARNING DEMO

This is mandatory.

Create separate training datasets for at least:

- Andhra Pradesh
- Karnataka
- Telangana

Each state's raw data must remain in its own logical dataset/training process.

Implement a demonstration of federated averaging.

Process:

```text
National/base model
      ↓
State model A trains locally
State model B trains locally
State model C trains locally
      ↓
model parameter updates
      ↓
weighted aggregation
      ↓
new global model
      ↓
distributed back to states
```

The code must clearly demonstrate that raw rows are not combined into one central training dataframe.

Provide a UI:

### Federated Intelligence

```text
Andhra Pradesh
Local samples: 18,420
Round: 4
Status: trained

Karnataka
Local samples: 19,883
Round: 4
Status: trained

Telangana
Local samples: 17,992
Round: 4
Status: trained

Raw records transferred:
0

Global model version:
v4
```

Show model metric changes across rounds where meaningful.

Do not claim production privacy guarantees unless actually implemented.

Label this honestly as a federated-learning prototype.

---

# 20. OFFLINE-FIRST PHC MODE

Create a PHC operator workflow that works without network connectivity.

Required demo:

1. User switches app into offline state OR browser network is unavailable.
2. Dispense 50 ORS units.
3. UI updates locally.
4. Event is queued.
5. Connectivity returns.
6. Sync occurs.
7. Backend inventory updates.
8. district dashboard receives updated state.
9. TruthScore reflects sync lag appropriately.

Show:
- online/offline status
- unsynced event count
- last successful sync
- conflict state when necessary

Add automated tests for the queue and sync logic where practical.

---

# 21. GEMINI COPILOT

Create a side-panel assistant called:

## Arogya Copilot

Its answers must be grounded in structured application state.

Questions:

- "Why is PHC-17 at risk?"
- "Why not transfer from PHC-8? It is closer."
- "Which facilities need intervention first?"
- "Explain the ORS recommendation."
- "Summarize Kurnool district."
- "Explain this in Telugu."

Backend should first gather structured evidence.

Then Gemini turns that evidence into human-readable text.

Prompt Gemini to:
- never invent unavailable quantities
- never alter numeric predictions
- cite/mention the values passed into it
- distinguish simulations from real observed data
- say when information is unavailable

Provide fallback deterministic templates when no Gemini key is present.

---

# 22. UI / UX

The application should look like a serious operational public-health tool.

Not:
- gaming UI
- crypto UI
- neon gradient dashboard
- generic AI landing page

Visual tone:
- clean
- calm
- trustworthy
- professional
- modern
- data-dense but readable

Use responsive design.

---

# 23. REQUIRED PAGES

## `/`
Concise product landing/demo entry.

Show:
- one-line mission
- current national/demo health status
- "Enter Command Center"

Do not waste excessive engineering time on marketing animations.

---

## `/command-center`

Primary map/dashboard.

Show:
- state/district filters
- PHCs
- color-coded future risk
- current alerts
- medicines
- beds
- footfall
- staffing/service capacity

Critical:
Map color should allow switching between:

- current status
- +3 day forecast
- +7 day forecast

This enables the key "everything looks green today, future turns red" demo.

---

## `/phc/[id]`

PHC digital twin.

Sections:

### Current state
- medicine inventory
- bed availability
- footfall
- attendance
- service capacity

### Forecast
- 1/3/7/14 day

### TruthScore

### Resource risks

### Recommended actions

### Event history

---

## `/alerts`

Prioritized alerts.

Sort by:
- urgency
- affected population
- shortage probability
- resource criticality
- confidence

---

## `/redistribution`

Map + recommendation planner.

Show:
- recipient
- potential donors
- rejected donors
- safe donor quantities
- risk before/after
- distance
- approval workflow

---

## `/simulator`

Emergency simulator.

Must include visual before/after comparison.

---

## `/federation`

Show state-local model training and national aggregation.

---

## `/phc-mode`

Offline-friendly PHC operator experience.

---

## `/model-health`

Optional/internal page showing:
- dataset health
- forecast metrics
- model version
- federated rounds
- assumptions

---

# 24. MAP

Use Google Maps when credentials are available.

Provide a local/demo fallback if Maps key is unavailable.

Each PHC marker must support:

- current health
- future health
- resource-specific risk

Clicking marker should show:

```text
PHC name
District
Current stock health
7-day shortage risk
Beds
Footfall
Service capacity
TruthScore
```

Do not make the application unusable without Google Maps credentials.

---

# 25. ALERT PRIORITIZATION

Create an explainable priority score.

Possible factors:
- stock-out probability
- resource criticality
- estimated affected patients
- time to shortage
- confidence
- lack of safe nearby alternatives

Expose why the alert ranks highly.

Avoid unexplained black-box ranking.

---

# 26. API DESIGN

Create typed/documented endpoints approximately for:

```text
GET /states
GET /districts
GET /phcs
GET /phcs/{id}

GET /phcs/{id}/inventory
GET /phcs/{id}/footfall
GET /phcs/{id}/beds
GET /phcs/{id}/attendance
GET /phcs/{id}/capacity

GET /phcs/{id}/forecasts
GET /phcs/{id}/truth-score

GET /alerts

POST /inventory/events
POST /inventory/reconcile

POST /redistribution/recommend
POST /redistribution/{id}/approve
POST /redistribution/{id}/reject

POST /simulations
GET /simulations/{id}

POST /federation/train-round
GET /federation/status

POST /copilot/query
```

Use proper validation.

Return structured errors.

Generate OpenAPI docs.

---

# 27. EXPLAINABILITY

Every important recommendation should answer:

### WHAT?
What is predicted?

### WHEN?
When is it expected?

### WHY?
What signals contribute?

### CONFIDENCE?
How certain are we?

### ACTION?
What intervention is recommended?

### COUNTERFACTUAL?
What happens if we do nothing?

### DONOR SAFETY?
What happens to donor facilities?

Example:

```text
ORS shortage risk: 92%

Expected:
4.4 days

Primary drivers:
+38% fever-linked footfall
+21% recent ORS consumption velocity
8-day replenishment lead time

Data TruthScore:
91/100

No action:
estimated shortage 460 packets

Recommended:
PHC-B → 380
PHC-C → 220

After intervention:
recipient risk 7%

Donor B:
7% → 9%

Donor C:
4% → 8%
```

---

# 28. DEMO MODE

Create a single control:

## START JUDGE DEMO

It resets application state to the deterministic hero dataset.

Provide a clear demo sequence.

### Scene 1

Command center currently appears mostly green.

Highlight PHC-A.

Say via UI:

"Current stock appears healthy."

---

### Scene 2

Switch map:

`TODAY → +5 DAYS`

PHC-A turns red.

Show:

```text
ORS stock-out probability: >90%
```

---

### Scene 3

Open PHC.

Show:
- TruthScore
- demand forecast
- shortage date
- affected resource demand

---

### Scene 4

Click:

`FIND SAFE REDISTRIBUTION`

System should initially show naive nearest donor option as rejected because donor risk becomes unsafe.

Then optimized split transfer.

---

### Scene 5

Before/after:

```text
Recipient risk
92% → 7%

Donor B
7% → 9%

Donor C
5% → 8%
```

Display:

> We don't solve one village's shortage by creating another.

---

### Scene 6

Run:

`DENGUE +250%`

Network develops cascading failures.

---

### Scene 7

Click:

`OPTIMIZE RESPONSE`

Show failures before and after intervention.

---

### Scene 8

Show federated-learning screen.

Emphasize:
- state-local training
- zero raw row sharing
- aggregated updates

---

### Scene 9

Show offline PHC mode.

Record transaction offline.

Reconnect.

Show synchronization.

---

# 29. TESTING

Do not consider work complete without tests.

At minimum test:

## TruthScore
- stale records lower score
- recent reconciliation raises score
- anomalous inventory lowers score

## Shadow demand
- zero inventory + historical demand must not produce zero predicted demand merely because dispensing becomes zero

## Forecast
- forecast API produces expected horizons
- no negative demand

## Redistribution
- donor safety floor
- donor cannot donate more than safe quantity
- cold-chain constraints if modelled
- cross-district fallback
- unsafe nearest donor rejected
- split donor solution succeeds

## Simulation
- demand surge increases load
- interventions improve or maintain target risk metrics
- calculations deterministic under seeded data

## Federated learning
- local datasets remain separate
- aggregation combines model parameters/updates, not raw rows

## Offline queue
- events persist locally
- queued events synchronize
- duplicate events remain idempotent

## API
- validation
- error states
- happy path

## Frontend
Test critical flows rather than trivial render snapshots.

---

# 30. QUALITY GATES

Before declaring completion run:

- formatting
- lint
- type checking
- unit tests
- integration tests
- production build
- database migrations
- seed script
- critical E2E smoke flow

Fix failures.

Do not knowingly leave broken tests.

---

# 31. SECURITY / SAFETY

Prototype security requirements:

- validate all API input
- no secrets committed
- `.env.example`
- dependency-safe patterns
- no arbitrary code execution
- sanitize user-generated text
- basic rate-limit hooks for AI endpoints
- authorization boundary around transfer approval
- audit log for approvals/rejections
- no real patient data

The README must clearly state:

**ArogyaMesh is a hackathon decision-support prototype and must not be used for real clinical/logistics decisions without independent validation and integration governance.**

---

# 32. OBSERVABILITY

Add structured logs for:
- forecast generation
- inventory sync
- TruthScore updates
- redistribution recommendations
- recommendation approval
- simulator runs
- federated rounds
- Gemini failures/fallbacks

Include request IDs where practical.

---

# 33. PERFORMANCE

The seeded 75–100 PHC environment should feel immediate.

Avoid recomputing expensive model training on every normal page load.

Cache/precompute sensible outputs.

Emergency simulation may execute asynchronously internally, but demo UX should remain responsive.

---

# 34. README

Create an excellent README with:

## What ArogyaMesh does

## Problem

## Key innovation

Explain:

### TruthScore
### Shadow Demand
### Donor-Safe Redistribution
### Federated Learning
### Emergency Simulation

## Architecture

Provide Mermaid diagram.

## Tech stack

## Local setup

One-command preferred:

```bash
docker compose up
```

or clear equivalent.

## Environment variables

## Seed data

## Running tests

## Judge demo walkthrough

## Google Cloud deployment architecture

## Known prototype limitations

## Privacy/safety assumptions

---

# 35. ARCHITECTURE DOCUMENT

Create:

`docs/ARCHITECTURE.md`

Include:

```text
External/PHC sources
       ↓
 ingestion/adapters
       ↓
 operational data store
       ↓
 data trust engine
       ↓
 digital twin
       ↓
 forecasting engine
       ↓
 risk engine
       ↓
 simulation
       ↓
 redistribution optimizer
       ↓
 human approval
```

Federated path separately:

```text
State A data → local model ┐
State B data → local model ├→ FedAvg → national model
State C data → local model ┘
                              ↓
                     updated state models
```

---

# 36. DECISION RECORDS

For major engineering choices, create lightweight docs under:

`docs/decisions/`

Especially document:
- forecasting model choice
- TruthScore formula
- redistribution optimization
- federated-learning design
- offline synchronization approach

Explain trade-offs honestly.

---

# 37. DO NOT DO THESE

Do not:
- add blockchain
- add cryptocurrency
- add facial recognition
- build a generic patient chatbot
- fake federated learning
- claim synthetic simulation outcomes are real medical outcomes
- centralize raw state datasets while calling it federated learning
- let Gemini invent stock numbers
- assume internet is always available
- trust every digital stock figure
- recommend a donor without simulating donor risk
- execute transfers automatically without human approval
- spend most time on landing-page animation
- create dozens of useless dashboards
- hardcode hero scenario values directly in React components
- hide broken features behind static screenshots

---

# 38. HACKATHON SUCCESS CRITERIA

The finished prototype succeeds when a judge can understand within roughly 30 seconds:

> This system predicts shortages before they happen and prevents one facility from being saved at the expense of another.

And within a live demonstration they can see:

1. a PHC looks healthy today;
2. future risk appears;
3. the data's reliability is visible;
4. AI/ML predicts shortage;
5. nearest donor is rejected because transferring too much would make it unsafe;
6. an optimized multi-donor plan is generated;
7. recipient and donor risk before/after is visible;
8. emergency simulation creates cascading failures;
9. optimization reduces failures;
10. multiple states learn through federated training;
11. PHC operation still works offline.

---

# 39. DEFINITION OF DONE

Do not declare the application complete until:

- app starts from documented commands
- database migration works
- deterministic seed works
- APIs work
- frontend is connected to APIs
- critical pages are complete
- TruthScore works
- demand forecasting works
- latent-demand correction works
- redistribution optimization works
- donor risk simulation works
- emergency simulation works
- federated demo works
- offline event queue works
- Gemini integration/fallback works
- tests pass
- production build passes
- README is complete
- demo-reset script works

---

# 40. IMPLEMENTATION ORDER

Implement in this order unless repository constraints justify changing it:

### Phase 1
Foundation
- monorepo
- database
- schema
- migrations
- API
- synthetic generator

### Phase 2
Digital Twin
- inventory
- footfall
- beds
- attendance
- service capacity

### Phase 3
Truth layer
- TruthScore
- reconciliation
- anomalies

### Phase 4
Predictive layer
- latent demand
- demand forecasting
- stock-out risk

### Phase 5
Optimization
- donor selection
- safe transferable quantity
- cross-district redistribution
- approval workflow

### Phase 6
Emergency simulation
- surge model
- cascading network effects
- before/after optimization

### Phase 7
Federated learning
- state-local models
- FedAvg
- status visualization

### Phase 8
Offline PHC client
- IndexedDB
- sync queue
- reconciliation

### Phase 9
Gemini
- grounded explanation
- summaries
- multilingual interface

### Phase 10
Polish
- maps
- judge demo
- accessibility
- responsive UI
- docs
- tests
- deploy configuration

At the completion of every phase:
1. run relevant tests;
2. fix failures;
3. update documentation;
4. verify existing behavior has not regressed.

---

# 41. ENGINEERING BEHAVIOR

While implementing:

- Inspect before editing.
- Reuse existing patterns where sensible.
- Prefer small coherent modules.
- Keep domain logic outside React components.
- Keep ML calculations outside UI.
- Never silently swallow exceptions.
- Avoid duplicated business logic.
- Prefer typed interfaces/contracts.
- Keep synthetic demo behavior reproducible.
- Comment the reason for non-obvious algorithms, not obvious syntax.
- Do not leave TODOs for core hackathon features.
- If an external Google service cannot run locally, create a real adapter interface plus a functional local implementation.
- Whenever simplifying an algorithm, document the assumption.

If something is broken, diagnose and repair it rather than bypassing the test or removing the feature.

---

# 42. FINAL HANDOFF

At the end provide:

## Implemented
Brief feature list.

## Architecture
Important components and paths.

## How to run
Exact commands.

## How to run the judge demo
Exact sequence.

## Tests
Commands and results.

## Environment variables
Required vs optional.

## Remaining limitations
Be explicit.

## Deployment
Recommended Google Cloud deployment steps.

Then stop.

The goal is not merely to generate code.

The goal is to leave behind a **working, explainable, reproducible hackathon prototype that I can demonstrate confidently to judges.**