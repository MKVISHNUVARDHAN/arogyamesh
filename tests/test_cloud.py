from services.ml.federation import load_state, train_round


def test_cloud_federation_reads_state_local_persisted_data(session, monkeypatch):
    def deny_npz(*args, **kwargs):
        raise AssertionError("Serverless training must not depend on instance-local files")

    monkeypatch.setattr("numpy.load", deny_npz)
    for state in ["AP", "KA", "TG"]:
        x, y = load_state(state, session)
        assert len(x) == len(y) == 27 * 90
    result = train_round({}, session)
    assert result["round"] == 1
    assert result["raw_rows_transferred"] == 0
    assert len(result["states"]) == 3
