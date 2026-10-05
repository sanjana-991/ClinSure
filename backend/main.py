"""
ClinSure Backend — Chest X-ray Uncertainty-Aware Analysis API
================================================================
Pipeline per request:
  1. Preprocess uploaded image (resize 224x224, normalize)
  2. Run DenseNet-121 forward pass → raw logits
  3. Temperature-scale the logits → calibrated 15-class probabilities
  4. Extract 1024-D penultimate feature vector
  5. MC-Dropout: 10 stochastic passes through the classifier head
     (external dropout p=0.20 applied to the feature vector)
     → epistemic uncertainty (variance) + predictive entropy
  6. Mahalanobis distance: compare feature vector to per-class
     training-set means using the shared precision matrix → OOD score
  7. Composite safety risk (equal-weighted blend of three normalised
     risk signals) → ACCEPT / UNCERTAIN / ABSTAIN decision

Note on MC-Dropout:
  The trained DenseNet-121 was NOT trained with dropout.
  Dropout is applied externally to the penultimate 1024-D feature
  representation at inference time only. This is by design.

Endpoints:
  GET  /health   — liveness check
  POST /predict  — full inference pipeline
"""

import io
import json
import os
import pickle

import numpy as np
import torch
import torch.nn as nn
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import models, transforms

from config import ALLOWED_ORIGINS, ARTIFACTS_DIR

# ---------------------------------------------------------------------------
# Device selection — CPU or CUDA, logged once at startup
# ---------------------------------------------------------------------------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[ClinSure] Running on device: {DEVICE}")

# ---------------------------------------------------------------------------
# Fixed class list — must match training order exactly
# ---------------------------------------------------------------------------
CLASSES = [
    "Atelectasis", "Cardiomegaly", "Consolidation", "Edema", "Effusion",
    "Emphysema", "Fibrosis", "Hernia", "Infiltration", "Mass",
    "No Finding", "Nodule", "Pleural_Thickening", "Pneumonia", "Pneumothorax",
]

# ---------------------------------------------------------------------------
# MC-Dropout configuration
# ---------------------------------------------------------------------------
MC_DROPOUT_PASSES = 10
MC_DROPOUT_P = 0.20

# ---------------------------------------------------------------------------
# Risk normalisation denominators (used for composite risk calculation)
# ---------------------------------------------------------------------------
UNCERTAINTY_NORM = 0.001   # uncertainty values above this are treated as max risk
OOD_NORM = 3000.0          # OOD scores above this are treated as max risk

# ---------------------------------------------------------------------------
# Load trained artifacts — done ONCE at startup, never per request
# ---------------------------------------------------------------------------

# --- DenseNet-121 model ---
print("[ClinSure] Loading DenseNet-121 model weights ...")
_model = models.densenet121(weights=None)
_model.classifier = nn.Linear(_model.classifier.in_features, len(CLASSES))

_checkpoint = torch.load(
    ARTIFACTS_DIR / "model.pt", map_location=DEVICE, weights_only=False
)
_state_dict = (
    _checkpoint["model_state_dict"]
    if isinstance(_checkpoint, dict) and "model_state_dict" in _checkpoint
    else _checkpoint
)
_model.load_state_dict(_state_dict)
_model.to(DEVICE).eval()
print("[ClinSure] Model loaded successfully.")

# --- Temperature scaling parameter ---
with open(ARTIFACTS_DIR / "temperature.json") as _f:
    TEMPERATURE = float(json.load(_f)["temperature"])
print(f"[ClinSure] Temperature scaling T = {TEMPERATURE}")

# --- OOD parameters (Mahalanobis) ---
# class_means is a dict: {0: np.array(1024,), 1: …, …, 14: …}
# covariance_inv is a shared precision matrix: np.array(1024, 1024)
with open(ARTIFACTS_DIR / "ood_params.pkl", "rb") as _f:
    _ood = pickle.load(_f)
CLASS_MEANS: dict = _ood["class_means"]   # dict keyed by int 0–14
COV_INV: np.ndarray = _ood["covariance_inv"]
print(f"[ClinSure] OOD params loaded -- {len(CLASS_MEANS)} class means, "
      f"precision matrix shape {COV_INV.shape}")

# --- Decision thresholds ---
with open(ARTIFACTS_DIR / "decision_thresholds.json") as _f:
    _thresholds = json.load(_f)
ACCEPT_THRESHOLD = float(_thresholds["accept_threshold"])
UNCERTAIN_THRESHOLD = float(_thresholds["uncertain_threshold"])
print(f"[ClinSure] Thresholds -- ACCEPT <= {ACCEPT_THRESHOLD:.6f}, "
      f"UNCERTAIN <= {UNCERTAIN_THRESHOLD:.6f}")

# ---------------------------------------------------------------------------
# Image preprocessing pipeline — must exactly match training normalisation
# ---------------------------------------------------------------------------
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5407] * 3, std=[0.2419] * 3),
])

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ClinSure API",
    description=(
        "Uncertainty-aware chest X-ray analysis. "
        "Returns calibrated probabilities, epistemic uncertainty (MC-Dropout), "
        "OOD distance (Mahalanobis), composite safety risk, and a "
        "ACCEPT / UNCERTAIN / ABSTAIN decision."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Internal inference helpers
# ---------------------------------------------------------------------------

def _extract_features(x: torch.Tensor) -> torch.Tensor:
    """
    Run the DenseNet-121 convolutional backbone and return the
    1024-D pooled feature vector (before the classifier head).
    """
    feats = _model.features(x)
    feats = torch.relu(feats)
    feats = torch.nn.functional.adaptive_avg_pool2d(feats, (1, 1))
    return torch.flatten(feats, 1)  # shape: (1, 1024)


def _mc_dropout_uncertainty(features: torch.Tensor):
    """
    Estimate epistemic uncertainty via MC-Dropout.

    Applies external dropout (p=MC_DROPOUT_P) to the 1024-D feature
    vector MC_DROPOUT_PASSES times and runs each through the classifier
    head. The trained model itself was NOT trained with dropout — dropout
    is applied externally here at inference time only.

    Returns:
        variance (float): mean per-class variance across stochastic passes
        entropy  (float): predictive entropy of the mean probability vector
        mean_probs (np.ndarray): shape (15,) — mean softmax distribution
    """
    stochastic_outputs = []
    for _ in range(MC_DROPOUT_PASSES):
        dropped = torch.nn.functional.dropout(features, p=MC_DROPOUT_P, training=True)
        logits = _model.classifier(dropped)
        probs = torch.softmax(logits, dim=1)
        stochastic_outputs.append(probs.detach().cpu().numpy()[0])

    outputs = np.array(stochastic_outputs)          # (10, 15)
    mean_probs = outputs.mean(axis=0)               # (15,)
    variance = float(outputs.var(axis=0).mean())    # scalar
    entropy = float(-np.sum(mean_probs * np.log(mean_probs + 1e-10)))  # scalar
    return variance, entropy, mean_probs


def _mahalanobis_score(feature: torch.Tensor) -> float:
    """
    Compute the minimum Mahalanobis distance from the feature vector
    to any of the 15 per-class training means.

    CLASS_MEANS is a dict {int: np.ndarray(1024,)}.
    COV_INV is the shared precision matrix (1024, 1024).
    """
    vec = feature.detach().cpu().numpy()[0]   # shape (1024,)
    distances = [
        float((vec - CLASS_MEANS[c]) @ COV_INV @ (vec - CLASS_MEANS[c]).T)
        for c in range(len(CLASSES))
    ]
    return min(distances)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    """Liveness check — used by Render health probes and the frontend."""
    return {
        "status": "ok",
        "device": str(DEVICE),
        "model": "DenseNet-121",
        "num_classes": len(CLASSES),
        "temperature": TEMPERATURE,
        "mc_dropout_passes": MC_DROPOUT_PASSES,
        "mc_dropout_p": MC_DROPOUT_P,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Full ClinSure inference pipeline.

    Accepts a chest X-ray image (JPEG / PNG) and returns:
      - Calibrated 15-class probability distribution
      - MC-Dropout epistemic uncertainty + predictive entropy
      - Mahalanobis OOD distance
      - Per-component and composite safety risk
      - Safety decision: ACCEPT | UNCERTAIN | ABSTAIN
    """
    # ---- 1. Read & validate image ----
    raw_bytes = await file.read()
    try:
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Uploaded file is not a valid image: {exc}")

    # ---- 2. Preprocess ----
    x = TRANSFORM(image).unsqueeze(0).to(DEVICE)

    # ---- 3. Forward pass — calibrated classification ----
    with torch.no_grad():
        raw_logits = _model(x)                         # uncalibrated logits
        cal_logits = raw_logits / TEMPERATURE          # temperature-scaled
        probs_tensor = torch.softmax(cal_logits, dim=1)
        confidence_tensor, predicted_idx = torch.max(probs_tensor, dim=1)

        confidence: float = float(confidence_tensor.item())
        predicted_class: str = CLASSES[int(predicted_idx.item())]

        # All 15-class calibrated probabilities
        probs_list: list = probs_tensor.detach().cpu().numpy()[0].tolist()
        probabilities: dict = {cls: round(float(p), 6) for cls, p in zip(CLASSES, probs_list)}

        # ---- 4. Feature extraction (shared for MC-Dropout and OOD) ----
        features = _extract_features(x)               # shape (1, 1024)

    # ---- 5. MC-Dropout uncertainty (runs outside no_grad to allow dropout) ----
    uncertainty, entropy, _mc_mean_probs = _mc_dropout_uncertainty(features)

    # ---- 6. Mahalanobis OOD score ----
    ood_score = _mahalanobis_score(features)

    # ---- 7. Composite safety risk ----
    confidence_risk = 1.0 - confidence
    uncertainty_risk = min(uncertainty / UNCERTAINTY_NORM, 1.0)
    ood_risk = min(ood_score / OOD_NORM, 1.0)
    composite_risk = (confidence_risk + uncertainty_risk + ood_risk) / 3.0

    # ---- 8. Safety decision gating ----
    if composite_risk <= ACCEPT_THRESHOLD:
        decision = "ACCEPT"
    elif composite_risk <= UNCERTAIN_THRESHOLD:
        decision = "UNCERTAIN"
    else:
        decision = "ABSTAIN"

    # ---- 9. Return complete response ----
    return {
        # --- Image identification ---
        "filename": file.filename,

        # --- Primary prediction ---
        "prediction": predicted_class,
        "confidence": round(confidence, 6),

        # --- Calibration metadata ---
        "temperature": TEMPERATURE,
        "calibrated": True,

        # --- Full 15-class probability distribution ---
        "probabilities": probabilities,

        # --- Uncertainty (MC-Dropout) ---
        "uncertainty": round(uncertainty, 8),
        "entropy": round(entropy, 6),
        "mc_dropout_passes": MC_DROPOUT_PASSES,

        # --- OOD Detection (Mahalanobis) ---
        "ood_score": round(ood_score, 4),
        "ood_threshold": None,            # no fixed OOD threshold configured
        "ood_threshold_configured": False,

        # --- Risk decomposition ---
        "risk_components": {
            "confidence_risk": round(confidence_risk, 6),
            "uncertainty_risk": round(uncertainty_risk, 6),
            "ood_risk": round(ood_risk, 6),
        },

        # --- Composite risk and thresholds ---
        "composite_risk": round(composite_risk, 6),
        "accept_threshold": ACCEPT_THRESHOLD,
        "uncertain_threshold": UNCERTAIN_THRESHOLD,

        # --- Final safety decision ---
        "decision": decision,
    }


# ---------------------------------------------------------------------------
# Entry point — used for local development; Render uses the Procfile command
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)