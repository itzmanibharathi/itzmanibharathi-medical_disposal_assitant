# test.py
import os
import torch
from torchvision import transforms
from PIL import Image
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# ------------------------
# Suppress gRPC / ALTS warnings
# ------------------------
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GRPC_TRACE"] = ""

# ------------------------
# Load environment variables
# ------------------------
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
FIREBASE_COLLECTION = os.getenv("FIREBASE_COLLECTION", "waste_records")
TIMEZONE = os.getenv("TIMEZONE", "UTC")

# ------------------------
# Firebase initialization
# ------------------------
try:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase connected successfully.")
except Exception as e:
    print(f"❌ Firebase connection failed: {e}")
    exit(1)

# ------------------------
# Waste Classes & Mapping
# ------------------------
classes = [
    "(BT) Body Tissue or Organ",
    "(GE) Glass equipment-packaging 551",
    "(ME) Metal equipment -packaging",
    "(OW) Organic wastes",
    "(PE) Plastic equipment-packaging",
    "(PP) Paper equipment-packaging",
    "(SN) Syringe needles",
    "Gloves",
    "Gauze",
    "Mask",
    "Syringe",
    "Tweezers"
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

# Disposal steps and main technique mapped by waste category
disposal_map = {
    "Pathological Waste": {
        "technique": "Incineration",
        "steps": [
            "Segregate and collect in red bags.",
            "Incinerate at high temperature (800–1200°C).",
            "If no incinerator, use deep burial in lined pits."
        ]
    },
    "Sharps Waste": {
        "technique": "Autoclave / Incineration",
        "steps": [
            "Collect in puncture-proof containers.",
            "Autoclave or incinerate.",
            "Encapsulation for sharps disposal."
        ]
    },
    "Infectious Waste": {
        "technique": "Autoclave / Chemical Disinfection",
        "steps": [
            "Segregate and store in biohazard containers.",
            "Autoclave or chemical disinfection.",
            "Incinerate if necessary."
        ]
    },
    "Chemical / Heavy Metal Waste": {
        "technique": "Chemical Neutralization / Incineration",
        "steps": [
            "Store in secure chemical containers.",
            "Neutralize acids/alkalis if required.",
            "Send to licensed hazardous waste disposal facility."
        ]
    },
    "Non-Hazardous / Organic Waste": {
        "technique": "Composting / Incineration",
        "steps": [
            "Compostable if possible.",
            "Incinerate if necessary.",
            "Dispose with general waste if safe."
        ]
    },
    "Non-Hazardous Waste": {
        "technique": "General Waste Disposal",
        "steps": [
            "Dispose with normal hospital/general waste streams."
        ]
    }
}

# ------------------------
# Load Model
# ------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
import timm
import torch.nn as nn

try:
    model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=len(classes))
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model = model.to(device)
    model.eval()
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit(1)

# ------------------------
# Image Transform
# ------------------------
transform = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

# ------------------------
# Predict Function
# ------------------------
def predict_image(image_path):
    img = Image.open(image_path).convert("RGB")
    img_t = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(img_t)
        probs = torch.softmax(outputs, dim=1)
        conf, idx = torch.max(probs, dim=1)
        cls_name = classes[idx.item()]
        category = category_map.get(cls_name, "Unknown")
        disposal_info = disposal_map.get(category, {"technique": "Unknown", "steps": []})
    return cls_name, category, disposal_info["technique"], disposal_info["steps"], float(conf.item())

# ------------------------
# Main
# ------------------------
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python test.py <image_path>")
        exit(0)
    
    image_path = sys.argv[1]
    cls_name, category, technique, steps, conf = predict_image(image_path)
    
    # Console output
    print("\n🔹 Detected Class:", cls_name)
    print("🔹 Waste Category:", category)
    print("🔹 Disposal Technique:", technique)
    print("🔹 Disposal Methodology / Steps:")
    for i, s in enumerate(steps, 1):
        print(f"   {i}. {s}")
    
    # Store in Firebase
    try:
        doc_ref = db.collection(FIREBASE_COLLECTION).document()
        doc_ref.set({
            "class_name": cls_name,
            "category": category,
            "disposal_technique": technique,
            "disposal_steps": steps,
            "timestamp_utc": datetime.now(timezone.utc).isoformat()
        })
        print(f"✅ Metadata stored successfully in Firebase with ID: {doc_ref.id}")
    except Exception as e:
        print(f"❌ Error storing metadata in Firebase: {e}")
