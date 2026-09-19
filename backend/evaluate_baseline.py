import os
import json
import torch
import torch.nn as nn
import pandas as pd
import numpy as np

from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

# -----------------------------
# SETTINGS
# -----------------------------
CSV_FILE = "split_manifest.csv"
IMAGE_DIR = "images"
MODEL_FILE = "model.pt"

BATCH_SIZE = 16

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Device:", device)

# -----------------------------
# TRANSFORM
# -----------------------------
mean = [0.5407, 0.5407, 0.5407]
std = [0.2419, 0.2419, 0.2419]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])

# -----------------------------
# DATASET
# -----------------------------
class ChestXrayDataset(Dataset):

    def __init__(self, csv_file, image_dir, split):
        df = pd.read_csv(csv_file)

        self.df = df[df["split"] == split].reset_index(drop=True)
        self.image_dir = image_dir

        self.labels = sorted(df["label"].unique())
        self.label_to_id = {
            label: i for i, label in enumerate(self.labels)
        }

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):

        row = self.df.iloc[idx]

        img_path = os.path.join(
            self.image_dir,
            row["filename"]
        )

        image = Image.open(img_path).convert("RGB")
        image = transform(image)

        label = self.label_to_id[row["label"]]

        return image, label


# -----------------------------
# VALIDATION DATA
# -----------------------------
dataset = ChestXrayDataset(
    CSV_FILE,
    IMAGE_DIR,
    "val"
)

loader = DataLoader(
    dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)

print("Validation images:", len(dataset))
print("Classes:", dataset.labels)

# -----------------------------
# MODEL
# -----------------------------
model = models.densenet121(weights=None)

model.classifier = nn.Linear(
    model.classifier.in_features,
    len(dataset.labels)
)

checkpoint = torch.load(
    MODEL_FILE,
    map_location=device,
    weights_only=False
)

model.load_state_dict(checkpoint["model_state_dict"])

model = model.to(device)
model.eval()

print("Loaded checkpoint epoch:", checkpoint.get("epoch"))
print("Best validation loss:", checkpoint.get("best_val_loss"))

# -----------------------------
# PREDICTION
# -----------------------------
all_labels = []
all_preds = []

with torch.no_grad():

    for images, labels in loader:

        images = images.to(device)

        outputs = model(images)

        preds = torch.argmax(outputs, dim=1)

        all_labels.extend(labels.numpy())
        all_preds.extend(preds.cpu().numpy())

# -----------------------------
# METRICS
# -----------------------------
accuracy = accuracy_score(
    all_labels,
    all_preds
)

precision = precision_score(
    all_labels,
    all_preds,
    average="macro",
    zero_division=0
)

recall = recall_score(
    all_labels,
    all_preds,
    average="macro",
    zero_division=0
)

f1 = f1_score(
    all_labels,
    all_preds,
    average="macro",
    zero_division=0
)

print("\n========== BASELINE METRICS ==========")

print(f"Accuracy          : {accuracy:.4f}")
print(f"Macro Precision   : {precision:.4f}")
print(f"Macro Recall      : {recall:.4f}")
print(f"Macro F1          : {f1:.4f}")

# -----------------------------
# PER-CLASS REPORT
# -----------------------------
report = classification_report(
    all_labels,
    all_preds,
    target_names=dataset.labels,
    output_dict=True,
    zero_division=0
)

print("\n========== CLASSIFICATION REPORT ==========")

print(
    classification_report(
        all_labels,
        all_preds,
        target_names=dataset.labels,
        zero_division=0
    )
)

# -----------------------------
# CONFUSION MATRIX
# -----------------------------
cm = confusion_matrix(
    all_labels,
    all_preds
)

print("\n========== CONFUSION MATRIX ==========")
print(cm)

# -----------------------------
# SAVE RESULTS
# -----------------------------
results = {
    "checkpoint_epoch": checkpoint.get("epoch"),
    "best_val_loss": checkpoint.get("best_val_loss"),
    "validation_images": len(dataset),
    "classes": dataset.labels,
    "accuracy": float(accuracy),
    "macro_precision": float(precision),
    "macro_recall": float(recall),
    "macro_f1": float(f1),
    "classification_report": report,
    "confusion_matrix": cm.tolist()
}

with open("baseline_metrics.json", "w") as f:
    json.dump(results, f, indent=4)

print("\nSaved: baseline_metrics.json")