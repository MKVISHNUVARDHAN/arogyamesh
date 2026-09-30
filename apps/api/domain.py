import math
import uuid

import numpy as np
from sqlalchemy import select

from apps.api.db import Batch, District, History, Inventory, Medicine, PHC, Plan, now
from services.ml.engine import capacity, distance, forecast, risk, safety_stock


def warm_resources(session, medicine_id=None):
    """Request-local input preload avoids thousands of repeated snapshot queries."""

    def rows(model):
        query = select(model)
        if medicine_id:
            query = query.where(model.medicine_id == medicine_id)
        return session.scalars(query).all()

    batches = {}
    for batch in rows(Batch):
        batches.setdefault((batch.phc_id, batch.medicine_id), []).append(batch)
    session.info["resources"] = {
        "inventory": {(x.phc_id, x.medicine_id): x for x in rows(Inventory)},
        "history": {(x.phc_id, x.medicine_id): x for x in rows(History)},
        "batches": batches,
        "medicines": {x.id: x for x in session.scalars(select(Medicine)).all()},
        "facilities": {x.id: x for x in session.scalars(select(PHC)).all()},
        "districts": {x.id: x for x in session.scalars(select(District)).all()},
    }


def inventory_forecast(session, pid, mid, stamp=None, horizon=7):
    stamp = stamp or now()
    cache = session.info.get("resources", {})
    inv = cache.get("inventory", {}).get((pid, mid)) or session.get(Inventory, (pid, mid))
    hist = cache.get("history", {}).get((pid, mid)) or session.get(History, (pid, mid))
    batches = cache.get("batches", {}).get((pid, mid))
    if batches is None:
        batches = session.scalars(
            select(Batch).where(Batch.phc_id == pid, Batch.medicine_id == mid)
        ).all()
    # Conservatively exclude anything that expires within the planning horizon.
    usable = min(
        inv.quantity,
        sum(b.quantity for b in batches if (b.expiry - stamp).total_seconds() >= horizon * 86400),
    )
    result = forecast(inv, hist.rows, usable, stamp)
    med = cache.get("medicines", {}).get(mid) or session.get(Medicine, mid)
    result["name"] = med.name
    return result


def facility(session, phc, full=False):
    cache = session.info.get("resources", {})
    district = cache.get("districts", {}).get(phc.district_id) or session.get(District, phc.district_id)
    hist_obj = cache.get("history", {}).get((phc.id, "ors")) or session.get(History, (phc.id, "ors"))
    hist = hist_obj.rows
    footfall = float(np.mean([x["footfall"] for x in hist[-14:]]))
    f = inventory_forecast(session, phc.id, "ors")
    cap = capacity(phc, footfall)
    cap["forecast"] = [
        {
            "days": days,
            "patients": round(footfall * days),
            "capacity": round(cap["throughput"] * days),
            "expected_overflow": round(cap["overflow"] * days),
            "score": cap["score"],
        }
        for days in [1, 3, 7, 14]
    ]
    result = {
        "id": phc.id,
        "name": phc.name,
        "district_id": district.id,
        "district": district.name,
        "state_id": district.state_id,
        "lat": phc.lat,
        "lon": phc.lon,
        "population": phc.population,
        "connectivity": phc.connectivity,
        "cold_chain": phc.cold_chain,
        "ors": f,
        "capacity": cap,
        "beds": {
            "total": phc.beds,
            "occupied": phc.occupied,
            "available": phc.beds - phc.occupied,
            "forecast": [
                {
                    "days": d,
                    "admissions": round(footfall * 0.018 * d, 1),
                    "discharges": round(phc.occupied * (1 - math.exp(-d / 4)), 1),
                    "occupancy": round(
                        phc.occupied * math.exp(-d / 4)
                        + footfall * 0.018 * 4 * (1 - math.exp(-d / 4)),
                        1,
                    ),
                }
                for d in [1, 3, 7, 14]
            ],
        },
        "footfall": [
            {
                "days": d,
                "patients": round(footfall * d),
                "lower": round(footfall * d * 0.85),
                "upper": round(footfall * d * 1.15),
            }
            for d in [1, 3, 7, 14]
        ],
    }
    if full:
        result["inventory"] = [
            inventory_forecast(session, phc.id, m)
            for m in session.scalars(select(Medicine.id)).all()
        ]
        result["history"] = hist
    return result


def recommend(session, recipient_id, mid, horizon=7, persist=True):
    cache = session.info.get("resources")
    if not cache:
        warm_resources(session, mid)
        cache = session.info.get("resources", {})
    recipient = cache.get("facilities", {}).get(recipient_id) or session.get(PHC, recipient_id)
    med = cache.get("medicines", {}).get(mid) or session.get(Medicine, mid)
    target = inventory_forecast(session, recipient_id, mid, horizon=horizon)
    demand, sigma, score = target["daily_demand"], target["sigma"], target["truth"]["score"]
    needed = max(0, safety_stock(demand, sigma, horizon, score) - target["usable"])
    remaining = needed
    district = cache.get("districts", {}).get(recipient.district_id) or session.get(District, recipient.district_id)
    candidates = session.scalars(
        select(PHC)
        .join(District)
        .where(District.state_id == district.state_id, PHC.id != recipient_id)
    ).all()
    candidates.sort(key=lambda p: (p.district_id != recipient.district_id, distance(recipient, p)))
    donors, rejected = [], []
    for donor in candidates:
        f = inventory_forecast(session, donor.id, mid, horizon=horizon)
        minimum = safety_stock(f["daily_demand"], f["sigma"], horizon, f["truth"]["score"], 0.10)
        safe = max(0, math.floor(f["usable"] - minimum))
        naive = risk(
            f["usable"] - needed, f["daily_demand"], f["sigma"], horizon, f["truth"]["score"]
        )
        reason = None
        if med.cold_chain and (not donor.cold_chain or not recipient.cold_chain):
            reason, safe = "Cold-chain compatibility unavailable", 0
        elif f["truth"]["score"] < 70:
            reason, safe = "TruthScore below 70; reconcile before donation", 0
        elif safe < needed:
            reason = "Full requested transfer would breach donor safety reserve"
        if reason:
            rejected.append(
                {
                    "id": donor.id,
                    "name": donor.name,
                    "naive_quantity": needed,
                    "naive_risk": naive,
                    "safe_quantity": safe,
                    "reason": reason,
                }
            )
        q = min(remaining, safe)
        if q > 0:
            donor_dist = cache.get("districts", {}).get(donor.district_id) or session.get(District, donor.district_id)
            donors.append(
                {
                    "id": donor.id,
                    "name": donor.name,
                    "district": donor_dist.name,
                    "cross_district": donor.district_id != recipient.district_id,
                    "quantity": q,
                    "safe_quantity": safe,
                    "risk_before": risk(
                        f["usable"], f["daily_demand"], f["sigma"], horizon, f["truth"]["score"]
                    ),
                    "risk_after": risk(
                        f["usable"] - q, f["daily_demand"], f["sigma"], horizon, f["truth"]["score"]
                    ),
                    "stock_after": f["usable"] - q,
                    "safety_floor": minimum,
                    "distance_km": round(distance(recipient, donor), 1),
                    "version": f["version"],
                }
            )
            remaining -= q
        if remaining == 0:
            break
    payload = {
        "id": str(uuid.uuid4()),
        "recipient_id": recipient_id,
        "recipient_name": recipient.name,
        "medicine_id": mid,
        "horizon": horizon,
        "required": needed,
        "unfilled": remaining,
        "recipient_version": target["version"],
        "risk_before": risk(target["usable"], demand, sigma, horizon, score),
        "risk_after": risk(target["usable"] + needed - remaining, demand, sigma, horizon, score),
        "donors": donors,
        "rejected": rejected,
        "status": "PROPOSED",
        "assumptions": "Same-state, same-district-first greedy distance objective; instant simulated arrival; FEFO; expiry excluded within horizon; donor risk <=10%.",
    }
    if persist:
        session.add(Plan(id=payload["id"], payload=payload))
    return payload


def take_batches(session, pid, mid, quantity, minimum_life_days=0):
    from datetime import timedelta

    batches = session.scalars(
        select(Batch)
        .where(
            Batch.phc_id == pid,
            Batch.medicine_id == mid,
            Batch.quantity > 0,
            Batch.expiry > now() + timedelta(days=minimum_life_days),
        )
        .order_by(Batch.expiry)
        .with_for_update()
    ).all()
    if sum(b.quantity for b in batches) < quantity:
        raise ValueError("Insufficient unexpired batch stock")
    allocations = []
    for batch in batches:
        q = min(batch.quantity, quantity)
        if q:
            batch.quantity -= q
            quantity -= q
            allocations.append((q, batch.expiry))
        if quantity == 0:
            break
    return allocations
