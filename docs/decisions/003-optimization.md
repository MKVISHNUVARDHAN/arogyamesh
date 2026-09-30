# Donor-safe planning

The objective is a lexicographic greedy distance policy: same district first, then the nearest same-state facilities. Safe quantity equals usable stock minus the 90th percentile of horizon demand. The recipient target uses the 91st percentile, producing risk below 9%. A donor must have TruthScore >=70 and compatible cold-chain infrastructure when required. Full-quantity counterfactuals are retained as rejected alternatives even if a partial safe contribution is selected.

This is not a globally optimal vehicle-routing solver. Travel cost is straight-line Haversine distance. No real roads, transport capacity, warehouses or interstate permissions are modeled. Simulated arrival is instantaneous for risk comparison. Dispatch only draws batches surviving the horizon, in FEFO order, and receipt preserves original expiry dates.

Approval does not mutate inventory. Dispatch debits donors into an in-transit plan; receipt credits recipients. Every step requires the district demo role and is audited. Live versions and risks are checked again at approval and dispatch. A changed plan fails explicitly rather than using stale recommendations. PostgreSQL row locks provide cross-request serialization; SQLite is for a single local demo process.

Emergency optimization uses a shared stock ledger and remaining-scenario reserve plus 25% per donor. It conservatively moves stock only; bed/staff bottlenecks may remain even when medicine failures improve. The UI reports all measures separately.
