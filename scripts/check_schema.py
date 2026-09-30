"""Validate migrations locally and compile every table for PostgreSQL without a server."""

from sqlalchemy import create_mock_engine
from apps.api.db import Base, migrate

migrate()
migrate()
statements = []
mock = create_mock_engine(
    "postgresql+psycopg://",
    lambda sql, *args, **kwargs: statements.append(str(sql.compile(dialect=mock.dialect))),
)
Base.metadata.create_all(mock)
assert len(statements) == len(Base.metadata.tables)
print(
    f"Local migration is repeatable; {len(statements)} PostgreSQL table definitions compile. This is not a PostgreSQL runtime test."
)
