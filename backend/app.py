import os
import sys
import torch
from torchvision import transforms
from PIL import Image
import timm
import requests
from dotenv import load_dotenv
from datetime import datetime, timezone
import calendar
from collections import Counter
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
import tempfile
import time
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "best_efficientnet_medwaste.pth")
OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
FIREBASE_COLLECTION = os.getenv("FIREBASE_COLLECTION", "waste_records")

# Firebase Initialization
try:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase connected successfully.")
except Exception as e:
    print(f"❌ Firebase connection failed: {e}")
    db = None

# Waste classes and mappings
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

category_descriptions = {
    "Pathological Waste": "Human anatomical waste, body parts, tissues, organs, and animal carcasses.",
    "Sharps Waste": "Needles, syringes, scalpels, blades, and other sharp objects that can cause puncture or cuts.",
    "Infectious Waste": "Waste contaminated with blood or body fluids, cultures, stocks from laboratories.",
    "Chemical / Heavy Metal Waste": "Expired or discarded chemicals, mercury-containing devices, batteries.",
    "Non-Hazardous / Organic Waste": "Food waste, garden waste, other organic materials from medical facilities.",
    "Non-Hazardous Waste": "General waste not contaminated with hazardous materials."
}

color_descriptions = {
    "red": "Infectious waste, blood products",
    "blue": "Pharmaceutical waste, medications",
    "yellow": "Sharps, needles",
    "black": "General medical waste"
}

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
            "Neutralize acids/bases if required.",
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

color_map = {
    "Pathological Waste": "yellow",
    "Sharps Waste": "yellow",
    "Infectious Waste": "red",
    "Chemical / Heavy Metal Waste": "blue",
    "Non-Hazardous / Organic Waste": "black",
    "Non-Hazardous Waste": "black"
}

# Load Model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
try:
    model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=len(classes))
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device).eval()
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    sys.exit(1)

# Image Transform
transform = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Prediction function
def predict_image(image_path):
    img = Image.open(image_path).convert("RGB")
    img_t = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(img_t)
        probs = torch.softmax(outputs, dim=1)
        conf, idx = torch.max(probs, dim=1)
        confidence = float(conf.item())
        cls_name = classes[idx.item()]

    category = category_map.get(cls_name, "Unknown")
    disposal_info = disposal_map.get(category, {"technique": "Unknown", "steps": []})
    return cls_name, category, disposal_info["technique"], disposal_info["steps"], confidence

# LLM Reusability Analysis
def analyze_reusability(description):
    if not OPENROUTER_KEY:
        return "⚠️ LLM key missing."

    prompt = f"""
You are a sustainability expert. Analyze this waste for reusability/recycling.
Item: {description}
Include: Reusable (T/F), Repurposable (T/F), Recovery Method, Possible New Use, Safety, Pooling Options
"""
    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"}
    data = {
        "model": "meta-llama/Llama-3-70b-instruct",
        "messages": [
            {"role": "system", "content": "You are a biomedical waste recycling expert."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.6,
        "max_tokens": 200
    }
    try:
        res = requests.post(OPENROUTER_URL, headers=headers, json=data, timeout=15)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"❌ LLM request failed: {e}"

# Fetch all records from Firebase
def fetch_all_records():
    if not db:
        print("❌ No Firebase connection")
        return []
    try:
        records = db.collection(FIREBASE_COLLECTION).stream()
        data = []
        for record in records:
            rec = record.to_dict()
            # Parse timestamp_utc to datetime
            try:
                rec['datetime'] = datetime.fromisoformat(rec['timestamp_utc'].replace('Z', '+00:00'))
            except (KeyError, ValueError):
                rec['datetime'] = None
            data.append(rec)
        print(f"✅ Fetched {len(data)} records from Firebase")
        return data
    except Exception as e:
        print(f"❌ Error fetching records: {e}")
        return []

# FastAPI App
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/classify-medical-waste")
async def classify_medical_waste(file: UploadFile = File(...), container_color: str = Query('red')):
    start_time = time.time()
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(await file.read())
            image_path = tmp.name

        cls_name, category, technique, steps, confidence = predict_image(image_path)
        os.unlink(image_path)
        print(f"Prediction Time: {time.time() - start_time:.2f} seconds")
    
        # 1️⃣ Confidence Threshold Check
        if confidence < 0.5:
            return {
                "message": "⚠️ Low confidence: not confidently identified as medical waste.",
                "class_name": "Not a medical waste",
                "category": "Not a medical waste category",
                "category_description": "Prediction confidence below 50%; likely not medical waste or unclear image.",
                "disposal_technique": "N/A",
                "disposal_steps": [],
                "llm_reusability": "N/A",
                "container_color": container_color.lower(),
                "suggested_color": "N/A",
                "timestamp_utc": datetime.now(timezone.utc).isoformat()
            }

        # 2️⃣ Check for Unknown or Non-matching Category
        if category == "Unknown" or cls_name not in classes or cls_name.strip() == "(BT) Body Tissue or Organ":
            return {
                "message": "⚠️ No valid match found — the item does not correspond to known medical waste types.",
                "class_name": "Not a medical waste",
                "category": "Not a medical waste category",
                "category_description": "Model output did not match known medical waste categories.",
                "disposal_technique": "N/A",
                "disposal_steps": [],
                "llm_reusability": "N/A",
                "container_color": container_color.lower(),
                "suggested_color": "N/A",
                "timestamp_utc": datetime.now(timezone.utc).isoformat()
            }

        # 3️⃣ Proceed Normally for Valid Predictions
        description = f"{cls_name} ({category}), confidence {confidence:.2f}"
        llm_start = time.time()
        llm_result = analyze_reusability(description)
        print(f"LLM Time: {time.time() - llm_start:.2f} seconds")

        suggested_color = color_map.get(category, "black")
        timestamp_utc = datetime.now(timezone.utc).isoformat()

        response = {
            "class_name": cls_name,
            "category": category,
            "category_description": category_descriptions.get(category, "No description available."),
            "disposal_technique": technique,
            "disposal_steps": steps,
            "llm_reusability": llm_result,
            "container_color": container_color.lower(),
            "suggested_color": suggested_color,
            "timestamp_utc": timestamp_utc,
            "confidence": round(confidence, 2)
        }

        if db:
            try:
                doc_ref = db.collection(FIREBASE_COLLECTION).document()
                doc_ref.set(response)
                print(f"✅ Metadata stored in Firebase with ID: {doc_ref.id}")
            except Exception as e:
                print(f"❌ Error storing metadata: {e}")

        print(f"Total Time: {time.time() - start_time:.2f} seconds")
        return response

    except Exception as e:
        print(f"❌ Error in classify_medical_waste: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/summary")
async def get_summary():
    records = fetch_all_records()
    total = len(records)
    if total == 0:
        return {
            "total_classifications": 0,
            "most_common_class": "N/A",
            "monthly_percentages": {calendar.month_name[m]: 0 for m in range(1, 13)}
        }

    class_counts = Counter(r['class_name'] for r in records if r.get('class_name'))
    most_common = class_counts.most_common(1)[0][0] if class_counts else "N/A"

    # Calculate monthly percentages for the current year
    current_year = datetime.now().year
    monthly_counts = {m: 0 for m in range(1, 13)}
    for r in records:
        dt = r.get('datetime')
        if dt and dt.year == current_year:
            monthly_counts[dt.month] += 1
    monthly_percentages = {
        calendar.month_name[m]: round((count / total * 100), 1) if total > 0 else 0
        for m, count in monthly_counts.items()
    }

    return {
        "total_classifications": total,
        "most_common_class": most_common,
        "monthly_percentages": monthly_percentages
    }

@app.get("/api/analytics/yearly")
async def get_yearly(years: int = Query(default=5, ge=1, le=10)):
    records = fetch_all_records()
    current_year = datetime.now().year
    yearly = {}
    for y in range(current_year - years + 1, current_year + 1):
        count = sum(1 for r in records if r.get('datetime') and r['datetime'].year == y)
        yearly[y] = count
    return [[year, count] for year, count in sorted(yearly.items())]

@app.get("/api/analytics/monthly/{year}")
async def get_monthly(year: int):
    records = fetch_all_records()
    monthly = {m: 0 for m in range(1, 13)}
    for r in records:
        dt = r.get('datetime')
        if dt and dt.year == year:
            monthly[dt.month] += 1
    return [{"month": calendar.month_name[m], "classifications": count} for m, count in sorted(monthly.items())]

@app.get("/api/analytics/color-breakdown/{year}/{month}")
async def get_color_breakdown(year: int, month: str):
    month = month.capitalize()  # Normalize month name
    try:
        month_num = list(calendar.month_name).index(month)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid month: {month}")
    
    records = fetch_all_records()
    color_counts = {"red": 0, "blue": 0, "yellow": 0, "black": 0}
    total = 0
    for r in records:
        dt = r.get('datetime')
        color = r.get('container_color')
        if dt and dt.year == year and dt.month == month_num and color in color_counts:
            color_counts[color] += 1
            total += 1

    breakdown = []
    for color, count in color_counts.items():
        percentage = (count / total * 100) if total > 0 else 0
        breakdown.append({
            "color": color.capitalize(),
            "count": count,
            "percentage": round(percentage, 1),
            "description": color_descriptions.get(color, "No description")
        })
    return breakdown

@app.get("/api/analytics/class-breakdown/{year}/{month}")
async def get_class_breakdown(year: int, month: str):
    month = month.capitalize()  # Normalize month name
    try:
        month_num = list(calendar.month_name).index(month)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid month: {month}")
    
    records = fetch_all_records()
    class_counts = {}
    total = 0
    for r in records:
        dt = r.get('datetime')
        cls = r.get('class_name')
        if dt and dt.year == year and dt.month == month_num and cls:
            class_counts[cls] = class_counts.get(cls, 0) + 1
            total += 1

    breakdown = []
    for cls, count in class_counts.items():
        percentage = (count / total * 100) if total > 0 else 0
        breakdown.append({
            "class": cls,
            "count": count,
            "percentage": round(percentage, 1),
        })
    # Return top 5 classes sorted by percentage
    return sorted(breakdown, key=lambda x: x['percentage'], reverse=True)[:5]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)