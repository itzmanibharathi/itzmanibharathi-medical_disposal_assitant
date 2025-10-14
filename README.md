# Medical Waste Analytics Dashboard README
Project Overview
This project provides a comprehensive analytics dashboard for medical waste classifications, offering insights into waste categories, color-coded disposal patterns, and temporal trends. The backend uses FastAPI to handle waste classification using a pre-trained EfficientNet model, integrates with OpenRouter for reusability analysis, and stores data in Firebase Firestore. The frontend is a React application with Recharts for interactive visualizations, including yearly trends, monthly breakdowns, color distributions with progress bars, and top 5 waste classes. The dashboard is designed to help healthcare professionals monitor and optimize waste management practices.
Features

Yearly Trends: Bar chart displaying total waste classifications per year for the last 9 years.
Monthly Trends: Line chart showing monthly waste classifications for a selected year.
Color Distribution: Breakdown of waste by container color (Red, Blue, Black, Yellow) with count and percentage progress bars.
Top 5 Waste Classes: Displays the top 5 waste types (e.g., Syringes, Gloves) for a selected month with counts and percentages.
Top Analytics: Summary cards showing total classifications, peak month waste percentage, and most common color.

Tech Stack

Backend: FastAPI, Python, PyTorch (EfficientNet), Firebase Admin SDK, Requests (for OpenRouter), python-dateutil.
Frontend: React, Recharts, Axios, Tailwind CSS.
Database: Firebase Firestore (waste_records collection).
APIs:

/api/classify-medical-waste: Classifies uploaded images and stores results in Firebase.
/api/analytics/summary: Returns total items, category counts, and color mismatches.
/api/analytics/yearly: Returns yearly waste trends by category.
/api/waste-records: Returns all waste records for detailed breakdowns.



Prerequisites

Python 3.8+
Node.js 16+
Firebase Project with Firestore enabled and a waste_records collection.
Firebase service account key (JSON file) for authentication.
Pre-trained model weights (e.g., efficientnet_b0.pth) for waste classification.
OpenRouter API key for reusability analysis (optional; fallback provided if missing).

Setup Procedure
1. Clone the Repository
bashgit clone https://github.com/your-username/medical-waste-analytics.git
cd medical-waste-analytics
2. Backend Setup

Navigate to Backend Directory:
bashcd backend

Install Dependencies:
bashpip install fastapi uvicorn torch torchvision timm python-dotenv firebase-admin python-dateutil requests

Configure Environment Variables:

Create a .env file in the backend directory:
envMODEL_PATH=/path/to/your/model-weights.pth
OPENROUTER_KEY=your_openrouter_api_key
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions
FIREBASE_CREDENTIALS_PATH=/path/to/your/firebase-service-account-key.json
FIREBASE_COLLECTION=waste_records



Run the Backend:
bashuvicorn app:app --host 0.0.0.0 --port 8000

The API will be available at http://localhost:8000.
Test endpoints: http://localhost:8000/api/analytics/summary, http://localhost:8000/api/analytics/yearly?years=9, http://localhost:8000/api/waste-records.



3. Frontend Setup

Navigate to Frontend Directory:
bashcd ../frontend

Install Dependencies:
bashnpm install
npm install axios recharts

Configure Proxy:

For Create React App, add to package.json:
json"proxy": "http://localhost:8000"

For Vite, add to vite.config.js:
javascriptimport { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});



Run the Frontend:
bashnpm run dev

The dashboard will be available at http://localhost:3000/analysis.



4. Firebase Configuration

Create a Firebase project at https://console.firebase.google.com/.
Enable Firestore and create a waste_records collection.
Generate a service account key and download the JSON file.
Update .env with the key path.
Add test data to waste_records (e.g., using Firebase console):
json{
  "class_name": "Syringe",
  "category": "Sharps Waste",
  "container_color": "black",
  "suggested_color": "yellow",
  "timestamp_utc": "2025-10-14T15:45:00.123456+00:00"
}


Usage Procedure

Access the Dashboard:

Open http://localhost:3000/analysis in your browser.


Interact with Analytics:

Top Analytics: View total classifications, peak month waste percentage (e.g., "Oct (25.0%)"), and most common color.
Yearly Trends: Click a year bar to view monthly trends.
Monthly Trends: Click a month dot to view color distribution and top 5 waste classes.
Color Distribution: View count/percentage bars for colors (Red, Blue, Black, Yellow).
Top 5 Waste Classes: View the top 5 classes with counts and percentages for the selected month.


Add Data:

Use the /api/classify-medical-waste endpoint to upload images and store classifications in Firebase.
Example using curl:
bashcurl -X POST -F "file=@/path/to/image.jpg" "http://localhost:8000/api/classify-medical-waste?container_color=black"

Refresh the dashboard to see updated analytics.



Troubleshooting

Monthly Chart Not Showing:

Check console for Monthly Chart Data. If empty, verify /api/waste-records returns records with timestamp_utc.
Ensure selectedYear is a string (e.g., "2025").


Color Distribution Missing Progress Bars:

Verify monthlyColorData has count and percentage fields.
Check maxColorCount is calculated correctly.


Top 5 Classes Not Showing:

Ensure monthlyClassData is populated from monthlyClassBreakdown.
Verify class_name fields in Firebase records.


API Errors (e.g., 404):

Check backend logs for errors (e.g., Firebase connection).
Verify proxy settings in package.json or vite.config.js.
Test endpoints directly in Postman.


Firebase Issues:

Ensure .env has correct FIREBASE_CREDENTIALS_PATH.
Add index on timestamp_utc in Firestore for faster queries:
bashfirebase firestore:indexes create --collection-group=waste_records --field=timestamp_utc=ASCENDING




Contribution
Contributions are welcome! Fork the repository and submit a pull request with improvements or bug fixes.
License
MIT License. See LICENSE file for details.
text---


