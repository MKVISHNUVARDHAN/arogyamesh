# Recovery — 30 September 2026

Moved the existing ArogyaMesh directory intact from the unrelated Vighnaharta repository to the sibling `projects/arogyamesh` folder. No game files changed. There was no separate ArogyaMesh Git history. The baseline `pytest -q` found no tests; the frontend referenced missing dashboard and stylesheet modules. Installed Node dependencies were preserved.

| Capability | Recovered state | Next acceptance check |
|---|---|---|
| Project, Python API, Node dependency install | Partial | Both servers start |
| PostgreSQL, migrations, Docker | Partial portable ORM; SQLite schema seeded | Add deployment files; verify portable schema |
| 3 states, 9 districts, 81 PHCs, 20 medicines, 90 days | Implemented; seed ran | Dataset assertions |
| Inventory, footfall, beds, attendance, service capacity | Backend implemented | API integration and UI |
| TruthScore, freshness, anomalies, reconciliation | Backend implemented | Score invariants and transactions |
| Shadow demand, forecasts, risk, intervals | Backend implemented | Censoring, horizon, confidence tests |
| Donor search, reserves, split/cross-district plan | Pipeline exercised | Nearest-donor fix; safety regression tests |
| Human approval, dispatch, receipt, audit | Implemented, untested | Permission, stale-plan, conservation tests |
| Emergency scenarios and cascades | Implemented, untested | Determinism and improvement tests |
| State-local training, weighted FedAvg | Implemented, untested | Parameter aggregation and local datasets |
| IndexedDB queue and service worker | Partial | Operator UI, sync/conflicts, browser offline test |
| Copilot | Evidence adapter and fallback | Question routing, district context and UI |
| Required pages, map, judge demo | Missing dashboard | Build all connected views |
| Model health | Backend implemented | UI and evaluated metrics |
| Tests, README, architecture, decisions | Missing | Complete quality gates |

See README and test results for final verified state. Initial classifications above are retained as recovery evidence, not current completion claims.
