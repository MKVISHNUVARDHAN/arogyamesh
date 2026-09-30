from datetime import timedelta

from sqlalchemy import select

from apps.api.db import Audit, Batch, Inventory, now
from apps.api.domain import take_batches
from apps.api.evidence import gather


def test_copilot_grounded_district_and_telugu(session):
    evidence, summary = gather(
        session, "PHC-001", "Summarize this district and nearest donor", "English"
    )
    assert evidence["district"]["facilities"] == 9
    assert "Kurnool district" in summary
    assert "PHC-B" in summary
    assert "donor risk" in summary
    _, telugu = gather(session, "PHC-001", "Explain this", "Telugu")
    assert "అధికారి" in telugu


def test_dispatch_excludes_short_lived_batches(session):
    inv = session.get(Inventory, ("PHC-001", "ors"))
    short = Batch(
        id="short-expiry",
        phc_id=inv.phc_id,
        medicine_id=inv.medicine_id,
        quantity=50,
        expiry=now() + timedelta(days=2),
    )
    session.add(short)
    session.flush()
    allocations = take_batches(session, inv.phc_id, inv.medicine_id, 50, 7)
    assert short.quantity == 50
    assert all(expiry > now() + timedelta(days=7) for _, expiry in allocations)


def test_stale_plan_refuses_approval_and_rejection_audits(client, factory):
    plan = client.post("/redistribution/recommend", json={}).json()
    donor = plan["donors"][0]
    with factory.begin() as session:
        session.get(Inventory, (donor["id"], "ors")).version += 1
    headers = {"X-Demo-Role": "district"}
    assert client.post(f"/redistribution/{plan['id']}/approve", headers=headers).status_code == 409
    assert client.post(f"/redistribution/{plan['id']}/reject", headers=headers).status_code == 200
    with factory() as session:
        assert session.scalar(
            select(Audit).where(Audit.target == plan["id"], Audit.action == "REJECTED")
        )
