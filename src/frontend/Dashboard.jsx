import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Disable default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function Dashboard() {
    const [earthquakes, setEarthquakes] = useState([]);
    const [filteredEarthquakes, setFilteredEarthquakes] = useState([]);
    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState("all");
    const [loading, setLoading] = useState(true);
    const [selectedEarthquake, setSelectedEarthquake] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [mapCenter, setMapCenter] = useState([12.8797, 121.7740]);
    const [mapZoom, setMapZoom] = useState(6);

    // Risk level determination and color coding
    const getRiskLevel = (magnitude) => {
        if (magnitude >= 5.0) return { level: 'High Risk', color: '#dc2626', textColor: 'text-danger' };
        if (magnitude >= 4.0) return { level: 'Medium Risk', color: '#f59e0b', textColor: 'text-warning' };
        return { level: 'Low Risk', color: '#16a34a', textColor: 'text-success' };
    };

    // Create custom earthquake icons - IMPROVED VERSIONS
    const createCustomIcon = (magnitude, color) => {
        const size = Math.min(30 + (magnitude * 3), 50); // Size based on magnitude
        const strokeWidth = magnitude >= 5.0 ? 3 : 2;
        
        let svgContent = '';
        
        if (magnitude >= 5.0) {
            // High risk - concentric circles with waves
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="#fff" stroke-width="${strokeWidth}"/>
                    <circle cx="${size/2}" cy="${size/2}" r="${size/4}" fill="none" stroke="#fff" stroke-width="1.5"/>
                    <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${magnitude.toFixed(1)}</text>
                </svg>
            `;
        } else if (magnitude >= 4.0) {
            // Medium risk - circle with seismic lines
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="#fff" stroke-width="${strokeWidth}"/>
                    <path d="M${size/4},${size/2} L${size*3/4},${size/2}" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M${size/2},${size/4} L${size/2},${size*3/4}" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
                    <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${magnitude.toFixed(1)}</text>
                </svg>
            `;
        } else {
            // Low risk - simple circle
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="#fff" stroke-width="${strokeWidth}"/>
                    <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${magnitude.toFixed(1)}</text>
                </svg>
            `;
        }

        return new L.Icon({
            iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2],
            popupAnchor: [0, -size/2],
            className: 'custom-earthquake-marker'
        });
    };

    // Choose which icon style to use
    const getEarthquakeIcon = (magnitude, color) => {
        return createCustomIcon(magnitude, color); // Using concentric circles style
    };

    // Safe place formatter
    const formatPlace = (place) => {
        if (!place) return "Unknown Location";
        const parts = place.split(', ');
        return parts.length > 1 ? parts.slice(-2).join(', ') : place;
    };

    // Safe region getter
    const getSafeRegion = (quake) => {
        return quake.properties?.region || "Unknown Region";
    };

    // Get risk statistics for the legend
    const getRiskStatistics = () => {
        const earthquakesToAnalyze = selectedRegion === "all" ? earthquakes : filteredEarthquakes;
        
        const riskCounts = {
            high: 0,
            medium: 0,
            low: 0
        };

        earthquakesToAnalyze.forEach(quake => {
            const magnitude = quake.properties?.mag || 0;
            if (magnitude >= 5.0) riskCounts.high++;
            else if (magnitude >= 4.0) riskCounts.medium++;
            else riskCounts.low++;
        });

        return riskCounts;
    };

    // Philippine regions coordinates for map centering
    const regionCoordinates = {
        "National Capital Region": { lat: 14.5995, lng: 120.9842 },
        "Cordillera Administrative Region": { lat: 16.4163, lng: 120.5933 },
        "Ilocos Region": { lat: 16.0832, lng: 120.6192 },
        "Cagayan Valley": { lat: 17.5747, lng: 121.7278 },
        "Central Luzon": { lat: 15.4828, lng: 120.7129 },
        "Calabarzon": { lat: 14.1002, lng: 121.0794 },
        "Mimaropa": { lat: 12.3750, lng: 121.0000 },
        "Bicol Region": { lat: 13.4210, lng: 123.4137 },
        "Western Visayas": { lat: 11.0050, lng: 122.5373 },
        "Central Visayas": { lat: 10.3157, lng: 123.8854 },
        "Eastern Visayas": { lat: 11.0818, lng: 125.0150 },
        "Zamboanga Peninsula": { lat: 7.2279, lng: 122.2430 },
        "Northern Mindanao": { lat: 8.3696, lng: 124.6820 },
        "Davao Region": { lat: 7.3042, lng: 125.6848 },
        "Soccsksargen": { lat: 6.2707, lng: 124.6857 },
        "Caraga": { lat: 8.8014, lng: 125.7400 },
        "Bangsamoro": { lat: 7.1907, lng: 124.2434 }
    };

    const fetchEarthquakeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2024-01-01&latitude=12.8797&longitude=121.7740&maxradiuskm=1000&minmagnitude=2.5'
            );
            const data = await response.json();
            
            const uniqueRegions = new Set();
            const processedFeatures = data.features.map(quake => {
                const lat = quake.geometry?.coordinates?.[1] || 0;
                const lng = quake.geometry?.coordinates?.[0] || 0;
                
                const region = getRegionFromCoordinates(lat, lng);
                if (region !== "Unknown Region") {
                    uniqueRegions.add(region);
                }
                return {
                    ...quake,
                    properties: {
                        ...quake.properties,
                        region,
                        place: quake.properties?.place || "Unknown Location near Philippines"
                    }
                };
            });

            setEarthquakes(processedFeatures);
            setRegions(Array.from(uniqueRegions).sort());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching earthquake data:', error);
            setLoading(false);
        }
    };

    const getRegionFromCoordinates = (lat, lng) => {
        if (lat >= 14.0 && lat <= 15.0 && lng >= 120.0 && lng <= 121.5) return "National Capital Region";
        if (lat >= 16.0 && lat <= 18.0 && lng >= 120.0 && lng <= 122.0) return "Ilocos Region";
        if (lat >= 16.0 && lat <= 18.0 && lng >= 121.0 && lng <= 123.0) return "Cagayan Valley";
        if (lat >= 14.5 && lat <= 16.0 && lng >= 120.0 && lng <= 122.0) return "Central Luzon";
        if (lat >= 13.0 && lat <= 14.5 && lng >= 120.0 && lng <= 122.0) return "Calabarzon";
        if (lat >= 9.0 && lat <= 13.0 && lng >= 118.0 && lng <= 122.0) return "Mimaropa";
        if (lat >= 12.0 && lat <= 14.0 && lng >= 122.0 && lng <= 124.5) return "Bicol Region";
        if (lat >= 10.0 && lat <= 12.0 && lng >= 121.0 && lng <= 123.0) return "Western Visayas";
        if (lat >= 9.0 && lat <= 11.0 && lng >= 122.0 && lng <= 125.0) return "Central Visayas";
        if (lat >= 10.0 && lat <= 12.5 && lng >= 124.0 && lng <= 126.0) return "Eastern Visayas";
        if (lat >= 6.0 && lat <= 8.5 && lng >= 121.0 && lng <= 123.5) return "Zamboanga Peninsula";
        if (lat >= 7.5 && lat <= 9.0 && lng >= 124.0 && lng <= 126.0) return "Northern Mindanao";
        if (lat >= 5.5 && lat <= 8.0 && lng >= 125.0 && lng <= 126.5) return "Davao Region";
        if (lat >= 5.0 && lat <= 7.0 && lng >= 124.0 && lng <= 125.5) return "Soccsksargen";
        if (lat >= 8.0 && lat <= 10.0 && lng >= 125.0 && lng <= 126.5) return "Caraga";
        return "Unknown Region";
    };

    const filterEarthquakesByRegion = () => {
        if (selectedRegion === "all") {
            setFilteredEarthquakes(earthquakes);
            setMapCenter([12.8797, 121.7740]);
            setMapZoom(6);
        } else {
            const filtered = earthquakes.filter(quake => {
                const lat = quake.geometry?.coordinates?.[1] || 0;
                const lng = quake.geometry?.coordinates?.[0] || 0;
                const region = getRegionFromCoordinates(lat, lng);
                return region === selectedRegion;
            });
            setFilteredEarthquakes(filtered);
            
            if (regionCoordinates[selectedRegion]) {
                setMapCenter([regionCoordinates[selectedRegion].lat, regionCoordinates[selectedRegion].lng]);
                setMapZoom(8);
            }
        }
        setSelectedEarthquake(null);
    };

    const getEarthquakesToDisplay = () => {
        return selectedRegion === "all" ? earthquakes : filteredEarthquakes;
    };

    useEffect(() => {
        fetchEarthquakeData();

        const refreshInterval = setInterval(() => {
            fetchEarthquakeData();
            setLastUpdate(new Date());
        }, 5 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, []);

    useEffect(() => {
        filterEarthquakesByRegion();
    }, [selectedRegion, earthquakes]);

    const riskStatistics = getRiskStatistics();
    const earthquakesToDisplay = getEarthquakesToDisplay();

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <div className="row">
                    <div className="col-12">
                        <h1 className="text-center mb-4">Philippine Earthquake Monitor</h1>
                        
                        {/* Region Selector and Data Controls */}
                        <div className="text-center mb-4">
                            <div className="d-flex justify-content-center gap-3 mb-2">
                                <select
                                    className="form-select w-auto"
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                >
                                    <option value="all">All Regions</option>
                                    {regions.map(region => (
                                        <option key={region} value={region}>
                                            {region}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={fetchEarthquakeData}
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Refreshing...' : 'Refresh Now'}
                                </button>
                            </div>
                            <small className="text-muted">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                                {' '}• Auto-refreshes every 5 minutes
                                {loading && ' • Refreshing...'}
                            </small>
                        </div>

                        {loading ? (
                            <div className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="card mb-4">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5 className="card-title mb-0">
                                                    {selectedEarthquake 
                                                        ? `Earthquake Location: ${formatPlace(selectedEarthquake.properties?.place)}`
                                                        : selectedRegion === "all" 
                                                            ? "Philippines Earthquake Map" 
                                                            : `Earthquake Map - ${selectedRegion}`
                                                    }
                                                </h5>
                                                
                                                {/* Dynamic Legend with Magnitude Ranges */}
                                                <div className="legend d-none d-md-block">
                                                    <div className="d-flex gap-3">
                                                        <div className="d-flex align-items-center">
                                                            <div 
                                                                className="legend-color me-2" 
                                                                style={{
                                                                    width: '12px',
                                                                    height: '12px',
                                                                    backgroundColor: '#16a34a',
                                                                    borderRadius: '2px'
                                                                }}
                                                            ></div>
                                                            <div>
                                                                <small className="fw-bold d-block">
                                                                    Low Risk ({riskStatistics.low})
                                                                </small>
                                                                <small className="text-muted d-block">
                                                                    4.0 below
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <div 
                                                                className="legend-color me-2" 
                                                                style={{
                                                                    width: '12px',
                                                                    height: '12px',
                                                                    backgroundColor: '#f59e0b',
                                                                    borderRadius: '2px'
                                                                }}
                                                            ></div>
                                                            <div>
                                                                <small className="fw-bold d-block">
                                                                    Medium Risk ({riskStatistics.medium})
                                                                </small>
                                                                <small className="text-muted d-block">
                                                                    M 4.0 - 4.9
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <div 
                                                                className="legend-color me-2" 
                                                                style={{
                                                                    width: '12px',
                                                                    height: '12px',
                                                                    backgroundColor: '#dc2626',
                                                                    borderRadius: '2px'
                                                                }}
                                                            ></div>
                                                            <div>
                                                                <small className="fw-bold d-block">
                                                                    High Risk ({riskStatistics.high})
                                                                </small>
                                                                <small className="text-muted d-block">
                                                                    5.0 and above
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ height: '500px', width: '100%', position: 'relative' }}>
                                                <MapContainer 
                                                    center={mapCenter} 
                                                    zoom={mapZoom} 
                                                    style={{ height: '100%', width: '100%' }}
                                                    className="rounded"
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    />
                                                    {earthquakesToDisplay.map((quake, index) => {
                                                        const magnitude = quake.properties?.mag || 0;
                                                        const risk = getRiskLevel(magnitude);
                                                        const lat = quake.geometry?.coordinates?.[1] || 0;
                                                        const lng = quake.geometry?.coordinates?.[0] || 0;
                                                        const customIcon = getEarthquakeIcon(magnitude, risk.color);
                                                        
                                                        return (
                                                            <Marker
                                                                key={quake.id || index}
                                                                position={[lat, lng]}
                                                                icon={customIcon}
                                                                eventHandlers={{
                                                                    click: () => {
                                                                        setSelectedEarthquake(quake);
                                                                    },
                                                                }}
                                                            >
                                                                <Popup>
                                                                    <div className="text-center">
                                                                        <h6 className="mb-2">Earthquake Details</h6>
                                                                        <p className="mb-1"><strong>Magnitude:</strong> {magnitude}</p>
                                                                        <p className="mb-1"><strong>Location:</strong> {formatPlace(quake.properties?.place)}</p>
                                                                        <p className="mb-1"><strong>Region:</strong> {getSafeRegion(quake)}</p>
                                                                        <p className="mb-1"><strong>Depth:</strong> {quake.geometry?.coordinates?.[2] || 0} km</p>
                                                                        <p className="mb-1"><strong>Time:</strong> {new Date(quake.properties?.time || Date.now()).toLocaleString()}</p>
                                                                        <div className={`badge ${risk.textColor}`}>
                                                                            {risk.level}
                                                                        </div>
                                                                    </div>
                                                                </Popup>
                                                            </Marker>
                                                        );
                                                    })}
                                                </MapContainer>
                                                
                                                {/* Legend for mobile view */}
                                                <div className="d-md-none mt-2">
                                                    <div className="card">
                                                        <div className="card-body py-2">
                                                            <h6 className="card-title mb-2">Risk Legend</h6>
                                                            <div className="row text-center">
                                                                <div className="col-4">
                                                                    <div className="d-flex flex-column align-items-center">
                                                                        <div 
                                                                            className="legend-color mb-1" 
                                                                            style={{
                                                                                width: '12px',
                                                                                height: '12px',
                                                                                backgroundColor: '#16a34a',
                                                                                borderRadius: '2px'
                                                                            }}
                                                                        ></div>
                                                                        <small>Low ({riskStatistics.low})</small>
                                                                        <small className="text-muted d-block">4.0 below</small>
                                                                    </div>
                                                                </div>
                                                                <div className="col-4">
                                                                    <div className="d-flex flex-column align-items-center">
                                                                        <div 
                                                                            className="legend-color mb-1" 
                                                                            style={{
                                                                                width: '12px',
                                                                                height: '12px',
                                                                                backgroundColor: '#f59e0b',
                                                                                borderRadius: '2px'
                                                                            }}
                                                                        ></div>
                                                                        <small>Medium ({riskStatistics.medium})</small>
                                                                        <small className="text-muted d-block">M 4.0-4.9</small>
                                                                    </div>
                                                                </div>
                                                                <div className="col-4">
                                                                    <div className="d-flex flex-column align-items-center">
                                                                        <div 
                                                                            className="legend-color mb-1" 
                                                                            style={{
                                                                                width: '12px',
                                                                                height: '12px',
                                                                                backgroundColor: '#dc2626',
                                                                                borderRadius: '2px'
                                                                            }}
                                                                        ></div>
                                                                        <small>High ({riskStatistics.high})</small>
                                                                        <small className="text-muted d-block">5.0 above</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Additional Information Section */}
                                            <div className="mt-4">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="card bg-light">
                                                            <div className="card-body">
                                                                <h6 className="card-title">📋 Earthquake Safety Tips</h6>
                                                                <ul className="small mb-0">
                                                                    <li><strong>Drop, Cover, and Hold On</strong> during shaking</li>
                                                                    <li>Move away from windows and heavy objects</li>
                                                                    <li>If outdoors, move to an open area away from buildings</li>
                                                                    <li>Have an emergency kit ready with supplies for 3 days</li>
                                                                    <li>Know your evacuation routes and meeting points</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card bg-light">
                                                            <div className="card-body">
                                                                <h6 className="card-title">ℹ️ About This Data</h6>
                                                                <div className="small">
                                                                    <p className="mb-1"><strong>Data Source:</strong> USGS Earthquake Hazards Program</p>
                                                                    <p className="mb-1"><strong>Magnitude Scale:</strong> Moment Magnitude (Mw)</p>
                                                                    <p className="mb-1"><strong>Update Frequency:</strong> Every 5 minutes</p>
                                                                    <p className="mb-0"><strong>Coverage:</strong> Philippines region (1000km radius)</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Quick Response Guide */}
                                                <div className="card mt-3 border-warning">
                                                    <div className="card-body">
                                                        <h6 className="card-title text-warning">🚨 Immediate Response Guide</h6>
                                                        <div className="row text-center">
                                                            <div className="col-md-3 mb-2">
                                                                <div className="p-2 bg-warning bg-opacity-10 rounded">
                                                                    <strong>M 4.0-4.9</strong>
                                                                    <div className="small">Light shaking<br/>Check for damage</div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3 mb-2">
                                                                <div className="p-2 bg-orange bg-opacity-10 rounded">
                                                                    <strong>M 5.0-5.9</strong>
                                                                    <div className="small">Moderate damage<br/>Secure area</div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3 mb-2">
                                                                <div className="p-2 bg-danger bg-opacity-10 rounded">
                                                                    <strong>M 6.0-6.9</strong>
                                                                    <div className="small">Severe damage<br/>Evacuate if needed</div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3 mb-2">
                                                                <div className="p-2 bg-dark bg-opacity-10 rounded">
                                                                    <strong>M 7.0+</strong>
                                                                    <div className="small">Major earthquake<br/>Follow authorities</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedEarthquake && (
                                                <div className="mt-3 p-3 bg-light rounded">
                                                    <h6>Selected Earthquake Details</h6>
                                                    <div className={`alert ${getRiskLevel(selectedEarthquake.properties?.mag || 0).textColor} mb-3`}>
                                                        <strong>Risk Level:</strong> {getRiskLevel(selectedEarthquake.properties?.mag || 0).level}
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <p><strong>Magnitude:</strong> {selectedEarthquake.properties?.mag || "N/A"}</p>
                                                            <p><strong>Depth:</strong> {selectedEarthquake.geometry?.coordinates?.[2] || "N/A"} km</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <p><strong>Region:</strong> {getSafeRegion(selectedEarthquake)}</p>
                                                            <p><strong>Time:</strong> {new Date(selectedEarthquake.properties?.time || Date.now()).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <p><strong>Location:</strong> {formatPlace(selectedEarthquake.properties?.place)}</p>
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => setSelectedEarthquake(null)}
                                                    >
                                                        Clear Selection
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card">
                                        <div className="card-body">
                                            <h5 className="card-title">
                                                Recent Earthquakes
                                                {selectedRegion !== "all" && ` in ${selectedRegion}`}
                                                <span className="badge bg-primary ms-2">
                                                    {earthquakesToDisplay.length}
                                                </span>
                                            </h5>
                                            
                                            {/* Risk Summary */}
                                            <div className="card bg-light mb-3">
                                                <div className="card-body py-2">
                                                    <div className="row text-center">
                                                        <div className="col-4">
                                                            <div className="text-success">
                                                                <strong>{riskStatistics.low}</strong>
                                                                <div className="small">Low Risk</div>
                                                                <div className="small text-muted">4.0 below</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-4">
                                                            <div className="text-warning">
                                                                <strong>{riskStatistics.medium}</strong>
                                                                <div className="small">Medium Risk</div>
                                                                <div className="small text-muted">M 4.0-4.9</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-4">
                                                            <div className="text-danger">
                                                                <strong>{riskStatistics.high}</strong>
                                                                <div className="small">High Risk</div>
                                                                <div className="small text-muted">5.0 above</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Earthquake List Table - KEPT INTACT */}
                                            <div className="list-group" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                                {earthquakesToDisplay.length === 0 ? (
                                                    <div className="text-center p-3 text-muted">
                                                        No earthquakes found for the selected region.
                                                    </div>
                                                ) : (
                                                    earthquakesToDisplay.map((quake, index) => {
                                                        const magnitude = quake.properties?.mag || 0;
                                                        const risk = getRiskLevel(magnitude);
                                                        return (
                                                            <button
                                                                key={quake.id || index}
                                                                className={`list-group-item list-group-item-action ${
                                                                    selectedEarthquake?.id === quake.id ? 'active' : ''
                                                                }`}
                                                                onClick={() => setSelectedEarthquake(quake)}
                                                            >
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div className="flex-grow-1">
                                                                        <h6 className="mb-1">
                                                                            <span 
                                                                                className="badge me-2"
                                                                                style={{ 
                                                                                    backgroundColor: risk.color,
                                                                                    color: 'white'
                                                                                }}
                                                                            >
                                                                                M{magnitude}
                                                                            </span>
                                                                            {formatPlace(quake.properties?.place)}
                                                                        </h6>
                                                                        <p className="mb-1 small text-muted">
                                                                            {getSafeRegion(quake)}
                                                                        </p>
                                                                        <small className="text-muted">
                                                                            {new Date(quake.properties?.time || Date.now()).toLocaleString()}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer/>
        </>
    );
}

export default Dashboard;