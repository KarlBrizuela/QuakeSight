from flask import Flask, request, jsonify
from flask_cors import CORS
import xgboost as xgb
import numpy as np
import pandas as pd
from datetime import datetime
import os

app = Flask(__name__)

# Configure CORS for production
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# XGBoost Model for Earthquake Risk Prediction
class EarthquakeRiskPredictor:
    def __init__(self):
        self.model = None
        self.feature_names = [
            'fault_proximity',
            'historical_quakes',
            'max_magnitude',
            'soil_risk',
            'building_age',
            'population_density',
            'tsunami_risk',
            'current_risk_score',
            'years_forward'
        ]
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize and train XGBoost model with synthetic training data"""
        # Generate synthetic training data based on earthquake risk patterns
        np.random.seed(42)
        n_samples = 1000
        
        # Generate realistic feature combinations
        fault_proximity = np.random.uniform(0, 50, n_samples)
        historical_quakes = np.random.poisson(15, n_samples)
        max_magnitude = np.random.uniform(4.0, 8.0, n_samples)
        soil_risk = np.random.choice([0.5, 0.7, 0.9], n_samples)
        building_age = np.random.choice([0.5, 0.7, 0.9], n_samples)
        population_density = np.random.uniform(1000, 20000, n_samples)
        tsunami_risk = np.random.choice([0.2, 0.8], n_samples)
        current_risk_score = np.random.uniform(20, 80, n_samples)
        years_forward = np.random.choice([5, 10], n_samples)
        
        # Create feature matrix
        X = np.column_stack([
            fault_proximity,
            historical_quakes,
            max_magnitude,
            soil_risk,
            building_age,
            population_density,
            tsunami_risk,
            current_risk_score,
            years_forward
        ])
        
        # Generate target variable (future risk score) with realistic relationships
        y = (
            current_risk_score * (1 + years_forward * 0.008) +  # Base trend
            (50 - fault_proximity) * 0.3 +  # Fault proximity impact
            historical_quakes * 0.5 +  # Seismic history
            (max_magnitude - 5.0) * 5 +  # Magnitude impact
            soil_risk * 15 +  # Soil amplification
            building_age * 10 +  # Building vulnerability
            (population_density / 500) * 0.8 +  # Population exposure
            tsunami_risk * 8 +  # Coastal risk
            years_forward * 1.5 +  # Time degradation
            np.random.normal(0, 3, n_samples)  # Random noise
        )
        
        # Clip to valid range
        y = np.clip(y, 0, 100)
        
        # Train XGBoost model
        params = {
            'objective': 'reg:squarederror',
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 3,
            'gamma': 0.1,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'random_state': 42
        }
        
        self.model = xgb.XGBRegressor(**params)
        self.model.fit(X, y)
        
        print("✅ XGBoost model trained successfully!")
        print(f"   Features: {self.feature_names}")
        print(f"   Training samples: {n_samples}")
    
    def predict_future_risk(self, features):
        """Predict future earthquake risk using XGBoost"""
        if self.model is None:
            raise Exception("Model not initialized")
        
        # Prepare feature array
        X = np.array([[
            features['fault_proximity'],
            features['historical_quakes'],
            features['max_magnitude'],
            features['soil_risk'],
            features['building_age'],
            features['population_density'],
            features['tsunami_risk'],
            features['current_risk_score'],
            features['years_forward']
        ]])
        
        # Make prediction
        prediction = self.model.predict(X)[0]
        prediction = float(np.clip(prediction, 0, 100))
        
        # Get feature importance
        feature_importance = self.model.feature_importances_
        
        return {
            'predicted_risk_score': round(prediction, 2),
            'feature_importance': {
                name: round(float(importance), 4) 
                for name, importance in zip(self.feature_names, feature_importance)
            }
        }

# Initialize predictor
predictor = EarthquakeRiskPredictor()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'QuakeSight XGBoost API',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': predictor.model is not None
    })

@app.route('/api/predict', methods=['POST'])
def predict_risk():
    """Predict future earthquake risk"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = [
            'fault_proximity', 'historical_quakes', 'max_magnitude',
            'soil_risk', 'building_age', 'population_density',
            'tsunami_risk', 'current_risk_score', 'years_forward'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Make prediction
        result = predictor.predict_future_risk(data)
        
        # Calculate additional metrics
        current_risk = data['current_risk_score']
        future_risk = result['predicted_risk_score']
        risk_increase = future_risk - current_risk
        percentage_increase = (risk_increase / current_risk * 100) if current_risk > 0 else 0
        
        # Determine risk level
        if future_risk >= 70:
            risk_level = "VERY HIGH RISK"
            risk_color = "danger"
        elif future_risk >= 50:
            risk_level = "HIGH RISK"
            risk_color = "warning"
        elif future_risk >= 30:
            risk_level = "MEDIUM RISK"
            risk_color = "info"
        else:
            risk_level = "LOW RISK"
            risk_color = "success"
        
        # Calculate confidence (decreases with time)
        confidence = max(70, min(95, 90 - (data['years_forward'] * 2)))
        
        return jsonify({
            'success': True,
            'prediction': {
                'current_risk_score': round(current_risk, 1),
                'future_risk_score': round(future_risk, 1),
                'risk_increase': round(risk_increase, 1),
                'percentage_increase': round(percentage_increase, 1),
                'risk_level': risk_level,
                'risk_color': risk_color,
                'years_forward': data['years_forward'],
                'confidence': confidence,
                'methodology': 'XGBoost Gradient Boosting',
                'feature_importance': result['feature_importance']
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    """Predict multiple scenarios at once"""
    try:
        data = request.json
        predictions_input = data.get('predictions', [])
        
        if not predictions_input:
            return jsonify({
                'success': False,
                'error': 'No predictions provided'
            }), 400
        
        results = []
        for pred_data in predictions_input:
            result = predictor.predict_future_risk(pred_data)
            results.append({
                'input': pred_data,
                'prediction': result
            })
        
        return jsonify({
            'success': True,
            'predictions': results,
            'count': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV', 'development') == 'development'
    print(f"🚀 Starting QuakeSight XGBoost API on port {port}")
    print(f"🔧 Debug mode: {debug_mode}")
    print(f"🌐 Allowed origins: {allowed_origins}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
