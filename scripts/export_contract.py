import json
from pathlib import Path

from apps.api.main import app

Path("packages/shared/openapi.json").write_text(json.dumps(app.openapi(), indent=2))
print("Exported typed API request contract to packages/shared/openapi.json")
