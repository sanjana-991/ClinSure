import os
import json
import torch
import torch.nn as nn
import pandas as pd
import numpy as np

from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.utils.class_weight import compute_class_weight


# =========================================================
# SETTINGS
# =========================================================

CSV_FILE = "split_manifest.csv"
IMAGE_DIR = "images"

BATCH_SIZE = 8
EPOCHS = 10
LR = 1e-4
WEIGHT_DECAY = 1e-4

NUM_WORKERS = 0

MODEL_FILE = "model_weighted.pt"
HISTORY_FILE = "weighted_training_history.json"


# =========================================================
# DEVICE
# =========================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Device:", device)

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))


# =========================================================
# NORMALIZATION
# =========================================================

mean = [0.5407, 0.5407, 0.5407]
std = [0.2419, 0.2419, 0.2419]


train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomRotation(5),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])


val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])


# =========================================================
# DATASET
# =========================================================

class ChestXrayDataset(Dataset):

    def __init__(self, csv_file, image_dir, split, transform):

        df = pd.read_csv(csv_file)

        self.df = df[
            df["split"] == split
        ].reset_index(drop=True)

        self.image_dir = image_dir
        self.transform = transform

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

        image_path = os.path.join(
            self.image_dir,
            row["filename"]
        )

        image = Image.open(
            image_path
        ).convert("RGB")

        image = self.transform(image)

        label = self.label_to_id[
            row["label"]
        ]

        return image, label


# =========================================================
# DATASETS
# =========================================================

train_dataset = ChestXrayDataset(
    CSV_FILE,
    IMAGE_DIR,
    "train",
    train_transform
)

val_dataset = ChestXrayDataset(
    CSV_FILE,
    IMAGE_DIR,
    "val",
    val_transform
)


print("Train images:", len(train_dataset))
print("Validation images:", len(val_dataset))

print("Classes:")
for i, name in enumerate(train_dataset.labels):
    print(i, name)


# =========================================================
# CLASS WEIGHTS
# =========================================================

train_labels = [
    train_dataset.label_to_id[label]
    for label in train_dataset.df["label"]
]

class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.arange(len(train_dataset.labels)),
    y=train_labels
)

class_weights = torch.tensor(
    class_weights,
    dtype=torch.float32
)

print("\nClass weights:")

for name, weight in zip(
    train_dataset.labels,
    class_weights
):
    print(
        f"{name:20s} {weight.item():.4f}"
    )

class_weights = class_weights.to(device)


# =========================================================
# DATALOADERS
# =========================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=NUM_WORKERS
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=NUM_WORKERS
)


# =========================================================
# MODEL
# =========================================================

model = models.densenet121(
    weights="DEFAULT"
)

model.classifier = nn.Linear(
    model.classifier.in_features,
    len(train_dataset.labels)
)

model = model.to(device)


# =========================================================
# LOSS
# =========================================================

criterion = nn.CrossEntropyLoss(
    weight=class_weights
)


# =========================================================
# OPTIMIZER
# =========================================================

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LR,
    weight_decay=WEIGHT_DECAY
)


scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="min",
    factor=0.5,
    patience=1
)


# =========================================================
# AMP
# =========================================================

scaler = torch.amp.GradScaler(
    "cuda",
    enabled=torch.cuda.is_available()
)


# =========================================================
# HISTORY
# =========================================================

history = {
    "train_loss": [],
    "train_accuracy": [],
    "val_loss": [],
    "val_accuracy": [],
    "lr": []
}

best_val_loss = float("inf")


# =========================================================
# TRAINING
# =========================================================

for epoch in range(EPOCHS):

    print(
        f"\n========== EPOCH {epoch + 1}/{EPOCHS} =========="
    )

    # -----------------------------------------------------
    # TRAIN
    # -----------------------------------------------------

    model.train()

    train_loss = 0.0
    train_correct = 0
    train_total = 0

    for images, labels in train_loader:

        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        with torch.amp.autocast(
            device_type="cuda",
            enabled=torch.cuda.is_available()
        ):

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

        scaler.scale(loss).backward()

        scaler.step(optimizer)

        scaler.update()

        train_loss += (
            loss.item() * images.size(0)
        )

        predictions = torch.argmax(
            outputs,
            dim=1
        )

        train_correct += (
            (predictions == labels)
            .sum()
            .item()
        )

        train_total += labels.size(0)

    train_loss /= train_total

    train_accuracy = (
        train_correct /
        train_total
    )


    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    model.eval()

    val_loss = 0.0
    val_correct = 0
    val_total = 0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(device)
            labels = labels.to(device)

            with torch.amp.autocast(
                device_type="cuda",
                enabled=torch.cuda.is_available()
            ):

                outputs = model(images)

                loss = criterion(
                    outputs,
                    labels
                )

            val_loss += (
                loss.item() * images.size(0)
            )

            predictions = torch.argmax(
                outputs,
                dim=1
            )

            val_correct += (
                (predictions == labels)
                .sum()
                .item()
            )

            val_total += labels.size(0)

    val_loss /= val_total

    val_accuracy = (
        val_correct /
        val_total
    )


    # -----------------------------------------------------
    # SCHEDULER
    # -----------------------------------------------------

    scheduler.step(val_loss)

    current_lr = optimizer.param_groups[0]["lr"]


    # -----------------------------------------------------
    # SAVE HISTORY
    # -----------------------------------------------------

    history["train_loss"].append(
        train_loss
    )

    history["train_accuracy"].append(
        train_accuracy
    )

    history["val_loss"].append(
        val_loss
    )

    history["val_accuracy"].append(
        val_accuracy
    )

    history["lr"].append(
        current_lr
    )

    with open(
        HISTORY_FILE,
        "w"
    ) as f:

        json.dump(
            history,
            f,
            indent=4
        )


    # -----------------------------------------------------
    # PRINT
    # -----------------------------------------------------

    print(
        f"Train Loss: {train_loss:.4f}"
    )

    print(
        f"Train Accuracy: "
        f"{train_accuracy * 100:.2f}%"
    )

    print(
        f"Val Loss: {val_loss:.4f}"
    )

    print(
        f"Val Accuracy: "
        f"{val_accuracy * 100:.2f}%"
    )

    print(
        f"Learning Rate: {current_lr:.6f}"
    )


    # -----------------------------------------------------
    # SAVE BEST MODEL
    # -----------------------------------------------------

    if val_loss < best_val_loss:

        best_val_loss = val_loss

        torch.save(
            {
                "epoch": epoch + 1,
                "model_state_dict":
                    model.state_dict(),
                "optimizer_state_dict":
                    optimizer.state_dict(),
                "best_val_loss":
                    best_val_loss,
                "classes":
                    train_dataset.labels
            },
            MODEL_FILE
        )

        print(
            "✓ Best weighted model saved."
        )


print("\n================================")
print("Weighted training completed.")
print("Best validation loss:",
      best_val_loss)
print("Model saved as:",
      MODEL_FILE)
print("History saved as:",
      HISTORY_FILE)