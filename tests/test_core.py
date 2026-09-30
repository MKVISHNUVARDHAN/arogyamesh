from datetime import timedelta

import numpy as np
import pytest
from sqlalchemy import select

from apps.api.db import Batch, History, Inventory, PHC, now
from apps.api.domain import inventory_forecast, recommend
from services.ml.engine import shadow, truth
from services.ml.federation import aggregate, train_round
from services.ml.simulation import simulate


def test_seed(session):
    assert len(session.scalars(select(PHC)).all()) == 81
    assert len(session.scalars(select(Inventory)).all()) == 1620
    assert len(session.get(History, ("PHC-001", "ors")).rows) == 90


def test_truth_components(session):
    inv = session.get(Inventory, ("PHC-001", "ors"))
    stamp = now()
    baseline = truth(inv, stamp)["score"]
    inv.updated_at -= timedelta(days=5)
    assert truth(inv, stamp)["score"] < baseline
    inv.reconciled_at -= timedelta(days=20)
    older = truth(inv, stamp)["score"]
    inv.reconciled_at = stamp
    assert truth(inv, stamp)["score"] > older
    score = truth(inv, stamp)["score"]
    inv.anomaly = 1
    assert truth(inv, stamp)["score"] < score


def test_shadow_never_learns_zero_stock_as_zero_demand():
    rows = [{"available": True, "dispensed": 104, "footfall": 100} for _ in range(20)]
    rows += [{"available": False, "dispensed": 0, "footfall": 120} for _ in range(7)]
    estimated = shadow(rows)
    assert estimated[-1] == pytest.approx(124.8)


def test_forecast_horizons_and_truth_uncertainty(session):
    f = inventory_forecast(session, "PHC-001", "ors")
    assert {1, 3, 7, 14}.issubset({h["days"] for h in f["horizons"]})
    assert all(h["predicted_demand"] >= 0 and 0 <= h["risk"] <= 1 for h in f["horizons"])
    assert 4 <= f["days_cover"] <= 5
    assert next(h for h in f["horizons"] if h["days"] == 5)["risk"] > 0.9
    inv = session.get(Inventory, ("PHC-001", "ors"))
    inv.anomaly = 0.9
    low = inventory_forecast(session, "PHC-001", "ors")
    assert low["horizons"][-1]["upper"] > f["horizons"][-1]["upper"]


def test_split_cross_district_and_nearest_rejected(session):
    plan = recommend(session, "PHC-001", "ors", persist=False)
    assert plan["risk_before"] > 0.9 and plan["risk_after"] < 0.1
    assert plan["unfilled"] == 0 and len(plan["donors"]) >= 2
    assert plan["rejected"][0]["id"] == "PHC-002"
    assert plan["rejected"][0]["naive_risk"] > 0.1
    assert any(d["cross_district"] for d in plan["donors"])
    for d in plan["donors"]:
        assert d["quantity"] <= d["safe_quantity"]
        assert d["stock_after"] >= d["safety_floor"]
        assert d["risk_after"] <= 0.1


def test_expiry_and_cold_chain(session):
    batch = session.scalar(
        select(Batch).where(Batch.phc_id == "PHC-001", Batch.medicine_id == "ors")
    )
    batch.expiry = now() - timedelta(days=1)
    assert inventory_forecast(session, "PHC-001", "ors")["usable"] == 0
    phc = session.get(PHC, "PHC-004")
    assert not phc.cold_chain
    inv = session.get(Inventory, (phc.id, "insulin"))
    inv.quantity = 0
    plan = recommend(session, phc.id, "insulin", persist=False)
    assert not plan["donors"]
    assert all("Cold-chain" in r["reason"] for r in plan["rejected"])


def test_simulation_cascade_determinism_improvement(session):
    base = simulate(session, "AP-1", 0, 14, 1, "dengue")
    surge = simulate(session, "AP-1", 2.5, 14, 0.75, "dengue")
    again = simulate(session, "AP-1", 2.5, 14, 0.75, "dengue")
    assert surge == again
    assert surge["before"]["unmet_units"] > base["before"]["unmet_units"]
    assert surge["after"]["unmet_units"] < surge["before"]["unmet_units"]
    assert surge["after"]["critical_failures"] <= surge["before"]["critical_failures"]
    assert surge["before"]["timeline"][-1]["spillover_patients"] > 0


def test_federation_parameter_aggregation(factory):
    assert aggregate([{"samples": 1, "weights": [1, 2]}, {"samples": 3, "weights": [3, 4]}]) == [
        2.5,
        3.5,
    ]
    result = train_round({})
    assert len(result["states"]) == 3 and result["raw_rows_transferred"] == 0
    assert result["round"] == 1
    for state in ["AP", "KA", "TG"]:
        with np.load(f"data/synthetic/{state}.npz") as data:
            assert len(data["y"]) == 27 * 90
    assert all(s["mae_after"] < s["mae_before"] for s in result["states"])


def test_api_validation_and_stock_idempotency(client):
    assert client.get("/phcs/nonexistent").status_code == 404
    assert client.post("/inventory/events", json={}).status_code == 403
    assert (
        client.post("/inventory/events", json={}, headers={"X-Demo-Role": "operator"}).status_code
        == 422
    )
    stock = client.get("/phcs/PHC-003/inventory").json()[0]
    event = {
        "id": "test-event-unique",
        "phc_id": "PHC-003",
        "medicine_id": stock["medicine_id"],
        "kind": "DISPENSE",
        "quantity": 50,
        "version": stock["version"],
        "timestamp": now().isoformat(),
    }
    headers = {"X-Demo-Role": "operator"}
    first = client.post("/inventory/events", json=event, headers=headers)
    assert first.status_code == 200, first.text
    assert first.json()["quantity"] == stock["recorded"] - 50
    assert client.post("/inventory/events", json=event, headers=headers).json()["duplicate"]
    event["id"] = "test-event-conflict"
    assert client.post("/inventory/events", json=event, headers=headers).status_code == 409


def test_approval_and_conservation(client):
    plan = client.post("/redistribution/recommend", json={}).json()
    base = f"/redistribution/{plan['id']}"
    assert client.post(base + "/approve").status_code == 403
    headers = {"X-Demo-Role": "district"}
    recipient_before = next(
        x for x in client.get("/phcs/PHC-001/inventory").json() if x["medicine_id"] == "ors"
    )["recorded"]
    for action in ["approve", "dispatch", "complete"]:
        response = client.post(base + "/" + action, headers=headers)
        assert response.status_code == 200, response.text
    total = sum(d["quantity"] for d in plan["donors"])
    assert (
        next(x for x in client.get("/phcs/PHC-001/inventory").json() if x["medicine_id"] == "ors")[
            "recorded"
        ]
        == recipient_before + total
    )
    assert client.post(base + "/complete", headers=headers).status_code == 200
    assert (
        next(x for x in client.get("/phcs/PHC-001/inventory").json() if x["medicine_id"] == "ors")[
            "recorded"
        ]
        == recipient_before + total
    )
