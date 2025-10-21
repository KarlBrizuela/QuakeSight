import React, { useState, useEffect } from 'react';
import { getSavedPredictions, getPredictionsByRiskLevel, testCollectionAccess } from '../firebase/predictionService';
import { testFirebaseConnection } from '../firebase/testConnection';
import Navbar from '../components/Navbar';

function PredictionHistory() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [selectedPrediction, setSelectedPrediction] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showPredictModal, setShowPredictModal] = useState(false);
    const [selectedYears, setSelectedYears] = useState(5);
    const [futurePrediction, setFuturePrediction] = useState(null);
    const [predicting, setPredicting] = useState(false);

    useEffect(() => {
        loadPredictions();
    }, [filter]);

    const loadPredictions = async () => {
        setLoading(true);
        try {
            console.log('🔍 Loading predictions with filter:', filter);
            let result;
            if (filter === 'all') {
                result = await getSavedPredictions(100);
            } else {
                result = await getPredictionsByRiskLevel(filter);
            }

            console.log('📋 Firebase result:', result);

            if (result.success) {
                console.log('✅ Successfully loaded predictions:', result.data.length, 'items');
                setPredictions(result.data);
                calculateStats(result.data);
            } else {
                console.error('❌ Failed to load predictions:', result.error);
                setPredictions([]);
                setStats(null);
            }
        } catch (error) {
            console.error('❌ Exception loading predictions:', error);
            setPredictions([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const riskLevels = data.reduce((acc, pred) => {
            acc[pred.riskLevel] = (acc[pred.riskLevel] || 0) + 1;
            return acc;
        }, {});

        const avgRiskScore = data.length > 0 
            ? (data.reduce((sum, pred) => sum + pred.riskScore, 0) / data.length).toFixed(1)
            : 0;

        setStats({
            total: data.length,
            riskLevels,
            avgRiskScore,
            regionsAnalyzed: [...new Set(data.map(p => p.city.region))].length
        });
    };

    const formatDate = (timestamp) => {
        if (timestamp && timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleDateString();
        }
        return new Date(timestamp).toLocaleDateString();
    };

    const getRiskBadgeColor = (riskLevel) => {
        if (riskLevel.includes('VERY HIGH')) return 'bg-danger';
        if (riskLevel.includes('HIGH')) return 'bg-warning';
        if (riskLevel.includes('MEDIUM')) return 'bg-info';
        return 'bg-success';
    };

    const testFirebaseConnectivity = async () => {
        console.log('🧪 Testing Firebase connectivity...');
        try {
            // Test collection access with simpler function
            const result = await testCollectionAccess();
            console.log('🧪 Collection access test result:', result);
            
            setTestResult(result);
        } catch (error) {
            console.error('🧪 Firebase test error:', error);
            setTestResult({ 
                success: false, 
                error: error.message,
                message: 'Test failed with exception' 
            });
        }
    };

    // XGBoost prediction using Python backend API
    const predictFutureRisk = async (currentData, years) => {
        setPredicting(true);
        try {
            console.log('🤖 Starting XGBoost prediction for', years, 'years');
            console.log('📊 Current Data Structure:', currentData);
            console.log('🏙️ City Data:', currentData.city);
            console.log('🔍 Seismic Data:', currentData.seismicData);
            
            // Extract historical quakes from multiple possible locations
            const historicalQuakes = 
                currentData.seismicData?.historicalQuakes ||  // Check seismicData first (Firebase structure)
                currentData.city.historicalQuakes ||          // Check city object
                currentData.historicalQuakes ||               // Check root level
                0;
            
            console.log('📊 Historical Quakes Found:', historicalQuakes);
            
            // Extract current risk factors
            const currentFactors = {
                faultProximity: currentData.city.faultProximity || 25,
                historicalQuakes: historicalQuakes,
                maxMagnitude: currentData.city.maxMagnitude || currentData.maxMagnitude || 5.0,
                soilRisk: currentData.city.soilType === 'Soft Clay' ? 0.9 : 
                          currentData.city.soilType === 'Clay' ? 0.7 : 0.5,
                buildingAge: currentData.city.buildingAge === 'Pre-1990' ? 0.9 : 
                            currentData.city.buildingAge === '1990-2000' ? 0.7 : 0.5,
                populationDensity: currentData.city.populationDensity || 5000,
                tsunamiRisk: currentData.city.isCoastal ? 0.8 : 0.2,
                currentRiskScore: parseFloat(currentData.riskScore) || 50
            };
            
            console.log('🔍 Extracted Factors:', currentFactors);
            
            // Call Python XGBoost API
            const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const apiUrl = `${apiBaseUrl}/api/predict`;
            const requestBody = {
                fault_proximity: currentFactors.faultProximity,
                historical_quakes: currentFactors.historicalQuakes,
                max_magnitude: currentFactors.maxMagnitude,
                soil_risk: currentFactors.soilRisk,
                building_age: currentFactors.buildingAge,
                population_density: currentFactors.populationDensity,
                tsunami_risk: currentFactors.tsunamiRisk,
                current_risk_score: currentFactors.currentRiskScore,
                years_forward: years
            };
            
            console.log('🌐 Calling XGBoost API:', apiUrl);
            console.log('📤 Request body:', requestBody);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const apiResult = await response.json();
            console.log('✅ XGBoost API Response:', apiResult);
            
            if (!apiResult.success) {
                throw new Error(apiResult.error || 'Prediction failed');
            }
            
            const pred = apiResult.prediction;

            // Calculate factor-specific predictions for display
            const baseSeismicScore = Math.min(100, (currentFactors.historicalQuakes / 50) * 100);
            const timeFactors = {
                buildingDegradation: 1 + (years * 0.015),
                populationGrowth: 1 + (years * 0.02),
                seismicAccumulation: 1 + (years * 0.01)
            };
            
            const buildingRisk = currentFactors.buildingAge * 100 * timeFactors.buildingDegradation;
            const populationRisk = Math.min(100, (currentFactors.populationDensity / 200)) * timeFactors.populationGrowth;
            const seismicRisk = baseSeismicScore * timeFactors.seismicAccumulation;
            const faultProximityBoost = currentFactors.faultProximity < 10 ? 
                (10 - currentFactors.faultProximity) * 0.5 * years : 0;
            
            // Generate detailed factor predictions using API result
            const futureFactors = [
                {
                    factor: "Building Infrastructure Degradation",
                    current: currentFactors.buildingAge * 100,
                    future: buildingRisk,
                    increase: ((buildingRisk - (currentFactors.buildingAge * 100)) / (currentFactors.buildingAge * 100) * 100).toFixed(1),
                    explanation: `Buildings will age ${years} years, increasing structural vulnerability by ${((timeFactors.buildingDegradation - 1) * 100).toFixed(1)}%`,
                    importance: pred.feature_importance.building_age
                },
                {
                    factor: "Population Density Impact",
                    current: Math.min(100, (currentFactors.populationDensity / 200)),
                    future: populationRisk,
                    increase: ((populationRisk - Math.min(100, (currentFactors.populationDensity / 200))) / Math.min(100, (currentFactors.populationDensity / 200)) * 100).toFixed(1),
                    explanation: `Projected ${((timeFactors.populationGrowth - 1) * 100).toFixed(1)}% population growth will increase exposure`,
                    importance: pred.feature_importance.population_density
                },
                {
                    factor: "Cumulative Seismic Activity",
                    current: baseSeismicScore,
                    future: seismicRisk,
                    increase: ((seismicRisk - baseSeismicScore) / Math.max(1, baseSeismicScore) * 100).toFixed(1),
                    explanation: `${currentFactors.historicalQuakes} historical earthquakes with ${((timeFactors.seismicAccumulation - 1) * 100).toFixed(1)}% projected increase over ${years} years`,
                    importance: pred.feature_importance.historical_quakes
                },
                {
                    factor: "Fault Line Proximity Risk",
                    current: currentFactors.faultProximity,
                    future: currentFactors.faultProximity + faultProximityBoost,
                    increase: faultProximityBoost > 0 ? `+${faultProximityBoost.toFixed(1)}` : "0",
                    explanation: currentFactors.faultProximity < 10 ? 
                        "Critical proximity to fault lines amplifies long-term risk" : 
                        "Moderate distance provides some buffer",
                    importance: pred.feature_importance.fault_proximity
                }
            ];

            const prediction = {
                currentRiskScore: pred.current_risk_score,
                futureRiskScore: pred.future_risk_score,
                riskIncrease: pred.risk_increase,
                percentageIncrease: pred.percentage_increase,
                currentRiskLevel: currentData.riskLevel,
                futureRiskLevel: pred.risk_level,
                futureRiskColor: pred.risk_color,
                years: years,
                factors: futureFactors,
                confidence: pred.confidence,
                methodology: pred.methodology,
                featureImportance: pred.feature_importance,
                modelDetails: {
                    stages: [
                        "XGBoost gradient boosting trees",
                        "Feature importance analysis",
                        "Non-linear interaction modeling",
                        "Ensemble tree aggregation",
                        "L1/L2 regularization"
                    ],
                    weights: Object.entries(pred.feature_importance)
                        .sort((a, b) => b[1] - a[1])
                        .reduce((acc, [key, val]) => {
                            acc[key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())] = 
                                `${(val * 100).toFixed(1)}%`;
                            return acc;
                        }, {})
                }
            };

            console.log('✅ XGBoost prediction completed:', prediction);
            setFuturePrediction(prediction);
            
        } catch (error) {
            console.error('❌ XGBoost prediction error:', error);
            
            // Check if backend is running
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                alert('⚠️ Cannot connect to XGBoost backend.\n\nPlease ensure:\n1. Python backend is running (python backend/app.py)\n2. Server is accessible at http://localhost:5000\n3. CORS is enabled');
            } else {
                alert('Error generating prediction: ' + error.message);
            }
        } finally {
            setPredicting(false);
        }
    };

    return (
        <>
        <Navbar />
        <div className="container mt-4">
            <div className="card shadow border-0">
                <div className="card-header bg-gradient-info text-black py-4">
                    <h3>📊 Earthquake Risk Assessment History</h3>
                    <p className="mb-0">View and analyze saved earthquake risk assessments</p>
                </div>

                <div className="card-body">
                    {/* Statistics Dashboard */}
                    {stats && (
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card bg-primary text-white">
                                    <div className="card-body text-center">
                                        <h2>{stats.total}</h2>
                                        <small>Total Assessments</small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-success text-white">
                                    <div className="card-body text-center">
                                        <h2>{stats.regionsAnalyzed}</h2>
                                        <small>Regions Analyzed</small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-warning text-white">
                                    <div className="card-body text-center">
                                        <h2>{stats.avgRiskScore}</h2>
                                        <small>Avg Risk Score</small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-info text-white">
                                    <div className="card-body text-center">
                                        <h2>{stats.riskLevels['HIGH RISK'] || 0}</h2>
                                        <small>High Risk Areas</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filter Controls */}
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Filter by Risk Level</label>
                            <select
                                className="form-select"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Risk Levels</option>
                                <option value="VERY HIGH RISK">Very High Risk</option>
                                <option value="HIGH RISK">High Risk</option>
                                <option value="MEDIUM RISK">Medium Risk</option>
                                <option value="LOW RISK">Low Risk</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">&nbsp;</label>
                            <button
                                className="btn btn-primary d-block"
                                onClick={loadPredictions}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Refresh Data'}
                            </button>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">&nbsp;</label>
                            <button
                                className="btn btn-warning d-block"
                                onClick={testFirebaseConnectivity}
                            >
                                Test Firebase
                            </button>
                        </div>
                    </div>

                    {/* Firebase Test Results */}
                    {testResult && (
                        <div className={`alert ${testResult.success ? 'alert-success' : 'alert-danger'}`}>
                            <strong>Firebase Test Result:</strong> 
                            {testResult.success ? (
                                <div>
                                    <span className="text-success"> ✅ {testResult.message}</span>
                                    {testResult.count !== undefined && (
                                        <div><small>Documents found: {testResult.count}</small></div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <span className="text-danger"> ❌ {testResult.message || testResult.error}</span>
                                    {testResult.error && testResult.message !== testResult.error && (
                                        <div><small>Error: {testResult.error}</small></div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Predictions List */}
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading saved assessments...</p>
                        </div>
                    ) : predictions.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>City/Municipality</th>
                                        <th>Region</th>
                                        <th>Risk Level</th>
                                        <th>Risk Score</th>
                                        <th>Population Density</th>
                                        <th>Assessment Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map((pred) => (
                                        <tr key={pred.id}>
                                            <td>
                                                <strong>{pred.city.name}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    Risk Score: {pred.riskScore}/100
                                                </small>
                                            </td>
                                            <td>{pred.city.region}</td>
                                            <td>
                                                <span className={`badge ${getRiskBadgeColor(pred.riskLevel)}`}>
                                                    {pred.riskLevel}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{pred.riskScore}</strong>/100
                                                <br />
                                                <small className="text-muted">{pred.confidence}% confidence</small>
                                            </td>
                                            <td>
                                                {Math.round(pred.city.populationDensity).toLocaleString()} 
                                                <br />
                                                <small className="text-muted">people/km²</small>
                                            </td>
                                            <td>
                                                {formatDate(pred.timestamp)}
                                                <br />
                                                <small className="text-muted">
                                                    ID: {pred.id.substring(0, 8)}...
                                                </small>
                                            </td>
                                            <td>
                                                                <button 
                                                    className="btn btn-sm btn-outline-info me-1"
                                                    onClick={() => {
                                                        console.log('🔍 Selected prediction data:', pred);
                                                        console.log('📊 Factor details:', pred.factorDetails);
                                                        setSelectedPrediction(pred);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    View
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                        setSelectedPrediction(pred);
                                                        setFuturePrediction(null);
                                                        setSelectedYears(5);
                                                        setShowPredictModal(true);
                                                    }}
                                                >
                                                    Predict
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <h5>No saved assessments found</h5>
                            <p>Start by creating and saving some earthquake risk assessments!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            {showModal && selectedPrediction && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    📋 Risk Assessment Details - {selectedPrediction.city.name}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {/* Overall Risk Assessment */}
                                <div className={`alert alert-${selectedPrediction.riskColor} mb-4`}>
                                    <h4 className="alert-heading">{selectedPrediction.riskLevel}</h4>
                                    <p className="mb-2">{selectedPrediction.overallExplanation}</p>
                                    <hr />
                                    <p className="mb-0">
                                        <strong>Overall Risk Score:</strong> {selectedPrediction.riskScore}/100 | 
                                        <strong> Confidence Level:</strong> {selectedPrediction.confidence}%
                                    </p>
                                </div>

                                {/* City Information */}
                                <div className="card mb-3">
                                    <div className="card-header bg-primary text-white">
                                        <h6 className="mb-0">📍 Location Information</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <p><strong>City/Municipality:</strong> {selectedPrediction.city.name}</p>
                                                <p><strong>Region:</strong> {selectedPrediction.city.region}</p>
                                                <p><strong>Land Area:</strong> {selectedPrediction.city.landArea ? `${selectedPrediction.city.landArea} km²` : 'N/A'}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p><strong>Population Density:</strong> {Math.round(selectedPrediction.city.populationDensity).toLocaleString()} people/km²</p>
                                                {selectedPrediction.city.population && (
                                                    <p><strong>Population:</strong> {selectedPrediction.city.population.toLocaleString()}</p>
                                                )}
                                                <p><strong>Coastal:</strong> {selectedPrediction.city.isCoastal ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* Recommendations */}
                                {selectedPrediction.recommendations && selectedPrediction.recommendations.length > 0 && (
                                    <div className="card mb-3">
                                        <div className="card-header bg-success text-white">
                                            <h6 className="mb-0">🛡️ Risk Mitigation Recommendations</h6>
                                        </div>
                                        <div className="card-body">
                                            <ul className="list-group list-group-flush">
                                                {selectedPrediction.recommendations.map((rec, index) => (
                                                    <li key={index} className="list-group-item">
                                                        <small>{rec}</small>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Assessment Metadata */}
                                <div className="card">
                                    <div className="card-header bg-info text-white">
                                        <h6 className="mb-0">ℹ️ Assessment Information</h6>
                                    </div>
                                    <div className="card-body">
                                        <p><strong>Assessment Date:</strong> {formatDate(selectedPrediction.timestamp)}</p>
                                        <p><strong>Data Source:</strong> {selectedPrediction.city.dataSource || 'PSGC + USGS + PHIVOLCS APIs'}</p>
                                        <p className="mb-0"><strong>Assessment ID:</strong> {selectedPrediction.id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        window.location.href = `/prediction?region=${encodeURIComponent(selectedPrediction.city.region)}&city=${encodeURIComponent(selectedPrediction.city.name)}`;
                                    }}
                                >
                                    Run New Assessment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Future Risk Prediction Modal */}
            {showPredictModal && selectedPrediction && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPredictModal(false)}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    🔮 Future Risk Prediction - {selectedPrediction.city.name}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPredictModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {/* Current Assessment Summary */}
                                <div className="alert alert-info mb-4">
                                    <h6 className="alert-heading">📊 Current Risk Assessment</h6>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Risk Level:</strong> {selectedPrediction.riskLevel}</p>
                                            <p className="mb-1"><strong>Risk Score:</strong> {selectedPrediction.riskScore}/100</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>City:</strong> {selectedPrediction.city.name}</p>
                                            <p className="mb-1"><strong>Region:</strong> {selectedPrediction.city.region}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Year Selection */}
                                <div className="card mb-4">
                                    <div className="card-header bg-warning text-dark">
                                        <h6 className="mb-0">⏱️ Select Prediction Timeframe</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-md-6">
                                                <label className="form-label"><strong>Predict risk for:</strong></label>
                                                <select 
                                                    className="form-select form-select-lg"
                                                    value={selectedYears}
                                                    onChange={(e) => setSelectedYears(parseInt(e.target.value))}
                                                    disabled={predicting}
                                                >
                                                    <option value={5}>5 Years (2030)</option>
                                                    <option value={10}>10 Years (2035)</option>
                                                </select>
                                                <small className="text-muted">
                                                    Select the timeframe for XGBoost risk assessment
                                                </small>
                                            </div>
                                            <div className="col-md-6 text-center">
                                                <button 
                                                    className="btn btn-primary btn-lg"
                                                    onClick={() => predictFutureRisk(selectedPrediction, selectedYears)}
                                                    disabled={predicting}
                                                >
                                                    {predicting ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            Analyzing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            🤖 Generate Prediction
                                                        </>
                                                    )}
                                                </button>
                                                <div className="mt-2">
                                                    <small className="text-muted">
                                                        Using Python XGBoost Backend
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Prediction Results */}
                                {futurePrediction && (
                                    <>
                                        {/* Risk Comparison */}
                                        <div className={`alert alert-${futurePrediction.futureRiskColor} mb-4`}>
                                            <h5 className="alert-heading">📈 Predicted Risk in {futurePrediction.years} Years</h5>
                                            <div className="row">
                                                <div className="col-md-4 text-center border-end">
                                                    <h6 className="text-muted">Current</h6>
                                                    <h2>{futurePrediction.currentRiskScore}</h2>
                                                    <small>{futurePrediction.currentRiskLevel}</small>
                                                </div>
                                                <div className="col-md-4 text-center border-end">
                                                    <h6 className="text-muted">Future ({futurePrediction.years} years)</h6>
                                                    <h2 className="text-danger">{futurePrediction.futureRiskScore}</h2>
                                                    <small>{futurePrediction.futureRiskLevel}</small>
                                                </div>
                                                <div className="col-md-4 text-center">
                                                    <h6 className="text-muted">Risk Increase</h6>
                                                    <h2 className="text-warning">+{futurePrediction.riskIncrease}</h2>
                                                    <small>({futurePrediction.percentageIncrease}% increase)</small>
                                                </div>
                                            </div>
                                            <hr />
                                            <p className="mb-0">
                                                <strong>Model Confidence:</strong> {futurePrediction.confidence}% | 
                                                <strong> Methodology:</strong> {futurePrediction.methodology}
                                            </p>
                                        </div>

                                        {/* Factor-by-Factor Predictions */}
                                        <div className="card mb-4">
                                            <div className="card-header bg-success text-white">
                                                <h6 className="mb-0">🔍 Detailed Factor Predictions</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th>Risk Factor</th>
                                                                <th>Current Score</th>
                                                                <th>Future Score</th>
                                                                <th>Increase</th>
                                                                <th>Importance</th>
                                                                <th>Explanation</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {futurePrediction.factors.map((factor, index) => (
                                                                <tr key={index}>
                                                                    <td><strong>{factor.factor}</strong></td>
                                                                    <td>{factor.current.toFixed(1)}</td>
                                                                    <td className="text-danger">
                                                                        <strong>{factor.future.toFixed(1)}</strong>
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-warning">
                                                                            +{factor.increase}%
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-info">
                                                                            {(factor.importance * 100).toFixed(1)}%
                                                                        </span>
                                                                    </td>
                                                                    <td><small>{factor.explanation}</small></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Model Methodology */}
                                        <div className="card mb-3">
                                            <div className="card-header bg-info text-white">
                                                <h6 className="mb-0">🧠 XGBoost Model Details</h6>
                                            </div>
                                            <div className="card-body">
                                                <h6>XGBoost Gradient Boosting Stages:</h6>
                                                <ol>
                                                    {futurePrediction.modelDetails.stages.map((stage, index) => (
                                                        <li key={index}><small>{stage}</small></li>
                                                    ))}
                                                </ol>
                                                <hr />
                                                <h6>Feature Importance (XGBoost):</h6>
                                                <div className="row">
                                                    {Object.entries(futurePrediction.modelDetails.weights).map(([key, value], index) => (
                                                        <div className="col-md-6" key={index}>
                                                            <small><strong>{key}:</strong> {value}</small>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="alert alert-success mt-3 mb-0">
                                                    <small>
                                                        <strong>🐍 Python XGBoost Backend:</strong> This prediction uses true XGBoost gradient boosting 
                                                        with 200 decision trees trained on earthquake risk patterns. Feature importance is 
                                                        calculated from actual tree splits. Model confidence: {futurePrediction.confidence}%
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPredictModal(false)}>
                                    Close
                                </button>
                                {futurePrediction && (
                                    <button 
                                        type="button" 
                                        className="btn btn-success"
                                        onClick={() => {
                                            // You can implement export/save functionality here
                                            console.log('Exporting prediction:', futurePrediction);
                                            alert('Prediction data logged to console. Export functionality can be added here.');
                                        }}
                                    >
                                        📥 Export Results
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

export default PredictionHistory;