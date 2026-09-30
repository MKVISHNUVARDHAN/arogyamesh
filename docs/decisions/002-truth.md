# TruthScore

Score = freshness (30) + reconciliation (25) + event consistency (20) + sync completeness (15) + anomaly adjustment (10).

Freshness decays exponentially over 96 hours; reconciliation over 20 days; synchronization over 72 hours. Sync considers both time since synchronization and age of offline events at ingestion. Adjustment mismatch is relative to the previous stock count, bounded 0–1. Anomalies lower consistency and anomaly components. Scores below 70 disqualify donation.

Batch stock expiring during the planning horizon is excluded from usable quantity. Recorded stock is never silently substituted for usable stock. A reconciliation can simultaneously improve freshness and flag a large discrepancy, so it need not always raise the overall score.

This is an explainable heuristic, not a statistically validated probability that an inventory record is correct.
