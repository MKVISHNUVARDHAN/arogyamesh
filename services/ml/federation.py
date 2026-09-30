from pathlib import Path

import numpy as np


def load_state(state, session=None):
    if session is None:
        with np.load(Path("data/synthetic") / f"{state}.npz") as data:
            return data["x"], data["y"]
    from sqlalchemy import select
    from apps.api.db import History, PHC, District
    from services.ml.engine import shadow

    # Each worker reads only its own state; no shared raw training dataset.
    histories = session.scalars(
        select(History)
        .join(PHC, History.phc_id == PHC.id)
        .join(District, PHC.district_id == District.id)
        .where(District.state_id == state, History.medicine_id == "ors")
        .order_by(PHC.id)
    ).all()
    x, y = [], []
    for history in histories:
        estimates = shadow(history.rows)
        for day, row in enumerate(history.rows):
            x.append([1.0, row["footfall"] / 150, np.sin(day * 2 * np.pi / 7)])
            y.append(estimates[day] / 200)
    return np.asarray(x), np.asarray(y)


def train_local(state, weights, session=None):
    # Only this local worker opens the state dataset. Returns parameters, counts and metrics.
    x, y = load_state(state, session)
    # Every PHC contributes its last 18 days exclusively to validation.
    held = np.arange(len(y)) % 90 >= 72
    train_x, train_y = x[~held], y[~held]
    w = np.array(weights, dtype=float)
    before = float(np.mean(np.abs(x[held] @ w - y[held])) * 200)
    for _ in range(60):
        w -= 0.08 * (2 / len(train_y)) * train_x.T @ (train_x @ w - train_y)
    return {
        "state": state,
        "weights": w.tolist(),
        "samples": len(train_y),
        "validation_samples": int(held.sum()),
        "mae_before": before,
        "mae_after": float(np.mean(np.abs(x[held] @ w - y[held])) * 200),
    }


def aggregate(updates):
    count = sum(x["samples"] for x in updates)
    return sum(np.asarray(x["weights"]) * x["samples"] / count for x in updates).tolist()


def train_round(previous, session=None):
    weights = previous.get("weights", [0.0, 0.0, 0.0])
    updates = [train_local(s, weights, session) for s in ["AP", "KA", "TG"]]
    global_weights = aggregate(updates)
    # Evaluate redistributed global parameters separately inside each state dataset.
    for update in updates:
        x, y = load_state(update["state"], session)
        held = np.arange(len(y)) % 90 >= 72
        update["global_mae"] = float(np.mean(np.abs(x[held] @ global_weights - y[held])) * 200)
    return {
        "round": previous.get("round", 0) + 1,
        "weights": global_weights,
        "states": updates,
        "raw_rows_transferred": 0,
        "model": "federated-linear-ors",
        "note": "Logical state isolation on one demo host; no differential privacy or secure aggregation. Separate experiment from operational demand model.",
    }
