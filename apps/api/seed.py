from datetime import timedelta
import os
from pathlib import Path

import numpy as np
from sqlalchemy import delete, select

from apps.api.db import (
    Audit,
    Batch,
    District,
    Event,
    History,
    Inventory,
    Medicine,
    PHC,
    Plan,
    Run,
    State,
    now,
)

MEDICINES = [
    ("ors", "Oral rehydration salts", "dehydration"),
    ("paracetamol", "Paracetamol", "fever"),
    ("amoxicillin", "Amoxicillin", "antibiotic"),
    ("azithromycin", "Azithromycin", "antibiotic"),
    ("metformin", "Metformin", "diabetes"),
    ("amlodipine", "Amlodipine", "cardiac"),
    ("iron", "Iron / folic acid", "maternal"),
    ("zinc", "Zinc", "dehydration"),
    ("cetirizine", "Cetirizine", "respiratory"),
    ("salbutamol", "Salbutamol", "respiratory"),
    ("insulin", "Insulin", "diabetes"),
    ("oxytocin", "Oxytocin", "maternal"),
    ("iv-saline", "Normal saline", "dehydration"),
    ("ceftriaxone", "Ceftriaxone", "antibiotic"),
    ("omeprazole", "Omeprazole", "general"),
    ("albendazole", "Albendazole", "general"),
    ("aspirin", "Aspirin", "cardiac"),
    ("losartan", "Losartan", "cardiac"),
    ("glucose", "Dextrose", "general"),
    ("chlorhexidine", "Chlorhexidine", "general"),
]
REGIONS = [
    (
        "AP",
        "Andhra Pradesh",
        [("Kurnool", 15.83, 78.04), ("Nandyal", 15.48, 78.48), ("Anantapur", 14.68, 77.60)],
    ),
    (
        "KA",
        "Karnataka",
        [("Raichur", 16.20, 77.36), ("Ballari", 15.14, 76.92), ("Koppal", 15.35, 76.15)],
    ),
    (
        "TG",
        "Telangana",
        [("Gadwal", 16.23, 77.80), ("Mahabubnagar", 16.74, 77.98), ("Wanaparthy", 16.36, 78.06)],
    ),
]


def seed(session, reset=False):
    has_phcs = bool(session.scalar(select(PHC.id).limit(1)))
    if has_phcs and not reset:
        return
    stamp = now()
    if has_phcs and reset:
        for model in [Audit, Event, Plan, Run]:
            session.execute(delete(model))
        session.execute(delete(Batch).where(~Batch.id.endswith("-1")))
        hero_baseline = {"PHC-001": 800, "PHC-002": 1140, "PHC-010": 1260}
        for pid, qty in hero_baseline.items():
            inv = session.get(Inventory, (pid, "ors"))
            if inv:
                inv.quantity = qty
                inv.version = 1
                inv.updated_at = stamp - timedelta(hours=2)
                inv.reconciled_at = stamp - timedelta(days=1)
                inv.synced_at = stamp - timedelta(hours=1)
                inv.anomaly = 0
                inv.lag_hours = 0
            batch = session.get(Batch, f"{pid}-ors-1")
            if batch:
                batch.quantity = qty
        session.flush()
        return

    rng = np.random.default_rng(42)
    root = Path("data/synthetic")
    if not os.getenv("VERCEL"):
        root.mkdir(parents=True, exist_ok=True)
    session.add_all(
        [
            Medicine(
                id=mid,
                name=name,
                category=category,
                unit="units",
                criticality=5 if mid in ["ors", "insulin"] else 3,
                cold_chain=mid in ["insulin", "oxytocin"],
            )
            for mid, name, category in MEDICINES
        ]
    )
    session.add_all([State(id=s_id, name=s_name) for s_id, s_name, _ in REGIONS])
    session.flush()

    districts_to_add = []
    for state_id, _, districts in REGIONS:
        for d, (district_name, lat, lon) in enumerate(districts):
            did = f"{state_id}-{d + 1}"
            districts_to_add.append(
                District(id=did, state_id=state_id, name=district_name, lat=lat, lon=lon)
            )
    session.add_all(districts_to_add)
    session.flush()

    index = 0
    phcs_to_add = []
    items_to_add = []
    for state_id, _, districts in REGIONS:
        local_x, local_y = [], []
        for d, (district_name, lat, lon) in enumerate(districts):
            did = f"{state_id}-{d + 1}"
            for p in range(9):
                index += 1
                pid = f"PHC-{index:03}"
                base = float(rng.uniform(60, 135))
                staff = {
                    "doctor": [int(rng.choice([1, 2])), 2],
                    "nurse": [int(rng.choice([1, 2, 3])), 3],
                    "pharmacist": [1, 1],
                    "lab technician": [int(rng.choice([0, 1])), 1],
                }
                facility = PHC(
                    id=pid,
                    district_id=did,
                    name=f"{district_name} · {p + 1:02}",
                    lat=lat + float(rng.uniform(-0.16, 0.16)),
                    lon=lon + float(rng.uniform(-0.16, 0.16)),
                    population=int(rng.integers(12000, 40000)),
                    connectivity="intermittent" if index % 7 == 0 else "online",
                    cold_chain=index % 4 != 0,
                    beds=int(rng.integers(6, 15)),
                    occupied=int(rng.integers(2, 6)),
                    staff=staff,
                )
                if index == 1:
                    facility.name = "PHC-A · Kurnool Rural"
                    facility.lat, facility.lon = 15.83, 78.04
                if index == 2:
                    facility.name = "PHC-B · Orvakal"
                    facility.lat, facility.lon = 15.829, 78.041
                if index == 10:
                    facility.name = "PHC-C · Nandyal North"
                phcs_to_add.append(facility)
                for m, (mid, _, _) in enumerate(MEDICINES):
                    demand = float(rng.uniform(7, 30)) if m else float(rng.uniform(40, 90))
                    if m == 0 and index in [1, 2, 10]:
                        demand = {1: 190, 2: 85, 10: 65}[index]
                    rows = []
                    for day in range(90):
                        foot = max(
                            1,
                            round(
                                base * (1 + 0.1 * np.sin(day * 2 * np.pi / 7)) + rng.normal(0, 5)
                            ),
                        )
                        actual = max(
                            1,
                            round(
                                demand * (1 + 0.07 * np.sin(day * 2 * np.pi / 7))
                                + rng.normal(0, demand * 0.035)
                            ),
                        )
                        available = not (index % 11 == 0 and 79 <= day <= 85)
                        rows.append(
                            {
                                "date": (stamp - timedelta(days=90 - day)).date().isoformat(),
                                "footfall": foot,
                                "fever": round(foot * 0.28),
                                "respiratory": round(foot * 0.18),
                                "maternal": round(foot * 0.1),
                                "diabetes": round(foot * 0.15),
                                "available": available,
                                "dispensed": actual if available else 0,
                            }
                        )
                        if m == 0:
                            local_x.append([1.0, foot / 150, np.sin(day * 2 * np.pi / 7)])
                            local_y.append(actual / 200)
                    quantity = round(demand * float(rng.uniform(9, 24)))
                    if m == 0 and state_id == "AP":
                        quantity = round(
                            demand * 7.7
                        )  # limited regional reserves make the split meaningful
                        if index in [1, 2, 10]:
                            quantity = {1: 800, 2: 1140, 10: 1260}[index]
                    stale = index % 13 == 0
                    items_to_add.append(
                        Inventory(
                            phc_id=pid,
                            medicine_id=mid,
                            quantity=quantity,
                            updated_at=stamp - timedelta(hours=100 if stale else 2),
                            reconciled_at=stamp - timedelta(days=12 if stale else 1),
                            synced_at=stamp - timedelta(hours=45 if stale else 1),
                            anomaly=0.65 if stale else 0,
                            lag_hours=40 if stale else 0,
                        )
                    )
                    items_to_add.append(
                        Batch(
                            id=f"{pid}-{mid}-1",
                            phc_id=pid,
                            medicine_id=mid,
                            quantity=quantity,
                            expiry=stamp + timedelta(days=180 + m * 5),
                            received_at=stamp - timedelta(days=5),
                        )
                    )
                    items_to_add.append(History(phc_id=pid, medicine_id=mid, rows=rows))
        # Separate logical datasets; aggregation never receives these rows.
        if not os.getenv("VERCEL"):
            np.savez(root / f"{state_id}.npz", x=np.asarray(local_x), y=np.asarray(local_y))
    session.add_all(phcs_to_add)
    session.flush()
    session.add_all(items_to_add)
    session.flush()
