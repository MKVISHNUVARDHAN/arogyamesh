# Verification — 30 September 2026

Standalone root: `C:/Users/vishnu vardhan/OneDrive/Desktop/projects/arogyamesh`.

## Verified locally

- Recovered source and database preserved; separate Git repository initialized. Vighnaharta game files were not modified.
- Python 3.12 virtual environment installed independently. Exact resolved Python versions are recorded in `requirements.lock.txt`; Node versions in `apps/web/package-lock.json`.
- Initial migration executed twice successfully. All 12 SQLAlchemy table definitions compile for the PostgreSQL dialect. This does not prove a PostgreSQL server deployment.
- Deterministic generator executed; tests assert 81 PHCs, 1,620 inventory resources and 90 daily observations per resource.
- `python -m pytest -q`: 13 tests, covering seed, trust degradation/reconciliation, shadow demand, horizons/uncertainty, five-day hero, safe split/cross-district planning, cold chain, expiry, emergency cascade/improvement, state-local FedAvg, stock idempotency/conflicts, approvals/receipts, stale plans, audit and copilot context.
- `npm test`: 3 IndexedDB tests, including partial synchronization, atomic provisional stock and retained conflict archive.
- Next.js production build, TypeScript, ESLint, Prettier, Ruff lint and Ruff formatting passed.
- `npm audit --omit=dev`: no reported production dependency vulnerabilities at verification time.
- Production API and standalone Next.js server started on localhost, ports 8100 and 3100.
- Desktop and 390px mobile captures inspected. No document-level horizontal overflow. Mobile facility spotlight is accessible.
- OpenAPI contract exported under `packages/shared/openapi.json`.

## Browser coverage

`npm run test:e2e`: **3 passed** against the final production servers (40.3 seconds).

Playwright exercises real connected flows: judge reset, today/future map, PHC twin, donor-safe cross-district plan, officer approval, emergency response, federated training, demo-offline transaction and server synchronization. A separate case disables actual browser networking, reloads the cached operator page, queues an event, and reconnects. Diagnostic coverage includes all-resource alerts, model health, deterministic Copilot and mobile navigation.

## Repairs found by verification

- Test code originally assumed ORS was the first inventory row; it now selects by medicine ID.
- PHC-B seed coordinates now make it the nearest candidate; a full transfer is unsafe while the split is safe.
- Transferred FEFO batches must survive the forecast horizon, preserving the recipient usable-stock assumption.
- Partially acknowledged offline queues preserve provisional stock for pending events.
- Conflicting physical counts can be archived locally before an operator enters a fresh count.
- Alert inputs are preloaded per request to eliminate thousands of repeated database reads.
- Standalone web startup now copies and serves required static assets.

## Not verified here

- Docker/Compose execution and a live PostgreSQL server: neither is installed.
- Google Maps, Gemini Developer API and Vertex calls: no credentials supplied. The no-key local map and English/Telugu explanation fallback are exercised.
- Cloud Run/Cloud SQL deployment, production identity, geographic isolation, secure aggregation and real clinical validity are outside this local synthetic prototype.

One upstream Starlette warning remains in pytest about its `httpx` TestClient compatibility path. It does not fail tests.
