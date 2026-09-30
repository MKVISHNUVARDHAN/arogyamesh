from apps.api.db import Session, migrate
from apps.api.seed import seed

if __name__ == "__main__":
    migrate()
    with Session.begin() as session:
        seed(session, reset=True)
    print("Seeded 81 PHCs, 20 medicines and 90 days; state datasets written separately.")
