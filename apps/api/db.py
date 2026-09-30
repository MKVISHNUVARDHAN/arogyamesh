import os
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from sqlalchemy.pool import NullPool



def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


class State(Base):
    __tablename__ = "states"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str]


class District(Base):
    __tablename__ = "districts"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    state_id: Mapped[str] = mapped_column(ForeignKey("states.id"))
    name: Mapped[str]
    lat: Mapped[float]
    lon: Mapped[float]


class PHC(Base):
    __tablename__ = "phcs"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    district_id: Mapped[str] = mapped_column(ForeignKey("districts.id"))
    name: Mapped[str]
    lat: Mapped[float]
    lon: Mapped[float]
    population: Mapped[int]
    connectivity: Mapped[str]
    cold_chain: Mapped[bool]
    beds: Mapped[int]
    occupied: Mapped[int]
    staff: Mapped[dict] = mapped_column(JSON)


class Medicine(Base):
    __tablename__ = "medicines"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str]
    category: Mapped[str]
    unit: Mapped[str]
    criticality: Mapped[int]
    cold_chain: Mapped[bool]


class Inventory(Base):
    __tablename__ = "inventory"
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.id"), primary_key=True)
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.id"), primary_key=True)
    quantity: Mapped[int]
    version: Mapped[int] = mapped_column(default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime)
    reconciled_at: Mapped[datetime] = mapped_column(DateTime)
    synced_at: Mapped[datetime] = mapped_column(DateTime)
    lag_hours: Mapped[float] = mapped_column(default=0)
    anomaly: Mapped[float] = mapped_column(default=0)
    source: Mapped[str] = mapped_column(default="synthetic-adapter")


class Batch(Base):
    __tablename__ = "batches"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.id"))
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.id"))
    quantity: Mapped[int]
    expiry: Mapped[datetime] = mapped_column(DateTime)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class History(Base):
    __tablename__ = "history"
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.id"), primary_key=True)
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.id"), primary_key=True)
    rows: Mapped[list] = mapped_column(JSON)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.id"))
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.id"))
    kind: Mapped[str]
    quantity: Mapped[int]
    timestamp: Mapped[datetime] = mapped_column(DateTime)
    source: Mapped[str]
    result: Mapped[dict] = mapped_column(JSON)


class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    status: Mapped[str] = mapped_column(default="PROPOSED")
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Run(Base):
    __tablename__ = "runs"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    kind: Mapped[str]
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Audit(Base):
    __tablename__ = "audit"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str]
    action: Mapped[str]
    target: Mapped[str]
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=now)


class Migration(Base):
    __tablename__ = "schema_migrations"
    version: Mapped[int] = mapped_column(Integer, primary_key=True)


url = os.getenv("DATABASE_URL", "sqlite:///./arogyamesh.db")
if (os.getenv("VERCEL") or os.getenv("RENDER")) and url.startswith("sqlite"):
    raise RuntimeError("Production deployment requires a persistent PostgreSQL DATABASE_URL")
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+psycopg://", 1)
elif url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+psycopg://", 1)

is_sqlite = url.startswith("sqlite")
engine_kwargs = {
    "connect_args": {"check_same_thread": False} if is_sqlite else {"prepare_threshold": None},
    "pool_pre_ping": True,
}
if not is_sqlite:
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(url, **engine_kwargs)
Session = sessionmaker(engine, expire_on_commit=False)



def migrate():
    # Version 1 is an additive, portable initial schema migration.
    Base.metadata.create_all(engine)
    with Session.begin() as session:
        if not session.get(Migration, 1):
            session.add(Migration(version=1))
