"""
Centralized configuration — reads everything from environment variables
so the same code runs locally and in production without edits.
"""

import os
from pathlib import Path

# Where the trained model files live. Defaults to an "artifacts" folder
# next to this file — override with MODEL_DIR if you store them elsewhere.
ARTIFACTS_DIR = Path(os.environ.get("MODEL_DIR", Path(__file__).parent / "artifacts"))

# Comma-separated list of allowed frontend origins, e.g.:
#   ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
# Falls back to common local dev ports if not set, so local testing
# works out of the box even before you configure this for deployment.
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:5173,http://127.0.0.1:5173",
)
ALLOWED_ORIGINS = [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]
MODEL_PATH = ARTIFACTS_DIR / "model.pt"
TEMPERATURE_PATH = ARTIFACTS_DIR / "temperature.json"
OOD_PARAMS_PATH = ARTIFACTS_DIR / "ood_params.pkl"
DECISION_THRESHOLDS_PATH = ARTIFACTS_DIR / "decision_thresholds.json"