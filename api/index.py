import sys
from pathlib import Path

# Add project root to sys.path so apps and services modules are resolvable
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from apps.api.main import app  # noqa: E402, F401
