# Numerical models

Operational demand uses a 14-day mean following stock-out censoring correction. The last 28 in-stock days estimate dispensing/footfall ratio; missing-stock days use that ratio times observed footfall. This explicitly prevents stock-outs teaching zero demand. It is not a disease-specific causal model. No-uncensored-history cases require external priors in production.

Risk is the survival function of a normal cumulative-demand approximation. Standard deviation is `sigma * sqrt(horizon) + mean * horizon * (0.07 + (100 - TruthScore)/250)`. The second term represents correlated error and data uncertainty. Risk values are model probabilities, not calibrated real-world frequencies. A normal approximation is a transparent prototype choice, not an accuracy claim.

Rolling one-day evaluation trains only on earlier observations and evaluates the final 28 days of uncensored observations. The federated model uses the final 18 days per facility as holdout. Neither evaluation establishes clinical validity. Forecaster confidence is a coefficient-of-variation diagnostic, not empirical coverage.

Footfall uses a trailing 14-day mean with an explicitly assumed ±15% range. Staff throughput is the minimum of doctors×80, nurses×60, pharmacists×160 patients/day. Beds use constant arrivals at 1.8% of footfall and a four-day average stay. These assumptions require validation.
