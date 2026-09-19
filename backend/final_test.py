import os
import json
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F

from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models

from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix
)


# =========================================================
# SETTINGS
# =========================================================

CSV_FILE = "split_manifest.csv"
IMAGE_DIR = "images"
MODEL_FILE = "model.pt"
TEMP_FILE = "temperature.json"
OOD_FILE = "ood_params.pkl"
THRESHOLD_FILE = "decision_thresholds.json"
MC_FILE = "mc_dropout_uncertainty.csv"
OOD_SCORE_FILE = "ood_scores.csv"

BATCH_SIZE = 16
MC_PASSES = 10
DROPOUT_P = 0.20

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Device:", device)


# =========================================================
# TRANSFORM
# =========================================================

mean = [0.5407, 0.5407, 0.5407]
std = [0.2419, 0.2419, 0.2419]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])


# =========================================================
# DATASET
# =========================================================

class ChestXrayDataset(Dataset):

    def __init__(self, csv_file, image_dir, split):

        df = pd.read_csv(csv_file)

        self.df = df[
            df["split"] == split
        ].reset_index(drop=True)

        self.image_dir = image_dir

        self.labels = sorted(
            df["label"].unique()
        )

        self.label_to_id = {
            label: i
            for i, label in enumerate(self.labels)
        }

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):

        row = self.df.iloc[idx]

        path = os.path.join(
            self.image_dir,
            row["filename"]
        )

        image = Image.open(
            path
        ).convert("RGB")

        image = transform(image)

        label = self.label_to_id[
            row["label"]
        ]

        return image, label


# =========================================================
# TEST DATA
# =========================================================

test_dataset = ChestXrayDataset(
    CSV_FILE,
    IMAGE_DIR,
    "test"
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)

print(
    "Test images:",
    len(test_dataset)
)

print(
    "Classes:",
    test_dataset.labels
)


# =========================================================
# MODEL
# =========================================================

model = models.densenet121(
    weights=None
)

model.classifier = nn.Linear(
    model.classifier.in_features,
    len(test_dataset.labels)
)

checkpoint = torch.load(
    MODEL_FILE,
    map_location=device,
    weights_only=False
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model = model.to(device)
model.eval()

print(
    "Checkpoint epoch:",
    checkpoint.get("epoch")
)


# =========================================================
# TEMPERATURE
# =========================================================

with open(TEMP_FILE, "r") as f:
    temp_data = json.load(f)

T = float(
    temp_data["temperature"]
)

print(
    "Temperature:",
    T
)


# =========================================================
# MAHALANOBIS PARAMETERS
# =========================================================

with open(OOD_FILE, "rb") as f:
    ood_params = pickle.load(f)

class_means = ood_params[
    "class_means"
]

covariance_inv = ood_params[
    "covariance_inv"
]


def get_features(images):

    features = model.features(images)

    features = torch.relu(
        features
    )

    features = F.adaptive_avg_pool2d(
        features,
        (1, 1)
    )

    features = torch.flatten(
        features,
        1
    )

    return features


def mahalanobis_distance(features):

    scores = []

    for class_id in range(
        len(class_means)
    ):

        mean = class_means[class_id]

        diff = (
            features -
            mean
        )

        distance = np.einsum(
            "ij,jk,ik->i",
            diff,
            covariance_inv,
            diff
        )

        scores.append(distance)

    scores = np.stack(
        scores,
        axis=1
    )

    return scores.min(axis=1)


# =========================================================
# FROZEN STAGE-10 THRESHOLDS
# =========================================================

with open(
    THRESHOLD_FILE,
    "r"
) as f:

    threshold_data = json.load(f)

accept_threshold = float(
    threshold_data[
        "accept_threshold"
    ]
)

uncertain_threshold = float(
    threshold_data[
        "uncertain_threshold"
    ]
)

print(
    "Accept threshold:",
    accept_threshold
)

print(
    "Uncertain threshold:",
    uncertain_threshold
)


# =========================================================
# VALIDATION DATA
# =========================================================

val_dataset = ChestXrayDataset(
    CSV_FILE,
    IMAGE_DIR,
    "val"
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)


# =========================================================
# VALIDATION CONFIDENCE
# =========================================================

val_confidence = []

with torch.no_grad():

    for images, labels in val_loader:

        images = images.to(device)

        logits = model(images)

        calibrated_logits = (
            logits / T
        )

        probabilities = torch.softmax(
            calibrated_logits,
            dim=1
        )

        confidence, _ = (
            probabilities.max(dim=1)
        )

        val_confidence.extend(
            confidence.cpu().numpy()
        )

val_confidence = np.array(
    val_confidence
)


# =========================================================
# LOAD VALIDATION MC/OOD REFERENCES
# =========================================================

mc_val = pd.read_csv(
    MC_FILE
)

val_uncertainty = mc_val[
    "uncertainty_variance"
].values

ood_val = pd.read_csv(
    OOD_SCORE_FILE
)

val_ood = ood_val[
    "normal_score"
].values


assert len(val_confidence) == len(val_uncertainty)
assert len(val_confidence) == len(val_ood)


# =========================================================
# PERCENTILE FUNCTION
# =========================================================

def percentile_against_reference(
    values,
    reference
):

    reference = np.sort(
        reference
    )

    return np.searchsorted(
        reference,
        values,
        side="right"
    ) / len(reference)


# =========================================================
# TEST EVALUATION
# =========================================================

all_confidence = []
all_predictions = []
all_labels = []
all_uncertainty = []
all_ood_scores = []

mc_dropout = nn.Dropout(
    p=DROPOUT_P
).to(device)

print(
    "\nRunning final test evaluation..."
)


for batch_idx, (
    images,
    labels
) in enumerate(test_loader):

    images = images.to(device)

    labels_np = labels.numpy()

    # -----------------------------------------------------
    # Standard prediction
    # -----------------------------------------------------

    with torch.no_grad():

        logits = model(images)

        calibrated_logits = (
            logits / T
        )

        probabilities = torch.softmax(
            calibrated_logits,
            dim=1
        )

        confidence, predictions = (
            probabilities.max(dim=1)
        )

        features = get_features(
            images
        )

    # -----------------------------------------------------
    # MC-Dropout
    # -----------------------------------------------------

    mc_probs = []

    with torch.no_grad():

        for _ in range(MC_PASSES):

            dropped_features = (
                mc_dropout(features)
            )

            logits_mc = model.classifier(
                dropped_features
            )

            logits_mc = (
                logits_mc / T
            )

            probs_mc = torch.softmax(
                logits_mc,
                dim=1
            )

            mc_probs.append(
                probs_mc
            )

    mc_probs = torch.stack(
        mc_probs,
        dim=0
    )

    uncertainty = (
        mc_probs.var(
            dim=0
        ).mean(dim=1)
    )

    # -----------------------------------------------------
    # Mahalanobis OOD
    # -----------------------------------------------------

    features_np = (
        features.cpu().numpy()
    )

    ood_scores = mahalanobis_distance(
        features_np
    )

    # -----------------------------------------------------
    # Store
    # -----------------------------------------------------

    all_confidence.extend(
        confidence.cpu().numpy()
    )

    all_predictions.extend(
        predictions.cpu().numpy()
    )

    all_labels.extend(
        labels_np
    )

    all_uncertainty.extend(
        uncertainty.cpu().numpy()
    )

    all_ood_scores.extend(
        ood_scores
    )

    if (batch_idx + 1) % 50 == 0:

        print(
            "Processed test batches:",
            batch_idx + 1
        )


# =========================================================
# ARRAYS
# =========================================================

all_confidence = np.array(
    all_confidence
)

all_predictions = np.array(
    all_predictions
)

all_labels = np.array(
    all_labels
)

all_uncertainty = np.array(
    all_uncertainty
)

all_ood_scores = np.array(
    all_ood_scores
)


# =========================================================
# TEST METRICS
# =========================================================

accuracy = accuracy_score(
    all_labels,
    all_predictions
)

precision, recall, f1, _ = (
    precision_recall_fscore_support(
        all_labels,
        all_predictions,
        labels=list(
            range(
                len(test_dataset.labels)
            )
        ),
        average="macro",
        zero_division=0
    )
)


print(
    "\n========== FINAL TEST METRICS =========="
)

print(
    "Accuracy:",
    accuracy
)

print(
    "Macro Precision:",
    precision
)

print(
    "Macro Recall:",
    recall
)

print(
    "Macro F1:",
    f1
)


# =========================================================
# CLASSIFICATION REPORT
# =========================================================

class_ids = list(
    range(
        len(test_dataset.labels)
    )
)

report = classification_report(
    all_labels,
    all_predictions,
    labels=class_ids,
    target_names=test_dataset.labels,
    zero_division=0,
    output_dict=True
)

print(
    "\nClassification report:"
)

print(
    classification_report(
        all_labels,
        all_predictions,
        labels=class_ids,
        target_names=test_dataset.labels,
        zero_division=0
    )
)


# =========================================================
# CONFUSION MATRIX
# =========================================================

cm = confusion_matrix(
    all_labels,
    all_predictions,
    labels=class_ids
)


# =========================================================
# TEST RISK
# =========================================================

test_confidence_risk = (
    percentile_against_reference(
        1.0 - all_confidence,
        1.0 - val_confidence
    )
)

test_uncertainty_risk = (
    percentile_against_reference(
        all_uncertainty,
        val_uncertainty
    )
)

test_ood_risk = (
    percentile_against_reference(
        all_ood_scores,
        val_ood
    )
)


# =========================================================
# COMPOSITE RISK
# =========================================================

test_risk = (
    test_confidence_risk
    + test_uncertainty_risk
    + test_ood_risk
) / 3.0


correct = (
    all_predictions ==
    all_labels
)


# =========================================================
# FROZEN DECISION
# =========================================================

def get_decision(risk):

    if risk <= accept_threshold:

        return "ACCEPT"

    elif risk <= uncertain_threshold:

        return "UNCERTAIN"

    else:

        return "ABSTAIN"


decisions = np.array([
    get_decision(r)
    for r in test_risk
])


# =========================================================
# FINAL PREDICTIONS
# =========================================================

final_df = pd.DataFrame({

    "filename":
        test_dataset.df["filename"].values,

    "true_label":
        test_dataset.df["label"].values,

    "predicted_label":
        [
            test_dataset.labels[i]
            for i in all_predictions
        ],

    "calibrated_confidence":
        all_confidence,

    "mc_uncertainty":
        all_uncertainty,

    "mahalanobis_score":
        all_ood_scores,

    "risk_score":
        test_risk,

    "correct":
        correct,

    "decision":
        decisions
})


# =========================================================
# SELECTIVE RESULTS
# =========================================================

tier_results = {}

print(
    "\n========== FINAL SELECTIVE RESULTS =========="
)

for tier in [
    "ACCEPT",
    "UNCERTAIN",
    "ABSTAIN"
]:

    subset = final_df[
        final_df["decision"] == tier
    ]

    count = len(subset)

    coverage = (
        count /
        len(final_df)
    )

    if count > 0:

        tier_error = (
            1 -
            subset["correct"].mean()
        )

    else:

        tier_error = None

    tier_results[tier] = {

        "images":
            int(count),

        "coverage":
            float(coverage),

        "error":
            None if tier_error is None
            else float(tier_error)
    }

    print(
        tier,
        "| images:",
        count,
        "| coverage:",
        round(coverage, 4),
        "| error:",
        tier_error
    )


# =========================================================
# SAVE FINAL PREDICTIONS
# =========================================================

final_df.to_csv(
    "final_predictions.csv",
    index=False
)


# =========================================================
# SAVE FINAL RESULTS
# =========================================================

final_summary = {

    "checkpoint_epoch":
        checkpoint.get("epoch"),

    "test_images":
        len(test_dataset),

    "accuracy":
        float(accuracy),

    "macro_precision":
        float(precision),

    "macro_recall":
        float(recall),

    "macro_f1":
        float(f1),

    "temperature":
        float(T),

    "mc_passes":
        MC_PASSES,

    "dropout_probability":
        DROPOUT_P,

    "accept_threshold":
        accept_threshold,

    "uncertain_threshold":
        uncertain_threshold,

    "tier_results":
        tier_results,

    "classification_report":
        report,

    "confusion_matrix":
        cm.tolist()
}


with open(
    "final_results.json",
    "w"
) as f:

    json.dump(
        final_summary,
        f,
        indent=4
    )


# =========================================================
# FINAL RISK-COVERAGE
# =========================================================

order = np.argsort(
    test_risk
)

sorted_correct = correct[
    order
]

sorted_risk = test_risk[
    order
]

coverage = (
    np.arange(
        1,
        len(test_risk) + 1
    )
    /
    len(test_risk)
)

risk = (
    np.cumsum(
        ~sorted_correct
    )
    /
    np.arange(
        1,
        len(test_risk) + 1
    )
)

risk_coverage = pd.DataFrame({

    "coverage":
        coverage,

    "risk":
        risk,

    "threshold":
        sorted_risk
})

risk_coverage.to_csv(
    "final_risk_coverage.csv",
    index=False
)


# =========================================================
# DONE
# =========================================================

print(
    "\n======================================"
)

print(
    "Saved: final_predictions.csv"
)

print(
    "Saved: final_results.json"
)

print(
    "Saved: final_risk_coverage.csv"
)

print(
    "======================================"
)

print(
    "\nFINAL TEST EVALUATION COMPLETE."
)

print(
    "Thresholds were kept frozen."
)