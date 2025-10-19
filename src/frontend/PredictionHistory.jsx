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
                                                    {pred.city.latitude}°N, {pred.city.longitude}°E
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
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                        // You can implement a detailed view modal here
                                                        console.log('View details for:', pred);
                                                    }}
                                                >
                                                    View Details
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
        </div>
        </>
    );
}

export default PredictionHistory;