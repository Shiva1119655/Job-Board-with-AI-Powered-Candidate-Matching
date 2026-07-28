import sys
from pathlib import Path

# Ensure `files/` is on sys.path so imports like `backend.main` resolve
ROOT = Path(__file__).resolve().parent
FILES_DIR = ROOT / "files"
if str(FILES_DIR) not in sys.path:
    sys.path.insert(0, str(FILES_DIR))

from backend.main import app

# Alias commonly used by some deployments
asgi_app = app

if __name__ == "__main__":
    import uvicorn
    # Use import string for reload to allow auto-reload to work correctly
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
