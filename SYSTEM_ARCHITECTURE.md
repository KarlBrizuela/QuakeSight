# 🏗️ QuakeSight System Architecture

## System Flowchart

### Overall System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   React Frontend        │
                    │   (Port 3000)           │
                    │  - Dashboard            │
                    │  - Prediction Page      │
                    │  - History Page         │
                    └────────┬────────┬───────┘
                             │        │
              ┌──────────────┘        └──────────────┐
              │                                       │
              ▼                                       ▼
    ┌─────────────────┐                   ┌──────────────────┐
    │  External APIs  │                   │  Python Backend  │
    │                 │                   │  (Port 5000)     │
    │  • PSGC API     │                   │                  │
    │  • USGS API     │                   │  XGBoost Model   │
    │  • Population   │                   │  • 200 Trees     │
    │    JSON Data    │                   │  • 9 Features    │
    └────────┬────────┘                   └────────┬─────────┘
             │                                      │
             │                                      │
             └──────────────┬───────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Firebase DB    │
                   │  (Firestore)    │
                   │                 │
                   │  • Predictions  │
                   │  • Assessments  │
                   │  • User Data    │
                   └─────────────────┘
```

---

## Detailed Component Flowchart

### 1. Risk Assessment Flow

```
START
  │
  ├─► User selects Region & City
  │
  ├─► Frontend fetches data from multiple sources:
  │    │
  │    ├─► PSGC API (City metadata, land area, coordinates)
  │    │
  │    ├─► Population JSON (Density, population count)
  │    │
  │    ├─► USGS API (Historical earthquakes, magnitudes)
  │    │
  │    └─► Hardcoded Database (Coastal/Inland classification)
  │
  ├─► User selects parameters:
  │    │
  │    ├─► Soil Type (Clay, Sand, Rock, etc.)
  │    │
  │    └─► Building Age (Pre-1990, 1990-2000, etc.)
  │
  ├─► Calculate Risk Score (7 factors):
  │    │
  │    ├─► Fault Proximity (25% weight)
  │    ├─► Historical Quakes (20% weight)
  │    ├─► Max Magnitude (15% weight)
  │    ├─► Soil Type (15% weight)
  │    ├─► Building Age (10% weight)
  │    ├─► Population Density (10% weight)
  │    └─► Tsunami Risk (5% weight)
  │
  ├─► Generate Risk Level:
  │    │
  │    ├─► ≥70: VERY HIGH RISK
  │    ├─► 55-69: HIGH RISK
  │    ├─► 40-54: MEDIUM RISK
  │    ├─► 25-39: LOW RISK
  │    └─► <25: VERY LOW RISK
  │
  ├─► Display Results with:
  │    │
  │    ├─► Overall Risk Score
  │    ├─► Factor-by-Factor Breakdown
  │    ├─► Confidence Level
  │    └─► Recommendations
  │
  └─► User Options:
       │
       ├─► Save to Firebase → Store in Firestore
       │
       └─► View History → Redirect to History Page
```

---

### 2. Future Risk Prediction Flow (XGBoost)

```
START (From History Page)
  │
  ├─► User clicks "Predict" on saved assessment
  │
  ├─► User selects timeframe:
  │    │
  │    ├─► 5 Years (2030)
  │    └─► 10 Years (2035)
  │
  ├─► Frontend extracts current factors:
  │    │
  │    ├─► From Firebase document:
  │    │     • seismicData.historicalQuakes
  │    │     • city.faultProximity
  │    │     • city.maxMagnitude
  │    │     • city.soilType
  │    │     • city.buildingAge
  │    │     • city.populationDensity
  │    │     • city.isCoastal
  │    │     • riskScore
  │    │
  │    └─► Convert to API format
  │
  ├─► Send POST request to Python Backend:
  │    │
  │    URL: http://localhost:5000/api/predict
  │    Method: POST
  │    Body: {
  │      fault_proximity: 15.5,
  │      historical_quakes: 25,
  │      max_magnitude: 6.8,
  │      soil_risk: 0.9,
  │      building_age: 0.7,
  │      population_density: 8500,
  │      tsunami_risk: 0.8,
  │      current_risk_score: 65.5,
  │      years_forward: 10
  │    }
  │
  ├─► Python Backend processes with XGBoost:
  │    │
  │    ├─► Load trained XGBoost model (200 trees)
  │    │
  │    ├─► Generate feature matrix
  │    │
  │    ├─► Predict using gradient boosting
  │    │
  │    ├─► Calculate feature importance
  │    │
  │    └─► Return prediction with confidence
  │
  ├─► Frontend receives prediction:
  │    │
  │    ├─► Future risk score (0-100)
  │    ├─► Risk increase (absolute & percentage)
  │    ├─► Future risk level classification
  │    ├─► Feature importance weights
  │    └─► Model confidence (70-95%)
  │
  ├─► Display detailed prediction:
  │    │
  │    ├─► Current vs Future Risk Comparison
  │    ├─► Factor-by-Factor Predictions
  │    ├─► Feature Importance Chart
  │    └─► XGBoost Model Methodology
  │
  └─► User can export results
```

---

### 3. Data Loading & Caching Flow

```
Application Startup
  │
  ├─► Initialize React App
  │
  ├─► Load Population Density JSON (Local)
  │    │
  │    └─► Cache in memory for fast lookup
  │
  ├─► Fetch Philippine Regions (PSGC API)
  │    │
  │    ├─► 17 Regions + BARMM
  │    │
  │    └─► Cache region list
  │
  ├─► User selects region → Fetch cities
  │    │
  │    ├─► PSGC API call for region cities
  │    │
  │    ├─► Sort alphabetically (A-Z)
  │    │
  │    └─► Populate city dropdown
  │
  ├─► User selects city → Fetch comprehensive data
  │    │
  │    ├─► PARALLEL API CALLS:
  │    │    │
  │    │    ├─► PSGC: Land area, coordinates
  │    │    │
  │    │    ├─► Population JSON: Density, population
  │    │    │
  │    │    └─► USGS: Earthquake history (async)
  │    │
  │    ├─► Check coastal status (Hardcoded DB)
  │    │
  │    └─► Calculate fault proximity (Mock data)
  │
  └─► All data ready for risk calculation
```

---

### 4. Firebase Save/Retrieve Flow

```
SAVE FLOW:
  │
  ├─► User clicks "Save Assessment"
  │
  ├─► Prepare prediction object:
  │    {
  │      city: { name, region, coordinates, ... },
  │      riskScore: 65.5,
  │      riskLevel: "HIGH RISK",
  │      confidence: 85,
  │      factorDetails: [...],
  │      recommendations: [...],
  │      timestamp: Date
  │    }
  │
  ├─► Firebase Firestore.collection("predictions").add()
  │
  ├─► Receive document ID
  │
  └─► Show success message with ID


RETRIEVE FLOW:
  │
  ├─► User navigates to History Page
  │
  ├─► Load predictions from Firebase:
  │    │
  │    ├─► Query: Firestore.collection("predictions")
  │    │
  │    ├─► Options:
  │    │    • Filter by risk level
  │    │    • Limit: 100 records
  │    │    • Order by: timestamp DESC
  │    │
  │    └─► Return array of prediction documents
  │
  ├─► Calculate statistics:
  │    │
  │    ├─► Total assessments
  │    ├─► Risk level distribution
  │    ├─► Average risk score
  │    └─► Regions analyzed
  │
  ├─► Display in table with:
  │    │
  │    ├─► City name & region
  │    ├─► Risk level badge
  │    ├─► Risk score
  │    ├─► Population density
  │    ├─► Assessment date
  │    │
  │    └─► Action buttons:
  │         • View (detailed modal)
  │         • Predict (ML forecast)
  │
  └─► User interactions:
       │
       ├─► Click "View" → Show detailed assessment modal
       │
       └─► Click "Predict" → Open ML prediction modal
```

---

## Entity Relationship Diagram (ERD)

### Database Schema (Firebase Firestore)

```
┌──────────────────────────────────────────────────────────────┐
│                    PREDICTIONS COLLECTION                      │
├──────────────────────────────────────────────────────────────┤
│  Document ID: Auto-generated (e.g., "abc123xyz456")          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📋 ASSESSMENT METADATA                                       │
│  ├─ id: String (document ID)                                 │
│  ├─ timestamp: Timestamp (creation date/time)                │
│  ├─ riskScore: Number (0-100)                                │
│  ├─ riskLevel: String ("VERY HIGH RISK", "HIGH RISK", etc.) │
│  ├─ riskColor: String ("danger", "warning", "info", etc.)   │
│  └─ confidence: Number (0-100, percentage)                   │
│                                                               │
│  🏙️ CITY OBJECT (Nested)                                     │
│  ├─ name: String (city/municipality name)                    │
│  ├─ region: String (Philippine region)                       │
│  ├─ coordinates: Object                                       │
│  │   ├─ lat: Number (latitude)                               │
│  │   └─ lng: Number (longitude)                              │
│  ├─ landArea: Number (km²)                                    │
│  ├─ population: Number (total population)                    │
│  ├─ populationDensity: Number (people/km²)                   │
│  ├─ populationDataSource: String (data source name)          │
│  ├─ isAccuratePopulationData: Boolean                        │
│  ├─ isCoastal: Boolean                                        │
│  ├─ soilType: String ("Clay", "Sand", "Rock", etc.)         │
│  ├─ buildingAge: String ("Pre-1990", "1990-2000", etc.)     │
│  ├─ faultProximity: Number (km to nearest fault)            │
│  ├─ maxMagnitude: Number (highest recorded magnitude)        │
│  ├─ dataSource: String (magnitude data source)               │
│  └─ dataExplanation: String (additional context)             │
│                                                               │
│  📊 SEISMIC DATA (Nested Object)                             │
│  ├─ historicalQuakes: Number (earthquake count)              │
│  ├─ buildingAge: String (redundant, for compatibility)       │
│  ├─ dataSource: String (census year, etc.)                   │
│  ├─ faultProximity: Number (redundant)                       │
│  ├─ isEnhancedData: Boolean                                  │
│  ├─ maxMagnitude: Number (redundant)                         │
│  └─ soilType: String (redundant)                             │
│                                                               │
│  📈 FACTOR DETAILS (Array of Objects)                        │
│  └─ [ ] factorDetails: Array                                 │
│      └─ Each factor:                                          │
│          ├─ factor: String (factor name)                     │
│          ├─ value: String (factor value/description)         │
│          ├─ score: String (0-100 score)                      │
│          ├─ weightedScore: String (weighted contribution)    │
│          ├─ impact: String ("HIGH", "MEDIUM", "LOW")         │
│          ├─ explanation: String (detailed explanation)       │
│          ├─ dataSource: String (optional)                    │
│          ├─ riskLevel: String (optional)                     │
│          └─ dataQuality: String (optional)                   │
│                                                               │
│  💡 RECOMMENDATIONS (Array)                                   │
│  └─ [ ] recommendations: Array<String>                       │
│      └─ List of safety recommendations                       │
│                                                               │
│  📝 ADDITIONAL FIELDS                                         │
│  ├─ overallExplanation: String (summary text)                │
│  ├─ weightedRiskScore: String (alternative score)            │
│  ├─ mlRisk5yr: Number (optional ML prediction)               │
│  ├─ mlRisk10yr: Number (optional ML prediction)              │
│  ├─ years: String ("Current")                                │
│  ├─ predictedRisk: Number (optional)                         │
│  └─ features: Array<Number> (ML feature vector)              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Relationships

```
┌─────────────────┐
│   USER          │
│  (Frontend)     │
└────────┬────────┘
         │
         │ Creates/Views
         │
         ▼
┌─────────────────┐         ┌──────────────────┐
│  PREDICTION     │◄────────│  CITY DATA       │
│  (Document)     │ Contains│  (Nested Object) │
└────────┬────────┘         └──────────────────┘
         │
         │ Has Many
         │
         ▼
┌─────────────────┐
│  FACTOR DETAIL  │
│  (Array Item)   │
└─────────────────┘

┌─────────────────┐
│  SEISMIC DATA   │
│  (Nested Object)│
└─────────────────┘
```

---

## External API Integration

```
┌────────────────────────────────────────────────────────┐
│                   EXTERNAL DATA SOURCES                 │
└────────────────────────────────────────────────────────┘

┌──────────────────┐
│   PSGC API       │────► Region/City metadata
│   (Government)   │      Land area, coordinates
└──────────────────┘

┌──────────────────┐
│   USGS API       │────► Historical earthquakes
│   (International)│      Magnitude data, events
└──────────────────┘

┌──────────────────┐
│  Population JSON │────► Population statistics
│  (Local File)    │      Density, census data
└──────────────────┘

┌──────────────────┐
│  Hardcoded DB    │────► Coastal classification
│  (In-App)        │      17 regions, 1000+ cities
└──────────────────┘
```

---

## Machine Learning Pipeline

```
┌─────────────────────────────────────────────────────────┐
│              XGBoost PREDICTION PIPELINE                 │
└─────────────────────────────────────────────────────────┘

INPUT FEATURES (9):
├─ fault_proximity: Float (km)
├─ historical_quakes: Integer (count)
├─ max_magnitude: Float (Richter scale)
├─ soil_risk: Float (0-1, normalized)
├─ building_age: Float (0-1, normalized)
├─ population_density: Float (people/km²)
├─ tsunami_risk: Float (0-1, coastal factor)
├─ current_risk_score: Float (0-100)
└─ years_forward: Integer (5 or 10)

        ▼

XGBOOST MODEL:
├─ Algorithm: Gradient Boosting
├─ Trees: 200 decision trees
├─ Max Depth: 6 levels
├─ Learning Rate: 0.1
├─ Subsample: 0.8
├─ Regularization: L1=0.1, L2=1.0
└─ Training Samples: 1000 synthetic

        ▼

OUTPUT:
├─ future_risk_score: Float (0-100)
├─ risk_increase: Float (absolute change)
├─ percentage_increase: Float (% change)
├─ risk_level: String (classification)
├─ confidence: Integer (70-95%)
└─ feature_importance: Object
    ├─ fault_proximity: 0.142
    ├─ historical_quakes: 0.186
    ├─ max_magnitude: 0.125
    └─ ... (9 total features)
```

---

## System Architecture Summary

### Technology Stack

**Frontend:**
- React 18.2.0
- Bootstrap 5.3.8
- TensorFlow.js 4.22.0 (optional)
- Firebase SDK 12.4.0

**Backend:**
- Python 3.8+
- Flask 3.0.0
- XGBoost 3.1.0
- NumPy 2.3.4
- Pandas 2.3.3
- Scikit-learn 1.7.2

**Database:**
- Firebase Firestore (NoSQL)

**External APIs:**
- PSGC API (Philippine regions/cities)
- USGS Earthquake API (historical data)

### Data Flow Summary

1. **User Input** → Region & City selection + parameters
2. **Data Aggregation** → Multiple API calls + local data
3. **Risk Calculation** → 7-factor weighted scoring
4. **Result Display** → Interactive UI with charts
5. **Persistence** → Save to Firebase Firestore
6. **Retrieval** → Load saved assessments
7. **ML Prediction** → XGBoost future forecasting
8. **Export** → Results & recommendations

### Key Features

✅ Real-time risk assessment  
✅ Multi-source data integration  
✅ Machine learning predictions  
✅ Historical data tracking  
✅ Interactive visualization  
✅ Cloud data persistence  
✅ Responsive UI/UX  
✅ Comprehensive documentation  

---

**Last Updated:** October 22, 2025  
**Version:** 1.0.0  
**System:** QuakeSight Earthquake Risk Assessment
