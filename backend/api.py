import os
import io
import json
import pickle
import numpy as np
import torch
import torch.nn as nn

from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from torchvision import models, transforms


# =========================
# CONFIG
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

CLASSES = [
    "Atelectasis",
    "Cardiomegaly",
    "Consolidation",
    "Edema",
    "Effusion",
    "Emphysema",
    "Fibrosis",
    "Hernia",
    "Infiltration",
    "Mass",
    "No Finding",
    "Nodule",
    "Pleural_Thickening",
    "Pneumonia",
    "Pneumothorax"
]

MODEL_PATH = os.path.join(BASE_DIR, "model.pt")
TEMP_PATH = os.path.join(BASE_DIR, "temperature.json")
OOD_PATH = os.path.join(BASE_DIR, "ood_params.pkl")
THRESHOLD_PATH = os.path.join(
    BASE_DIR,
    "decision_thresholds.json"
)


# =========================
# LOAD MODEL
# =========================

model = models.densenet121(weights=None)

model.classifier = nn.Linear(
    model.classifier.in_features,
    len(CLASSES)
)

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE,
    weights_only=False
)

if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
    model.load_state_dict(
        checkpoint["model_state_dict"]
    )
else:
    model.load_state_dict(checkpoint)

model = model.to(DEVICE)
model.eval()


# =========================
# LOAD TEMPERATURE
# =========================

with open(TEMP_PATH, "r") as f:
    temp_data = json.load(f)

TEMPERATURE = float(
    temp_data["temperature"]
)


# =========================
# LOAD OOD PARAMETERS
# =========================

with open(OOD_PATH, "rb") as f:
    ood_data = pickle.load(f)

class_means = ood_data["class_means"]
cov_inv = ood_data["covariance_inv"]


# =========================
# LOAD DECISION THRESHOLDS
# =========================

with open(THRESHOLD_PATH, "r") as f:
    threshold_data = json.load(f)

ACCEPT_THRESHOLD = float(
    threshold_data["accept_threshold"]
)

UNCERTAIN_THRESHOLD = float(
    threshold_data["uncertain_threshold"]
)


# =========================
# IMAGE TRANSFORM
# =========================

MEAN = [
    0.5407,
    0.5407,
    0.5407
]

STD = [
    0.2419,
    0.2419,
    0.2419
]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD)
])


# =========================
# FASTAPI
# =========================

app = FastAPI(
    title="Clinical AI Safety API",
    description=(
        "Chest X-ray prediction with "
        "confidence, uncertainty and OOD detection"
    ),
    version="1.0"
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# FEATURE EXTRACTION
# =========================

def get_features(x):

    features = model.features(x)

    features = torch.relu(features)

    features = torch.nn.functional.adaptive_avg_pool2d(
        features,
        (1, 1)
    )

    features = torch.flatten(
        features,
        1
    )

    return features


# =========================
# MAHALANOBIS SCORE
# =========================

def mahalanobis_score(feature):

    feature = (
        feature
        .detach()
        .cpu()
        .numpy()[0]
    )

    scores = []

    for class_id in range(len(CLASSES)):

        mean = class_means[class_id]

        diff = feature - mean

        score = (
            diff
            @ cov_inv
            @ diff.T
        )

        scores.append(
            float(score)
        )

    return float(
        min(scores)
    )


# =========================
# MC DROPOUT
# =========================

def mc_dropout_prediction(
    x,
    passes=10
):

    features = get_features(x)

    predictions = []

    for _ in range(passes):

        dropped = torch.nn.functional.dropout(
            features,
            p=0.20,
            training=True
        )

        logits = model.classifier(
            dropped
        )

        probabilities = torch.softmax(
            logits,
            dim=1
        )

        predictions.append(
            probabilities
            .detach()
            .cpu()
            .numpy()[0]
        )

    predictions = np.array(
        predictions
    )

    mean_probability = predictions.mean(
        axis=0
    )

    variance = predictions.var(
        axis=0
    ).mean()

    entropy = -np.sum(
        mean_probability
        * np.log(
            mean_probability + 1e-10
        )
    )

    return (
        mean_probability,
        float(variance),
        float(entropy)
    )


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "device": str(DEVICE),
        "model": "DenseNet-121",
        "classes": len(CLASSES),
        "temperature": TEMPERATURE,
        "mc_dropout_passes": 10,
        "accept_threshold": ACCEPT_THRESHOLD,
        "uncertain_threshold": UNCERTAIN_THRESHOLD,
        "ood_threshold_configured": False
    }


# =========================
# PREDICTION
# =========================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    # =========================
    # READ IMAGE
    # =========================

    contents = await file.read()

    try:

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

    except Exception:

        return {
            "error": (
                "Uploaded file is not a valid image. "
                "Please upload a JPG, PNG, or similar image file."
            )
        }

    x = transform(
        image
    ).unsqueeze(0).to(DEVICE)


    # =========================
    # STANDARD PREDICTION
    # =========================

    with torch.no_grad():

        logits = model(x)

        calibrated_logits = (
            logits / TEMPERATURE
        )

        probabilities = torch.softmax(
            calibrated_logits,
            dim=1
        )

        confidence, predicted = torch.max(
            probabilities,
            dim=1
        )

    predicted_id = int(
        predicted.item()
    )

    confidence = float(
        confidence.item()
    )

    predicted_class = CLASSES[
        predicted_id
    ]


    # =========================
    # FULL PROBABILITY DISTRIBUTION
    # =========================

    probability_values = (
        probabilities
        .detach()
        .cpu()
        .numpy()[0]
    )

    class_probabilities = {
        CLASSES[i]: round(
            float(probability_values[i]),
            6
        )
        for i in range(len(CLASSES))
    }


    # =========================
    # MC DROPOUT
    # =========================

    with torch.no_grad():

        (
            mc_prob,
            uncertainty,
            entropy
        ) = mc_dropout_prediction(
            x,
            passes=10
        )


    # =========================
    # MAHALANOBIS OOD
    # =========================

    with torch.no_grad():

        feature = get_features(x)

        ood_score = mahalanobis_score(
            feature
        )


    # =========================
    # COMPOSITE RISK
    # =========================

    confidence_risk = (
        1.0 - confidence
    )

    uncertainty_risk = min(
        uncertainty / 0.001,
        1.0
    )

    ood_risk = min(
        ood_score / 3000.0,
        1.0
    )

    composite_risk = (
        confidence_risk
        + uncertainty_risk
        + ood_risk
    ) / 3.0


    # =========================
    # DECISION
    # =========================

    if composite_risk <= ACCEPT_THRESHOLD:

        decision = "ACCEPT"

    elif composite_risk <= UNCERTAIN_THRESHOLD:

        decision = "UNCERTAIN"

    else:

        decision = "ABSTAIN"


    # =========================
    # RISK COMPONENTS
    # =========================

    risk_components = {
        "confidence_risk": round(
            confidence_risk,
            6
        ),
        "uncertainty_risk": round(
            uncertainty_risk,
            6
        ),
        "ood_risk": round(
            ood_risk,
            6
        )
    }


    # =========================
    # FINAL RESPONSE
    # =========================

    return {

        "filename": file.filename,

        # Prediction
        "prediction": predicted_class,
        "confidence": round(
            confidence,
            4
        ),

        # Calibration
        "temperature": round(
            TEMPERATURE,
            6
        ),
        "calibrated": True,

        # All 15 classes
        "probabilities": class_probabilities,

        # Uncertainty
        "uncertainty": round(
            uncertainty,
            6
        ),
        "entropy": round(
            entropy,
            4
        ),
        "mc_dropout_passes": 10,

        # OOD
        "ood_score": round(
            ood_score,
            4
        ),
        "ood_threshold": None,
        "ood_threshold_configured": False,

        # Risk
        "risk_components": risk_components,
        "composite_risk": round(
            composite_risk,
            4
        ),

        # Decision thresholds
        "accept_threshold": round(
            ACCEPT_THRESHOLD,
            6
        ),
        "uncertain_threshold": round(
            UNCERTAIN_THRESHOLD,
            6
        ),

        # Decision
        "decision": decision
    }