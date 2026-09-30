import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from apps.api.db import Base
from apps.api.main import app, db
from apps.api.seed import seed


@pytest.fixture(scope="module")
def factory(tmp_path_factory):
    engine = create_engine(
        f"sqlite:///{tmp_path_factory.mktemp('db')}/test.db",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    sessions = sessionmaker(engine, expire_on_commit=False)
    with sessions.begin() as session:
        seed(session)
    return sessions


@pytest.fixture
def session(factory):
    with factory() as session:
        yield session
        session.rollback()


@pytest.fixture
def client(factory):
    def test_db():
        with factory.begin() as session:
            yield session

    app.dependency_overrides[db] = test_db
    yield TestClient(app)
    app.dependency_overrides.clear()
