# 🌍 QuakeSight - Earthquake Risk Assessment System

Advanced earthquake risk prediction system for the Philippines using React + Python XGBoost ML backend.

## 🚀 Quick Start (Full Stack)

### **Option 1: Automatic Launch**
```powershell
.\start-fullstack.ps1
```
This starts both backend (Python XGBoost) and frontend (React) automatically.

### **Option 2: Manual Start**

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
npm start
```

## 📋 Prerequisites

- **Node.js** 16+ (for React frontend)
- **Python** 3.8+ (for XGBoost backend)
- **npm** (comes with Node.js)

## 🛠️ First Time Setup

### Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --only-binary :all: flask flask-cors xgboost pandas scikit-learn python-dotenv numpy
```

### Frontend Setup
```powershell
npm install
```

## ✨ Features

### 🎯 Core Features
- **Real-time Risk Assessment** - Earthquake risk analysis for Philippine cities
- **XGBoost ML Predictions** - Future risk projections (5/10 years)
- **Comprehensive Database** - Hardcoded coastal/inland classifications
- **Historical Data** - USGS earthquake history integration
- **Interactive Dashboard** - View and compare saved assessments

### 🤖 Machine Learning
- **True XGBoost** gradient boosting (200 decision trees)
- **Feature Importance** tracking
- **9 Risk Factors** analyzed:
  - Fault line proximity
  - Historical earthquake frequency
  - Maximum magnitude recorded
  - Soil amplification risk
  - Building age/vulnerability
  - Population density exposure
  - Tsunami/coastal risk
  - Current risk baseline
  - Time horizon projection

### 📊 Data Sources
- **PSGC API** - Philippine city/region data
- **USGS Earthquake API** - Historical seismic activity
- **PHIVOLCS** - Fault line data (mock/reference)
- **Hardcoded Database** - Coastal/inland classifications (17 regions)

## 🌐 Application Structure

```
QuakeSight/
├── backend/                    # Python XGBoost API
│   ├── app.py                 # Flask server + ML model
│   ├── requirements.txt       # Python dependencies
│   └── venv/                  # Virtual environment
├── src/
│   ├── frontend/
│   │   ├── Prediction.jsx     # Main risk assessment
│   │   ├── PredictionHistory.jsx  # Saved assessments + ML predictions
│   │   └── Dashboard.jsx      # Overview dashboard
│   ├── firebase/
│   │   ├── config.js          # Firebase setup
│   │   └── predictionService.js  # Data persistence
│   └── components/
│       ├── Navbar.jsx
│       └── Footer.jsx
├── start-backend.ps1          # Backend launcher
├── start-fullstack.ps1        # Full stack launcher
└── package.json               # Node dependencies
```

## 🔧 Configuration

### Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Copy config to `src/firebase/config.js`
4. See `FIREBASE_SETUP.md` for details

### Google Maps API (Optional)
See `GOOGLE_MAPS_API_SETUP.md` for map integration

## 📡 API Endpoints

### Backend (Python - Port 5000)

**Health Check:**
```
GET http://localhost:5000/api/health
```

**Predict Future Risk:**
```
POST http://localhost:5000/api/predict
{
  "fault_proximity": 15.5,
  "historical_quakes": 25,
  "max_magnitude": 6.8,
  "soil_risk": 0.9,
  "building_age": 0.7,
  "population_density": 8500,
  "tsunami_risk": 0.8,
  "current_risk_score": 65.5,
  "years_forward": 10
}
```

### Frontend (React - Port 3000)
- `/` - Home/Dashboard
- `/prediction` - Risk Assessment Tool
- `/history` - Saved Predictions + ML Forecasts
- `/about` - About Page

## 🧪 Testing

### Test Backend API:
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/health
```

### Test Prediction:
```powershell
$body = @{
  fault_proximity = 15.5
  historical_quakes = 25
  max_magnitude = 6.8
  soil_risk = 0.9
  building_age = 0.7
  population_density = 8500
  tsunami_risk = 0.8
  current_risk_score = 65.5
  years_forward = 10
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/predict -Method POST -Body $body -ContentType "application/json"
```

## 📚 Documentation

- `backend/README.md` - Backend setup and API docs
- `FIREBASE_SETUP.md` - Firebase configuration
- `GOOGLE_MAPS_API_SETUP.md` - Maps integration
- `QUICK_START.md` - Quick start guide

## 🐛 Troubleshooting

### Backend Won't Start
```powershell
# Reinstall dependencies
cd backend
.\venv\Scripts\Activate.ps1
pip install --only-binary :all: flask flask-cors xgboost pandas scikit-learn python-dotenv numpy
```

### Frontend Connection Error
- Ensure backend is running on `http://localhost:5000`
- Check CORS is enabled in `backend/app.py`
- Verify firewall isn't blocking port 5000

### Python Not Found
- Install Python from https://python.org/downloads
- **Important:** Check "Add Python to PATH" during installation
- Restart terminal after installation

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```powershell
npm run build
# Deploy the build/ folder
```

### Backend (PythonAnywhere/Heroku/Railway)
```powershell
# Update app.py for production
# Use gunicorn instead of Flask dev server
pip install gunicorn
gunicorn app:app
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- **PHIVOLCS** - Earthquake monitoring data
- **USGS** - Historical earthquake database
- **PSA** - Philippine Standard Geographic Codes
- **XGBoost** - Gradient boosting framework
- **React** - Frontend framework
- **Firebase** - Cloud database

---

**Built with ❤️ for earthquake preparedness in the Philippines**
