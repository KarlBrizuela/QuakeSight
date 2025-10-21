# QuakeSight XGBoost Backend

Python Flask backend with XGBoost for earthquake risk prediction.

## ✅ Setup Complete!

The backend is already set up with all dependencies installed.

## 🚀 Quick Start

**From the root directory:**
```powershell
.\start-backend.ps1
```

**Or manually:**
```powershell
.\backend\venv\Scripts\python.exe .\backend\app.py
```

Server will start on `http://localhost:5000`

## 📋 First Time Setup (Already Done!)

If you need to reinstall:

1. **Create virtual environment:**
   ```powershell
   cd backend
   python -m venv venv
   ```

2. **Install dependencies:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   pip install --only-binary :all: flask flask-cors xgboost pandas scikit-learn python-dotenv numpy
   ```

## 🧪 Test the API

**Health Check:**
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/health
```

**Test Prediction:**
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

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and model information.

### Predict Future Risk
```
POST /api/predict
Content-Type: application/json

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

**Response:**
```json
{
  "success": true,
  "prediction": {
    "current_risk_score": 65.5,
    "future_risk_score": 78.3,
    "risk_increase": 12.8,
    "percentage_increase": 19.5,
    "risk_level": "VERY HIGH RISK",
    "risk_color": "danger",
    "years_forward": 10,
    "confidence": 86,
    "methodology": "XGBoost Gradient Boosting",
    "feature_importance": {
      "fault_proximity": 0.142,
      "historical_quakes": 0.186,
      ...
    }
  }
}
```

## 🤖 Model Details

- **Algorithm:** XGBoost Gradient Boosting (200 trees)
- **Features:** 9 risk factors
  - Fault proximity (km)
  - Historical earthquakes count
  - Maximum magnitude recorded
  - Soil risk factor (0-1)
  - Building age factor (0-1)
  - Population density (people/km²)
  - Tsunami risk factor (0-1)
  - Current risk score (0-100)
  - Time horizon (years)
- **Output:** Future risk score (0-100) + feature importance
- **Training:** 1000 synthetic samples (replace with real PHIVOLCS data in production)

## 🛠️ Development

The model trains automatically on startup. To use real earthquake data:

1. Collect historical earthquake data from PHIVOLCS
2. Update `_initialize_model()` in `app.py`
3. Use real features and labels for training

## 📦 Dependencies

- Flask 3.0.0 - Web framework
- Flask-CORS 4.0.0 - Cross-origin support
- XGBoost 3.1.0 - Gradient boosting
- NumPy 2.3.4 - Numerical computing
- Pandas 2.3.3 - Data manipulation
- Scikit-learn 1.7.2 - ML utilities
- Python-dotenv 1.1.1 - Environment variables
