import os
import random
import json

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image


# ============================================================
# 1. SETTINGS
# ============================================================

SEED = 42

CSV_FILE = "split_manifest.csv"
IMAGE_DIR = "images"

BATCH_SIZE = 8

# We already completed Epoch 1 and Epoch 2
START_EPOCH = 2

# Train until this epoch
TOTAL_EPOCHS = 10

LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-4

MODEL_FILE = "model.pt"
HISTORY_FILE = "training_history.json"
LOSS_CURVE_FILE = "training_curves.png"
ACC_CURVE_FILE = "accuracy_curves.png"

MEAN = [0.5407, 0.5407, 0.5407]
STD = [0.2419, 0.2419, 0.2419]

# Windows + GPU
NUM_WORKERS = 0


# ============================================================
# 2. REPRODUCIBILITY
# ============================================================

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)


# ============================================================
# 3. DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("=" * 60)
print("DENSENET-121 BASELINE TRAINING - RESUME MODE")
print("=" * 60)

print("Device:", device)

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))

print()


# ============================================================
# 4. TRANSFORMS
# ============================================================

train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomRotation(5),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD)
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD)
])


# ============================================================
# 5. DATASET
# ============================================================

class ChestXrayDataset(Dataset):

    def __init__(
        self,
        manifest_file,
        image_dir,
        split,
        transform=None
    ):

        self.df = pd.read_csv(manifest_file)

        self.df = self.df[
            self.df["split"] == split
        ].reset_index(drop=True)

        self.image_dir = image_dir
        self.transform = transform

        # Get class list from COMPLETE manifest
        all_labels = sorted(
            pd.read_csv(manifest_file)["label"].unique()
        )

        self.labels = all_labels

        self.label_to_id = {
            label: i
            for i, label in enumerate(self.labels)
        }

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):

        row = self.df.iloc[idx]

        filename = row["filename"]
        label = row["label"]

        image_path = os.path.join(
            self.image_dir,
            filename
        )

        image = Image.open(image_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        label_id = self.label_to_id[label]

        return image, label_id


# ============================================================
# 6. DATASETS
# ============================================================

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

print("Training images:", len(train_dataset))
print("Validation images:", len(val_dataset))
print("Number of classes:", len(train_dataset.labels))

print("\nClasses:")

for i, name in enumerate(train_dataset.labels):
    print(i, "->", name)

print()


# ============================================================
# 7. DATA LOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=NUM_WORKERS,
    pin_memory=torch.cuda.is_available(),
    persistent_workers=True if NUM_WORKERS > 0 else False
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=NUM_WORKERS,
    pin_memory=torch.cuda.is_available(),
    persistent_workers=True if NUM_WORKERS > 0 else False
)


# ============================================================
# 8. CREATE DENSENET-121
# ============================================================

print("Creating DenseNet-121...")

model = models.densenet121(
    weights=models.DenseNet121_Weights.DEFAULT
)

num_classes = len(train_dataset.labels)

model.classifier = nn.Linear(
    model.classifier.in_features,
    num_classes
)

model = model.to(device)

print("DenseNet-121 created.")
print("Classifier:", model.classifier)
print()


# ============================================================
# 9. LOSS
# ============================================================

criterion = nn.CrossEntropyLoss()


# ============================================================
# 10. OPTIMIZER
# ============================================================

optimizer = optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=WEIGHT_DECAY
)


# ============================================================
# 11. LEARNING RATE SCHEDULER
# ============================================================

scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="min",
    factor=0.5,
    patience=1
)


# ============================================================
# 12. MIXED PRECISION
# ============================================================

use_amp = torch.cuda.is_available()

scaler = torch.cuda.amp.GradScaler(
    enabled=use_amp
)


# ============================================================
# 13. LOAD EXISTING EPOCH-2 CHECKPOINT
# ============================================================

if not os.path.exists(MODEL_FILE):

    print("ERROR:")
    print(f"{MODEL_FILE} was not found.")
    print("Make sure the Epoch-2 model is in this folder.")
    raise FileNotFoundError(MODEL_FILE)


print("=" * 60)
print("LOADING EXISTING MODEL")
print("=" * 60)

checkpoint = torch.load(
    MODEL_FILE,
    map_location=device,
    weights_only=False
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

print("✓ Epoch-2 model loaded")

print(
    "Previous best validation loss:",
    checkpoint.get("best_val_loss", "unknown")
)

print(
    "Previous saved epoch:",
    checkpoint.get("epoch", "unknown")
)

print()


# ============================================================
# 14. LOAD OPTIMIZER STATE IF AVAILABLE
# ============================================================

if "optimizer_state_dict" in checkpoint:

    optimizer.load_state_dict(
        checkpoint["optimizer_state_dict"]
    )

    print("✓ Optimizer state restored")

print()


# ============================================================
# 15. TRAINING FUNCTION
# ============================================================

def train_one_epoch(
    model,
    loader,
    criterion,
    optimizer
):

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (images, labels) in enumerate(loader):

        images = images.to(
            device,
            non_blocking=True
        )

        labels = labels.to(
            device,
            non_blocking=True
        )

        optimizer.zero_grad(
            set_to_none=True
        )

        # Mixed precision forward pass
        with torch.cuda.amp.autocast(
            enabled=use_amp
        ):

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

        # Backpropagation
        scaler.scale(loss).backward()

        scaler.step(optimizer)

        scaler.update()

        # Statistics
        running_loss += (
            loss.item() * images.size(0)
        )

        predictions = torch.argmax(
            outputs,
            dim=1
        )

        correct += (
            predictions == labels
        ).sum().item()

        total += labels.size(0)

        # Progress
        if (batch_idx + 1) % 200 == 0:

            print(
                f"  Batch {batch_idx + 1}/{len(loader)} "
                f"| Loss: {loss.item():.4f}"
            )

    epoch_loss = running_loss / total
    epoch_accuracy = correct / total

    return epoch_loss, epoch_accuracy


# ============================================================
# 16. VALIDATION FUNCTION
# ============================================================

def validate(
    model,
    loader,
    criterion
):

    model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():

        for images, labels in loader:

            images = images.to(
                device,
                non_blocking=True
            )

            labels = labels.to(
                device,
                non_blocking=True
            )

            with torch.cuda.amp.autocast(
                enabled=use_amp
            ):

                outputs = model(images)

                loss = criterion(
                    outputs,
                    labels
                )

            running_loss += (
                loss.item() * images.size(0)
            )

            predictions = torch.argmax(
                outputs,
                dim=1
            )

            correct += (
                predictions == labels
            ).sum().item()

            total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_accuracy = correct / total

    return epoch_loss, epoch_accuracy


# ============================================================
# 17. HISTORY
# ============================================================

history = {
    "epoch": [],
    "train_loss": [],
    "val_loss": [],
    "train_accuracy": [],
    "val_accuracy": [],
    "learning_rate": []
}


# ============================================================
# 18. LOAD PREVIOUS HISTORY IF AVAILABLE
# ============================================================

if os.path.exists(HISTORY_FILE):

    try:

        with open(HISTORY_FILE, "r") as f:
            old_history = json.load(f)

        # Handle history generated by previous script
        if "train_loss" in old_history:

            history["epoch"] = list(
                range(
                    1,
                    len(old_history["train_loss"]) + 1
                )
            )

            history["train_loss"] = old_history[
                "train_loss"
            ]

            history["val_loss"] = old_history[
                "val_loss"
            ]

            history["train_accuracy"] = old_history[
                "train_accuracy"
            ]

            history["val_accuracy"] = old_history[
                "val_accuracy"
            ]

            history["learning_rate"] = old_history[
                "learning_rate"
            ]

            print(
                f"✓ Previous history loaded "
                f"({len(history['train_loss'])} epochs)"
            )

    except Exception:

        print(
            "Could not load previous history."
        )

print()


# ============================================================
# 19. BEST VALIDATION LOSS
# ============================================================

best_val_loss = checkpoint.get(
    "best_val_loss",
    float("inf")
)


# ============================================================
# 20. TRAINING
# ============================================================

print("=" * 60)
print("RESUMING TRAINING")
print("=" * 60)

print(
    f"Continuing from Epoch {START_EPOCH}"
)

print(
    f"Training until Epoch {TOTAL_EPOCHS}"
)

print(
    f"Batch size: {BATCH_SIZE}"
)

print(
    f"AMP enabled: {use_amp}"
)

print(
    f"DataLoader workers: {NUM_WORKERS}"
)

print()


for epoch in range(
    START_EPOCH + 1,
    TOTAL_EPOCHS + 1
):

    print("-" * 60)

    print(
        f"Epoch {epoch}/{TOTAL_EPOCHS}"
    )

    print("-" * 60)

    # -------------------------
    # TRAIN
    # -------------------------

    train_loss, train_acc = train_one_epoch(
        model,
        train_loader,
        criterion,
        optimizer
    )

    # -------------------------
    # VALIDATION
    # -------------------------

    val_loss, val_acc = validate(
        model,
        val_loader,
        criterion
    )

    # -------------------------
    # SCHEDULER
    # -------------------------

    scheduler.step(val_loss)

    current_lr = optimizer.param_groups[0]["lr"]

    # -------------------------
    # HISTORY
    # -------------------------

    history["epoch"].append(epoch)

    history["train_loss"].append(
        train_loss
    )

    history["val_loss"].append(
        val_loss
    )

    history["train_accuracy"].append(
        train_acc
    )

    history["val_accuracy"].append(
        val_acc
    )

    history["learning_rate"].append(
        current_lr
    )

    # -------------------------
    # RESULTS
    # -------------------------

    print()

    print(
        f"Train Loss:     {train_loss:.4f}"
    )

    print(
        f"Train Accuracy: {train_acc * 100:.2f}%"
    )

    print(
        f"Val Loss:       {val_loss:.4f}"
    )

    print(
        f"Val Accuracy:   {val_acc * 100:.2f}%"
    )

    print(
        f"Learning Rate:  {current_lr:.6f}"
    )

    # -------------------------
    # SAVE BEST MODEL
    # -------------------------

    if val_loss < best_val_loss:

        best_val_loss = val_loss

        checkpoint = {
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "best_val_loss": best_val_loss,
            "class_names": train_dataset.labels,
            "mean": MEAN,
            "std": STD,
            "num_classes": num_classes
        }

        torch.save(
            checkpoint,
            MODEL_FILE
        )

        print()
        print(
            "✓ Best model saved:",
            MODEL_FILE
        )

    # -------------------------
    # SAVE HISTORY AFTER EVERY
    # EPOCH
    # -------------------------

    with open(HISTORY_FILE, "w") as f:

        json.dump(
            history,
            f,
            indent=4
        )

    print()


# ============================================================
# 21. TRAINING CURVES
# ============================================================

epochs = history["epoch"]


# -------------------------
# Loss
# -------------------------

plt.figure(figsize=(8, 5))

plt.plot(
    epochs,
    history["train_loss"],
    label="Training Loss"
)

plt.plot(
    epochs,
    history["val_loss"],
    label="Validation Loss"
)

plt.xlabel("Epoch")
plt.ylabel("Loss")

plt.title(
    "DenseNet-121 Training and Validation Loss"
)

plt.legend()
plt.grid(True)

plt.tight_layout()

plt.savefig(
    LOSS_CURVE_FILE,
    dpi=150
)

plt.close()


# -------------------------
# Accuracy
# -------------------------

plt.figure(figsize=(8, 5))

plt.plot(
    epochs,
    history["train_accuracy"],
    label="Training Accuracy"
)

plt.plot(
    epochs,
    history["val_accuracy"],
    label="Validation Accuracy"
)

plt.xlabel("Epoch")
plt.ylabel("Accuracy")

plt.title(
    "DenseNet-121 Training and Validation Accuracy"
)

plt.legend()
plt.grid(True)

plt.tight_layout()

plt.savefig(
    ACC_CURVE_FILE,
    dpi=150
)

plt.close()


# ============================================================
# 22. FINISHED
# ============================================================

print("=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)

print(
    "Best validation loss:",
    best_val_loss
)

print()

print("Files:")

print("✓", MODEL_FILE)
print("✓", HISTORY_FILE)
print("✓", LOSS_CURVE_FILE)
print("✓", ACC_CURVE_FILE)

print()

print("Stage 5 baseline training completed.")