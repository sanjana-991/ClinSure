import matplotlib.pyplot as plt
import torch
import pandas as pd
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import os


# -----------------------------------------
# Normalization values from TRAINING data
# -----------------------------------------

mean = [0.5407, 0.5407, 0.5407]
std = [0.2419, 0.2419, 0.2419]


# -----------------------------------------
# Transforms
# -----------------------------------------

train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomRotation(5),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])

val_test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])


# -----------------------------------------
# Dataset
# -----------------------------------------

class ChestXrayDataset(Dataset):

    def __init__(self, csv_file, image_dir, split, transform):
        df = pd.read_csv(csv_file)

        self.df = df[df["split"] == split].reset_index(drop=True)
        self.image_dir = image_dir
        self.transform = transform

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
        image = self.transform(image)

        label = self.label_to_id[row["label"]]

        return image, label


# -----------------------------------------
# Create datasets
# -----------------------------------------

train_dataset = ChestXrayDataset(
    "split_manifest.csv",
    "images",
    "train",
    train_transform
)

val_dataset = ChestXrayDataset(
    "split_manifest.csv",
    "images",
    "val",
    val_test_transform
)

test_dataset = ChestXrayDataset(
    "split_manifest.csv",
    "images",
    "test",
    val_test_transform
)


# -----------------------------------------
# Create DataLoaders
# -----------------------------------------

train_loader = DataLoader(
    train_dataset,
    batch_size=16,
    shuffle=True,
    num_workers=0
)

val_loader = DataLoader(
    val_dataset,
    batch_size=16,
    shuffle=False,
    num_workers=0
)

test_loader = DataLoader(
    test_dataset,
    batch_size=16,
    shuffle=False,
    num_workers=0
)


# -----------------------------------------
# Verify
# -----------------------------------------

print("Train images:", len(train_dataset))
print("Validation images:", len(val_dataset))
print("Test images:", len(test_dataset))

print("Classes:", train_dataset.labels)

images, labels = next(iter(train_loader))

print("Batch image shape:", images.shape)
print("Batch labels shape:", labels.shape)

print("Batch minimum:", images.min().item())
print("Batch maximum:", images.max().item())

# -----------------------------------------
# Visual verification of a training batch
# -----------------------------------------

images, labels = next(iter(train_loader))

# Undo normalization for visualization
mean_t = torch.tensor(mean).view(3, 1, 1)
std_t = torch.tensor(std).view(3, 1, 1)

images = images * std_t + mean_t
images = images.clamp(0, 1)

plt.figure(figsize=(12, 8))

for i in range(8):
    plt.subplot(2, 4, i + 1)

    # Convert CHW -> HWC
    img = images[i].permute(1, 2, 0)

    plt.imshow(img)
    plt.title(train_dataset.labels[labels[i].item()])
    plt.axis("off")

plt.tight_layout()
plt.show()