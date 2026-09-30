"""Cross-platform local runner; stop both children cleanly on Ctrl+C."""

import os
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
os.chdir(root)
if (root / ".env").exists():
    for line in (root / ".env").read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"'))
children = []
try:
    children.append(
        subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "apps.api.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8100",
            ]
        )
    )
    children.append(
        subprocess.Popen([shutil.which("npm") or "npm", "run", "dev"], cwd=root / "apps/web")
    )
    print("ArogyaMesh: http://127.0.0.1:3100 | API docs: http://127.0.0.1:8100/docs", flush=True)
    children[-1].wait()
except KeyboardInterrupt:
    pass
finally:
    for child in children:
        child.terminate()
    for child in children:
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            child.kill()
