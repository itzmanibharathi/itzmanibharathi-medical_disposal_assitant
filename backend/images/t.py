#!/usr/bin/env python3
"""
Smart live medical waste detector:
- Multi-object detection (bounding boxes)
- Ignores duplicate detections (state tracking)
- Triggers alerts on changes
- Stores to Firebase when new class detected
- Ignores organic & BT waste
- Requires 75% minimum confidence
"""

import cv2
import torch
import time
import numpy as np
from PIL import Image
from datetime import datetime, timezone
from collections import deque
import firebase_admin
from firebase_admin import credentials, firestore
import os
import timm
from torchvision import transforms
from dotenv import load_dotenv
import hashlib

# --- Load env and model ---
load_dotenv()
MODEL_PATH = os.getenv("MODEL_PATH", "best_efficientnet_medwaste.pth")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

# Firebase init
db = None
try:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase connected.")
except Exception as e:
    print(f"⚠️ Firebase init failed: {e}")

classes = [
    "(BT) Body Tissue or Organ", "(GE) Glass equipment-packaging 551", "(ME) Metal equipment -packaging",
    "(OW) Organic wastes", "(PE) Plastic equipment-packaging", "(PP) Paper equipment-packaging",
    "(SN) Syringe needles", "Gloves", "Gauze", "Mask", "Syringe", "Tweezers"
]

category_map = {
    "(BT) Body Tissue or Organ": "Pathological Waste",
    "(GE) Glass equipment-packaging 551": "Sharps Waste",
    "(ME) Metal equipment -packaging": "Chemical / Heavy Metal Waste",
    "(OW) Organic wastes": "Non-Hazardous / Organic Waste",
    "(PE) Plastic equipment-packaging": "Non-Hazardous Waste",
    "(PP) Paper equipment-packaging": "Non-Hazardous Waste",
    "(SN) Syringe needles": "Sharps Waste",
    "Gloves": "Infectious Waste",
    "Gauze": "Infectious Waste",
    "Mask": "Infectious Waste",
    "Syringe": "Sharps Waste",
    "Tweezers": "Sharps Waste"
}

color_map = {
    "Pathological Waste": "yellow",
    "Sharps Waste": "yellow",
    "Infectious Waste": "red",
    "Chemical / Heavy Metal Waste": "blue",
    "Non-Hazardous / Organic Waste": "black",
    "Non-Hazardous Waste": "black"
}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=len(classes))
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.to(device).eval()
print("✅ Model loaded.")

transform = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def classify_patch(patch):
    img = Image.fromarray(cv2.cvtColor(patch, cv2.COLOR_BGR2RGB))
    t = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        out = model(t)
        prob = torch.softmax(out, dim=1)
        conf, idx = torch.max(prob, dim=1)
    return classes[idx.item()], float(conf.item())

# --- Motion / Object Detection ---
def detect_objects(frame, min_area=5000):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    _, thresh = cv2.threshold(blur, 100, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > min_area:
            x, y, w, h = cv2.boundingRect(cnt)
            boxes.append((x, y, w, h))
    return boxes

# --- Firebase Store ---
def store_detection(data):
    if not db:
        return
    try:
        db.collection("waste_records").add(data)
        print(f"🗂️ Stored: {data['class_name']} ({data['confidence']})")
    except Exception as e:
        print(f"❌ Firestore store failed: {e}")

# --- Detection State Memory ---
last_seen_hashes = deque(maxlen=20)

def make_hash(cls_name, x, y, w, h):
    return hashlib.md5(f"{cls_name}:{x}:{y}:{w}:{h}".encode()).hexdigest()

# --- Main Loop ---
cap = cv2.VideoCapture(0)
prev_frame = None
cooldown = 2.0  # seconds between valid detections per object
last_detection_time = time.time()

MIN_CONFIDENCE = 0.75  # ✅ Increased from 0.5 to 0.75
IGNORE_CLASSES = ["(BT) Body Tissue or Organ", "(OW) Organic wastes"]  # ✅ Ignore BT & OW

print("🎥 Starting live detection. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Basic motion detection for change trigger
    if prev_frame is None:
        prev_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        continue

    diff = cv2.absdiff(prev_frame, cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY))
    _, diff_thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    motion_score = np.sum(diff_thresh) / 255

    # Process only if motion or periodic trigger
    if motion_score > 5000 or (time.time() - last_detection_time > cooldown):
        boxes = detect_objects(frame)
        current_hashes = []
        for (x, y, w, h) in boxes:
            roi = frame[y:y+h, x:x+w]
            cls_name, conf = classify_patch(roi)

            # ✅ Skip if below 75% confidence
            if conf < MIN_CONFIDENCE:
                continue

            # ✅ Skip if organic or body tissue
            if cls_name in IGNORE_CLASSES:
                continue

            hash_val = make_hash(cls_name, x, y, w, h)
            current_hashes.append(hash_val)

            if hash_val not in last_seen_hashes:
                # New object detected -> trigger alert
                category = category_map.get(cls_name, "Unknown")
                color = color_map.get(category, "black")
                timestamp = datetime.now(timezone.utc).isoformat()
                record = {
                    "class_name": cls_name,
                    "category": category,
                    "container_color": color,
                    "confidence": round(conf, 2),
                    "timestamp_utc": timestamp
                }
                store_detection(record)
                print(f"🚨 Alert: {cls_name} ({round(conf,2)})")

            # Draw box + label
            cv2.rectangle(frame, (x,y), (x+w,y+h), (0,255,0), 2)
            cv2.putText(frame, f"{cls_name} {conf:.2f}", (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

        last_seen_hashes.extend(current_hashes)
        last_detection_time = time.time()

    prev_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    cv2.imshow("Smart Medical Waste Detector", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
