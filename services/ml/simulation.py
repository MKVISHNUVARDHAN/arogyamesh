import numpy as np
from sqlalchemy import select

from apps.api.db import History, PHC
from apps.api.domain import inventory_forecast, warm_resources
from services.ml.engine import capacity, distance


def simulate(session, district, severity, duration, staffing, event):
    med_id = "paracetamol" if event == "dengue" else "ors" if event == "heatwave" else "salbutamol"
    warm_resources(session, med_id)
    cache_hist = session.info.setdefault("resources", {}).setdefault("history", {})
    if not any(k[1] == "ors" for k in cache_hist):
        for h in session.scalars(select(History).where(History.medicine_id == "ors")).all():
            cache_hist[(h.phc_id, h.medicine_id)] = h

    facilities_cache = session.info.get("resources", {}).get("facilities", {})
    if facilities_cache:
        facilities = sorted(facilities_cache.values(), key=lambda p: p.id)
    else:
        facilities = session.scalars(select(PHC).order_by(PHC.id)).all()

    base = np.array(
        [
            np.mean([r["footfall"] for r in (cache_hist.get((p.id, "ors")) or session.get(History, (p.id, "ors"))).rows[-14:]])
            for p in facilities
        ]
    )
    forecasts = [
        inventory_forecast(
            session,
            p.id,
            med_id,
            horizon=duration,
        )
        for p in facilities
    ]
    initial = np.array([f["usable"] for f in forecasts], dtype=float)
    daily = np.array([f["daily_demand"] for f in forecasts])
    affected = np.array([p.district_id == district for p in facilities])
    neighbors = [
        min((j for j in range(len(facilities)) if i != j), key=lambda j: distance(p, facilities[j]))
        for i, p in enumerate(facilities)
    ]

    def run(intervene):
        stocks = initial.copy()
        beds = np.array([p.occupied for p in facilities], dtype=float)
        timeline, transfers = [], []
        total_unmet = 0.0
        for day in range(1, duration + 1):
            surge = 1 + affected * severity * min(1, day / 4)
            foot = base * surge
            caps = np.array(
                [
                    capacity(p, foot[i], staffing if affected[i] else 1)["throughput"]
                    for i, p in enumerate(facilities)
                ]
            )
            overflow = np.maximum(0, foot - caps)
            routed = np.zeros(len(facilities))
            for i, amount in enumerate(overflow):
                routed[neighbors[i]] += amount * 0.4
            foot += routed - overflow * 0.4
            demand = daily * (foot / base)
            if intervene:
                # Shared stock ledger prevents donors being counted more than once.
                for i in np.where(stocks < demand * 2)[0]:
                    need = max(0, demand[i] * 2 - stocks[i])
                    donor_order = sorted(
                        range(len(facilities)), key=lambda j: distance(facilities[i], facilities[j])
                    )
                    for j in donor_order:
                        if i == j or forecasts[j]["truth"]["score"] < 70:
                            continue
                        # Reserve remaining scenario demand plus 25% uncertainty margin.
                        reserve = demand[j] * (duration - day + 1) * 1.25
                        q = min(need, max(0, stocks[j] - reserve))
                        if q > 0:
                            stocks[j] -= q
                            stocks[i] += q
                            need -= q
                            transfers.append(
                                {
                                    "day": day,
                                    "donor": facilities[j].id,
                                    "recipient": facilities[i].id,
                                    "quantity": round(q, 1),
                                }
                            )
                        if need < 0.01:
                            break
            unmet = np.maximum(0, demand - stocks)
            total_unmet += float(unmet.sum())
            stocks = np.maximum(0, stocks - demand)
            beds = beds * 0.75 + foot * 0.018
            medicine_fail = unmet > 0
            bed_fail = beds > np.array([p.beds for p in facilities])
            staff_fail = foot > caps
            timeline.append(
                {
                    "day": day,
                    "medicine_failures": int(medicine_fail.sum()),
                    "bed_failures": int(bed_fail.sum()),
                    "capacity_failures": int(staff_fail.sum()),
                    "critical_failures": int((medicine_fail | bed_fail | staff_fail).sum()),
                    "unmet_units": round(float(unmet.sum()), 1),
                    "overflow_patients": round(float(np.maximum(0, foot - caps).sum()), 1),
                    "spillover_patients": round(float(routed.sum()), 1),
                }
            )
        return {
            "timeline": timeline,
            "unmet_units": round(total_unmet, 1),
            "critical_failures": timeline[-1]["critical_failures"],
            "transfers": transfers,
        }

    return {
        "scenario": {
            "event": event,
            "district": district,
            "severity": severity,
            "duration": duration,
            "staffing_multiplier": staffing,
        },
        "before": run(False),
        "after": run(True),
        "label": "Synthetic simulation, not measured clinical outcomes",
        "assumptions": "40% of service overflow routes once to nearest neighbor per day; 1.8% admissions; 25% daily discharges. Medicine transfers preserve remaining donor demand +25%. No staff or bed transfers.",
    }
