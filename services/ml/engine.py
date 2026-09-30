import math
from datetime import timedelta
from statistics import NormalDist

import numpy as np

VERSION = "seasonal-shadow-v1"


def truth(inv, stamp):
    age = max(0, (stamp - inv.updated_at).total_seconds() / 3600)
    recon = max(0, (stamp - inv.reconciled_at).total_seconds() / 86400)
    sync = max(0, (stamp - inv.synced_at).total_seconds() / 3600)
    components = {
        "freshness": 30 * math.exp(-age / 96),
        "reconciliation": 25 * math.exp(-recon / 20),
        "eventConsistency": 20 * (1 - inv.anomaly),
        "syncCompleteness": 15 * math.exp(-max(sync, inv.lag_hours) / 72),
        "anomalyAdjustment": 10 * (1 - inv.anomaly) if inv.quantity >= 0 else 0,
    }
    score = round(sum(components.values()), 1)
    reasons = [
        f"Last physical reconciliation {recon:.1f} days ago",
        f"Last record {age:.1f} hours ago",
        f"Offline synchronization lag {inv.lag_hours:.1f} hours",
    ]
    if inv.anomaly:
        reasons.append("Unexplained stock adjustment or event inconsistency")
    return {
        "score": score,
        "level": "high" if score >= 80 else "medium" if score >= 60 else "low",
        "components": {k: round(v, 1) for k, v in components.items()},
        "reasons": reasons,
    }


def shadow(rows):
    visible = [r for r in rows if r["available"]]
    recent = visible[-28:]
    ratio = sum(r["dispensed"] for r in recent) / max(1, sum(r["footfall"] for r in recent))
    return np.asarray(
        [r["dispensed"] if r["available"] else r["footfall"] * ratio for r in rows], dtype=float
    )


def demand_model(rows):
    y = shadow(rows)
    recent = y[-21:]
    # Weekly mean avoids treating one noisy observation as a trend.
    mean = max(0.1, float(np.mean(recent[-14:])))
    sigma = max(mean * 0.10, float(np.std(recent)))
    return mean, sigma


def risk(stock, daily, sigma, days, score=100):
    # Correlated daily error is deliberately conservative for this small-data prototype.
    uncertainty = max(1, sigma * math.sqrt(days) + daily * days * (0.07 + (100 - score) / 250))
    return min(1.0, max(0.0, 1 - NormalDist(daily * days, uncertainty).cdf(stock)))


def safety_stock(daily, sigma, days, score, threshold=0.09):
    uncertainty = max(1, sigma * math.sqrt(days) + daily * days * (0.07 + (100 - score) / 250))
    return math.ceil(daily * days + NormalDist().inv_cdf(1 - threshold) * uncertainty)


def forecast(inv, rows, usable, stamp):
    confidence = truth(inv, stamp)
    daily, sigma = demand_model(rows)
    score = confidence["score"]
    adjusted = sigma + daily * (100 - score) / 100
    horizon = []
    for days in [1, 3, 5, 7, 14]:
        uncertainty = adjusted * math.sqrt(days) + daily * days * 0.07
        horizon.append(
            {
                "days": days,
                "predicted_demand": round(daily * days, 1),
                "lower": round(max(0, daily * days - 1.645 * uncertainty), 1),
                "upper": round(daily * days + 1.645 * uncertainty, 1),
                "risk": risk(usable, daily, sigma, days, score),
                "remaining": round(max(0, usable - daily * days), 1),
            }
        )
    cover = usable / daily
    estimated = shadow(rows)
    return {
        "medicine_id": inv.medicine_id,
        "recorded": inv.quantity,
        "usable": usable,
        "version": inv.version,
        "source": inv.source,
        "last_update": inv.updated_at.isoformat(),
        "last_sync": inv.synced_at.isoformat(),
        "anomaly_flags": ["Inventory inconsistency"] if inv.anomaly else [],
        "last_reconciliation": inv.reconciled_at.isoformat(),
        "truth": confidence,
        "daily_demand": round(daily, 2),
        "sigma": sigma,
        "days_cover": round(cover, 2),
        "risk": risk(usable, daily, sigma, 7, score),
        "shortage_date": (stamp + timedelta(days=cover)).date().isoformat(),
        "forecast_confidence": round(max(0, 100 * (1 - adjusted / max(daily, 1))), 1),
        "interval_label": "90% model interval; uncalibrated synthetic-data estimate",
        "horizons": horizon,
        "observed_dispensing": rows[-1]["dispensed"],
        "estimated_demand": round(float(estimated[-1]), 1),
        "estimated_unmet": round(max(0, float(estimated[-1]) - rows[-1]["dispensed"]), 1),
        "model_version": VERSION,
    }


def capacity(phc, footfall, staffing=1.0):
    throughput = (
        min(
            phc.staff["doctor"][0] * 80,
            phc.staff["nurse"][0] * 60,
            phc.staff["pharmacist"][0] * 160,
        )
        * staffing
    )
    return {
        "predicted_footfall": round(footfall, 1),
        "throughput": round(throughput, 1),
        "score": round(min(100, throughput / max(1, footfall) * 100), 1),
        "overflow": round(max(0, footfall - throughput), 1),
        "staff": phc.staff,
    }


def distance(a, b):
    lat1, lat2 = math.radians(a.lat), math.radians(b.lat)
    x = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(math.radians(b.lon - a.lon) / 2) ** 2
    )
    return 6371 * 2 * math.asin(min(1, math.sqrt(x)))


def evaluate(rows):
    errors = []
    for cutoff in range(62, len(rows)):
        if rows[cutoff]["available"]:
            prediction, _ = demand_model(rows[:cutoff])
            errors.append(prediction - rows[cutoff]["dispensed"])
    return {
        "samples": len(errors),
        "mae": round(float(np.mean(np.abs(errors))), 3),
        "rmse": round(float(np.sqrt(np.mean(np.square(errors)))), 3),
    }
