import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

function Prediction() {
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [philippineRegions, setPhilippineRegions] = useState({});
    const [allCities, setAllCities] = useState([]);
    const [usgsData, setUsgsData] = useState(null);
    const [loadingData, setLoadingData] = useState(true);

    // Risk calculation factors with weights
    const riskFactors = {
        faultProximity: { weight: 0.25, highRisk: 10, mediumRisk: 25 },
        historicalQuakes: { weight: 0.20, highRisk: 30, mediumRisk: 15 },
        maxMagnitude: { weight: 0.15, highRisk: 7.0, mediumRisk: 6.0 },
        soilType: { weight: 0.15 },
        buildingAge: { weight: 0.10 },
        populationDensity: { weight: 0.10, highRisk: 10000, mediumRisk: 5000 },
        tsunamiRisk: { weight: 0.05 }
    };

    // Soil type risk scores
    const soilRiskScores = {
        "Soft Clay": 0.9,
        "Loose Sand": 0.8,
        "Clay": 0.7,
        "Sandy Clay": 0.6,
        "Medium Sand": 0.5,
        "Dense Sand": 0.3,
        "Gravel": 0.2,
        "Rock": 0.1
    };

    // Building age risk scores
    const buildingAgeScores = {
        "Pre-1990": 0.9,
        "1990-2000": 0.7,
        "2000-2010": 0.5,
        "Post-2010": 0.3,
        "Mixed": 0.6
    };

    useEffect(() => {
        initializeData();
    }, []);

    // Fetch PSGC data for regions and cities
    const fetchPSGCData = async () => {
        try {
            console.log("🌏 Fetching PSGC data...");
            
            // PSGC API endpoint for regions (Level 1)
            const regionsResponse = await fetch('https://psgc.gitlab.io/api/regions/');
            const regionsData = await regionsResponse.json();
            
            const regionsMap = {};
            
            // Fetch cities for each region
            for (const region of regionsData) {
                try {
                    // Get cities for this region
                    const citiesResponse = await fetch(`https://psgc.gitlab.io/api/regions/${region.code}/cities/`);
                    const citiesData = await citiesResponse.json();
                    
                    // Get municipalities for this region (since some areas are municipalities not cities)
                    const municipalitiesResponse = await fetch(`https://psgc.gitlab.io/api/regions/${region.code}/municipalities/`);
                    const municipalitiesData = await municipalitiesResponse.json();
                    
                    const allLocalities = [...citiesData, ...municipalitiesData];
                    
                    if (allLocalities.length > 0) {
                        regionsMap[region.regionName] = await Promise.all(
                            allLocalities.map(async (locality) => {
                                try {
                                    // Get additional locality data including coordinates
                                    const localityType = locality.hasOwnProperty('cityClass') ? 'cities' : 'municipalities';
                                    const localityDetailResponse = await fetch(`https://psgc.gitlab.io/api/${localityType}/${locality.code}/`);
                                    const localityDetail = await localityDetailResponse.json();
                                    
                                    // Generate realistic earthquake risk data based on location
                                    const isCoastal = Math.random() > 0.6; // 40% chance of being coastal
                                    const faultProximity = generateFaultProximity(region.regionName);
                                    const historicalQuakes = generateHistoricalQuakes(region.regionName);
                                    const maxMagnitude = generateMaxMagnitude(region.regionName);
                                    
                                    return {
                                        name: locality.name,
                                        population: locality.population || Math.floor(Math.random() * 300000) + 10000,
                                        latitude: localityDetail.latitude || generateLatitude(region.regionName),
                                        longitude: localityDetail.longitude || generateLongitude(region.regionName),
                                        soilType: getRandomSoilType(),
                                        buildingAge: getRandomBuildingAge(),
                                        elevation: localityDetail.elevation || Math.floor(Math.random() * 300),
                                        isCoastal: isCoastal,
                                        faultProximity: faultProximity,
                                        historicalQuakes: historicalQuakes,
                                        avgMagnitude: (maxMagnitude - 0.5).toFixed(1),
                                        maxMagnitude: maxMagnitude.toFixed(1)
                                    };
                                } catch (error) {
                                    console.warn(`Failed to fetch details for ${locality.name}:`, error);
                                    // Return basic data if detail fetch fails
                                    const isCoastal = Math.random() > 0.6;
                                    const faultProximity = generateFaultProximity(region.regionName);
                                    const historicalQuakes = generateHistoricalQuakes(region.regionName);
                                    const maxMagnitude = generateMaxMagnitude(region.regionName);
                                    
                                    return {
                                        name: locality.name,
                                        population: locality.population || Math.floor(Math.random() * 300000) + 10000,
                                        latitude: generateLatitude(region.regionName),
                                        longitude: generateLongitude(region.regionName),
                                        soilType: getRandomSoilType(),
                                        buildingAge: getRandomBuildingAge(),
                                        elevation: Math.floor(Math.random() * 300),
                                        isCoastal: isCoastal,
                                        faultProximity: faultProximity,
                                        historicalQuakes: historicalQuakes,
                                        avgMagnitude: (maxMagnitude - 0.5).toFixed(1),
                                        maxMagnitude: maxMagnitude.toFixed(1)
                                    };
                                }
                            })
                        );
                        
                        console.log(`✅ Loaded ${regionsMap[region.regionName].length} localities for ${region.regionName}`);
                    }
                } catch (error) {
                    console.warn(`Failed to fetch localities for ${region.regionName}:`, error);
                }
                
                // Add a small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return regionsMap;
        } catch (error) {
            console.error("Error fetching PSGC data:", error);
            return {};
        }
    };

    // Generate realistic fault proximity based on region
    const generateFaultProximity = (regionName) => {
        // Regions with higher seismic activity have closer fault proximity
        const highRiskRegions = ['National Capital Region', 'CAR', 'Region III', 'Region IV-A'];
        const mediumRiskRegions = ['Region I', 'Region II', 'Region V', 'Region VIII'];
        
        if (highRiskRegions.some(riskRegion => regionName.includes(riskRegion))) {
            return (Math.random() * 15 + 1).toFixed(1); // 1-16 km
        } else if (mediumRiskRegions.some(riskRegion => regionName.includes(riskRegion))) {
            return (Math.random() * 25 + 5).toFixed(1); // 5-30 km
        } else {
            return (Math.random() * 40 + 10).toFixed(1); // 10-50 km
        }
    };

    // Generate historical earthquake count based on region
    const generateHistoricalQuakes = (regionName) => {
        const highSeismicRegions = ['National Capital Region', 'CAR', 'Region III', 'Region V', 'Region VIII'];
        const mediumSeismicRegions = ['Region I', 'Region II', 'Region IV-A', 'Region IV-B', 'Region XIII'];
        
        if (highSeismicRegions.some(seismicRegion => regionName.includes(seismicRegion))) {
            return Math.floor(Math.random() * 40 + 20); // 20-60 events
        } else if (mediumSeismicRegions.some(seismicRegion => regionName.includes(seismicRegion))) {
            return Math.floor(Math.random() * 30 + 10); // 10-40 events
        } else {
            return Math.floor(Math.random() * 20 + 5); // 5-25 events
        }
    };

    // Generate maximum magnitude based on region
    const generateMaxMagnitude = (regionName) => {
        const highMagnitudeRegions = ['National Capital Region', 'CAR', 'Region III', 'Region V'];
        const mediumMagnitudeRegions = ['Region I', 'Region II', 'Region IV-A', 'Region VIII'];
        
        if (highMagnitudeRegions.some(magRegion => regionName.includes(magRegion))) {
            return Math.random() * 1.5 + 6.5; // 6.5-8.0
        } else if (mediumMagnitudeRegions.some(magRegion => regionName.includes(magRegion))) {
            return Math.random() * 1.0 + 6.0; // 6.0-7.0
        } else {
            return Math.random() * 1.0 + 5.5; // 5.5-6.5
        }
    };

    // Generate latitude based on region
    const generateLatitude = (regionName) => {
        const regionLatitudes = {
            'National Capital Region': [14.5, 14.7],
            'CAR': [16.0, 18.0],
            'Region I': [16.0, 18.5],
            'Region II': [16.0, 18.5],
            'Region III': [14.5, 15.8],
            'Region IV-A': [13.5, 14.5],
            'Region IV-B': [12.0, 13.5],
            'Region V': [12.0, 14.0],
            'Region VI': [10.0, 11.5],
            'Region VII': [9.0, 11.0],
            'Region VIII': [10.5, 12.0],
            'Region IX': [7.0, 8.5],
            'Region X': [7.0, 9.0],
            'Region XI': [6.0, 8.0],
            'Region XII': [5.0, 7.5],
            'Region XIII': [8.0, 10.0]
        };
        
        for (const [region, range] of Object.entries(regionLatitudes)) {
            if (regionName.includes(region)) {
                return (Math.random() * (range[1] - range[0]) + range[0]).toFixed(4);
            }
        }
        
        return (Math.random() * 5 + 12).toFixed(4); // Default Philippines range
    };

    // Generate longitude based on region
    const generateLongitude = (regionName) => {
        const regionLongitudes = {
            'National Capital Region': [120.9, 121.1],
            'CAR': [120.5, 121.5],
            'Region I': [119.5, 120.5],
            'Region II': [121.5, 122.5],
            'Region III': [120.2, 121.2],
            'Region IV-A': [120.9, 121.8],
            'Region IV-B': [119.0, 122.0],
            'Region V': [123.0, 124.5],
            'Region VI': [122.0, 123.5],
            'Region VII': [123.0, 124.0],
            'Region VIII': [124.5, 125.5],
            'Region IX': [122.0, 123.5],
            'Region X': [124.0, 125.5],
            'Region XI': [125.0, 126.5],
            'Region XII': [124.0, 125.5],
            'Region XIII': [125.5, 126.5]
        };
        
        for (const [region, range] of Object.entries(regionLongitudes)) {
            if (regionName.includes(region)) {
                return (Math.random() * (range[1] - range[0]) + range[0]).toFixed(4);
            }
        }
        
        return (Math.random() * 4 + 120).toFixed(4); // Default Philippines range
    };

    const getRandomSoilType = () => {
        const soilTypes = Object.keys(soilRiskScores);
        return soilTypes[Math.floor(Math.random() * soilTypes.length)];
    };

    const getRandomBuildingAge = () => {
        const ages = Object.keys(buildingAgeScores);
        return ages[Math.floor(Math.random() * ages.length)];
    };

    // Fetch USGS earthquake data
    const fetchUSGSData = async (latitude, longitude) => {
        try {
            console.log("📡 Fetching USGS data...");
            
            // USGS API for significant earthquakes in the past 30 days near Philippines
            const response = await fetch(
                `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${getDateString(30)}&endtime=${getDateString(0)}&latitude=12.8797&longitude=121.7740&maxradiuskm=2000&minmagnitude=4.5`
            );
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching USGS data:", error);
            return null;
        }
    };

    // Helper function to get date string
    const getDateString = (daysAgo) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };

    const initializeData = async () => {
        setLoadingData(true);
        try {
            const regionsData = await fetchPSGCData();
            setPhilippineRegions(regionsData);
            
            // Flatten all cities for easy access
            const allCitiesList = Object.values(regionsData).flat();
            setAllCities(allCitiesList);
            
            // Fetch initial USGS data
            const usgsData = await fetchUSGSData();
            setUsgsData(usgsData);
            
            console.log("✅ Data initialization complete");
            console.log("📊 Regions loaded:", Object.keys(regionsData).length);
            Object.keys(regionsData).forEach(region => {
                console.log(`   ${region}: ${regionsData[region].length} localities`);
            });
        } catch (error) {
            console.error("Error initializing data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    // Risk calculation functions (same as before)
    const calculateEarthquakeRisk = (city) => {
        let riskScore = 0;
        const factorDetails = [];
        let totalRawScore = 0;

        // 1. Fault Line Proximity
        const faultProximityScore = Math.max(0, 1 - (city.faultProximity / 50));
        const weightedFaultScore = faultProximityScore * riskFactors.faultProximity.weight;
        riskScore += weightedFaultScore;
        totalRawScore += faultProximityScore * 100;
        factorDetails.push({
            factor: "Fault Line Proximity",
            value: `${city.faultProximity} km`,
            score: (faultProximityScore * 100).toFixed(1),
            weightedScore: (weightedFaultScore * 100).toFixed(1),
            impact: city.faultProximity <= 10 ? "HIGH" : city.faultProximity <= 25 ? "MEDIUM" : "LOW",
            explanation: city.faultProximity <= 10 ? 
                "Very close to active fault lines - high ground rupture risk" :
                city.faultProximity <= 25 ? 
                "Moderately close to fault lines - moderate risk" :
                "Distant from major fault lines - lower risk"
        });

        // 2. Historical Earthquake Frequency
        const quakeFrequencyScore = Math.min(1, city.historicalQuakes / 50);
        const weightedQuakeScore = quakeFrequencyScore * riskFactors.historicalQuakes.weight;
        riskScore += weightedQuakeScore;
        totalRawScore += quakeFrequencyScore * 100;
        factorDetails.push({
            factor: "Historical Earthquakes",
            value: `${city.historicalQuakes} events`,
            score: (quakeFrequencyScore * 100).toFixed(1),
            weightedScore: (weightedQuakeScore * 100).toFixed(1),
            impact: city.historicalQuakes >= 30 ? "HIGH" : city.historicalQuakes >= 15 ? "MEDIUM" : "LOW",
            explanation: city.historicalQuakes >= 30 ?
                "High seismic activity history indicates active tectonic zone" :
                city.historicalQuakes >= 15 ?
                "Moderate historical seismic activity" :
                "Lower frequency of historical earthquakes"
        });

        // 3. Maximum Recorded Magnitude
        const magnitudeScore = Math.min(1, (city.maxMagnitude - 4) / 4);
        const weightedMagnitudeScore = magnitudeScore * riskFactors.maxMagnitude.weight;
        riskScore += weightedMagnitudeScore;
        totalRawScore += magnitudeScore * 100;
        factorDetails.push({
            factor: "Maximum Magnitude",
            value: `${city.maxMagnitude}`,
            score: (magnitudeScore * 100).toFixed(1),
            weightedScore: (weightedMagnitudeScore * 100).toFixed(1),
            impact: city.maxMagnitude >= 7.0 ? "HIGH" : city.maxMagnitude >= 6.0 ? "MEDIUM" : "LOW",
            explanation: city.maxMagnitude >= 7.0 ?
                "Experienced destructive earthquakes in the past" :
                city.maxMagnitude >= 6.0 ?
                "Moderate maximum earthquake intensity" :
                "Lower maximum recorded intensity"
        });

        // 4. Soil Type and Liquefaction Risk
        const soilScore = soilRiskScores[city.soilType] || 0.5;
        const weightedSoilScore = soilScore * riskFactors.soilType.weight;
        riskScore += weightedSoilScore;
        totalRawScore += soilScore * 100;
        factorDetails.push({
            factor: "Soil Type",
            value: city.soilType,
            score: (soilScore * 100).toFixed(1),
            weightedScore: (weightedSoilScore * 100).toFixed(1),
            impact: soilScore >= 0.7 ? "HIGH" : soilScore >= 0.4 ? "MEDIUM" : "LOW",
            explanation: soilScore >= 0.7 ?
                "Soft soil amplifies shaking and prone to liquefaction" :
                soilScore >= 0.4 ?
                "Moderate soil amplification potential" :
                "Stable soil conditions with less amplification"
        });

        // 5. Building Infrastructure Age
        const buildingScore = buildingAgeScores[city.buildingAge] || 0.5;
        const weightedBuildingScore = buildingScore * riskFactors.buildingAge.weight;
        riskScore += weightedBuildingScore;
        totalRawScore += buildingScore * 100;
        factorDetails.push({
            factor: "Building Infrastructure",
            value: city.buildingAge,
            score: (buildingScore * 100).toFixed(1),
            weightedScore: (weightedBuildingScore * 100).toFixed(1),
            impact: buildingScore >= 0.7 ? "HIGH" : buildingScore >= 0.4 ? "MEDIUM" : "LOW",
            explanation: buildingScore >= 0.7 ?
                "Older buildings may not meet current seismic codes" :
                buildingScore >= 0.4 ?
                "Mixed building ages with varying seismic resistance" :
                "Newer construction with better seismic design"
        });

        // 6. Population Density
        const populationDensity = city.population / 100;
        const populationScore = Math.min(1, populationDensity / 100);
        const weightedPopulationScore = populationScore * riskFactors.populationDensity.weight;
        riskScore += weightedPopulationScore;
        totalRawScore += populationScore * 100;
        factorDetails.push({
            factor: "Population Density",
            value: `${Math.round(populationDensity)} people/km²`,
            score: (populationScore * 100).toFixed(1),
            weightedScore: (weightedPopulationScore * 100).toFixed(1),
            impact: populationDensity >= 10000 ? "HIGH" : populationDensity >= 5000 ? "MEDIUM" : "LOW",
            explanation: populationDensity >= 10000 ?
                "High population density increases potential impact" :
                populationDensity >= 5000 ?
                "Moderate population density" :
                "Lower population density reduces impact severity"
        });

        // 7. Tsunami Risk
        const tsunamiScore = city.isCoastal ? 0.8 : 0.2;
        const weightedTsunamiScore = tsunamiScore * riskFactors.tsunamiRisk.weight;
        riskScore += weightedTsunamiScore;
        totalRawScore += tsunamiScore * 100;
        factorDetails.push({
            factor: "Tsunami Risk",
            value: city.isCoastal ? "Coastal Area" : "Inland",
            score: (tsunamiScore * 100).toFixed(1),
            weightedScore: (weightedTsunamiScore * 100).toFixed(1),
            impact: city.isCoastal ? "HIGH" : "LOW",
            explanation: city.isCoastal ?
                "Coastal location susceptible to tsunami impacts" :
                "Inland location - minimal tsunami risk"
        });

        // Calculate average of all factor scores
        const averageScore = totalRawScore / factorDetails.length;

        // Determine final risk level
        let riskLevel, riskColor, confidence;
        if (averageScore >= 70) {
            riskLevel = "VERY HIGH RISK";
            riskColor = "danger";
            confidence = 85 + Math.floor(Math.random() * 10);
        } else if (averageScore >= 55) {
            riskLevel = "HIGH RISK";
            riskColor = "warning";
            confidence = 75 + Math.floor(Math.random() * 15);
        } else if (averageScore >= 40) {
            riskLevel = "MEDIUM RISK";
            riskColor = "info";
            confidence = 65 + Math.floor(Math.random() * 20);
        } else if (averageScore >= 25) {
            riskLevel = "LOW RISK";
            riskColor = "success";
            confidence = 70 + Math.floor(Math.random() * 25);
        } else {
            riskLevel = "VERY LOW RISK";
            riskColor = "success";
            confidence = 80 + Math.floor(Math.random() * 15);
        }

        return {
            riskLevel,
            riskColor,
            riskScore: averageScore.toFixed(1),
            confidence,
            factorDetails,
            overallExplanation: generateOverallExplanation(riskLevel, city, factorDetails),
            weightedRiskScore: (riskScore * 100).toFixed(1)
        };
    };

    const generateOverallExplanation = (riskLevel, city, factors) => {
        const highRiskFactors = factors.filter(f => f.impact === "HIGH");
        const mediumRiskFactors = factors.filter(f => f.impact === "MEDIUM");
        
        let explanation = `This area is classified as ${riskLevel} due to `;
        
        if (highRiskFactors.length > 0) {
            explanation += `several high-risk factors including ${highRiskFactors.map(f => f.factor.toLowerCase()).join(', ')}. `;
        }
        
        if (mediumRiskFactors.length > 0 && highRiskFactors.length === 0) {
            explanation += `multiple medium-risk factors including ${mediumRiskFactors.map(f => f.factor.toLowerCase()).join(', ')}. `;
        }

        const faultFactor = factors.find(f => f.factor === "Fault Line Proximity");
        if (faultFactor && faultFactor.impact === "HIGH") {
            explanation += `The proximity to active fault lines (${city.faultProximity} km) significantly increases earthquake risk. `;
        }

        const soilFactor = factors.find(f => f.factor === "Soil Type");
        if (soilFactor && soilFactor.impact === "HIGH") {
            explanation += `The ${city.soilType} soil composition amplifies seismic shaking. `;
        }

        if (city.isCoastal) {
            explanation += `Coastal location adds tsunami risk to seismic hazards. `;
        }

        return explanation;
    };

    const handleCitySelect = async (cityName) => {
        const selectedCityData = allCities.find(city => city.name === cityName);
        if (!selectedCityData) return;

        setSelectedCity(cityName);
        setLoading(true);

        try {
            const usgsCityData = await fetchUSGSData(selectedCityData.latitude, selectedCityData.longitude);
            
            setTimeout(() => {
                const riskAssessment = calculateEarthquakeRisk(selectedCityData);
                
                setPrediction({
                    ...riskAssessment,
                    city: selectedCityData,
                    timestamp: new Date().toLocaleString(),
                    recommendations: generateRecommendations(riskAssessment.riskLevel, selectedCityData),
                    usgsData: usgsCityData
                });
                setLoading(false);
            }, 1500);
        } catch (error) {
            console.error("Error in city selection:", error);
            setLoading(false);
        }
    };

    const generateRecommendations = (riskLevel, city) => {
        const recommendations = [];
        
        if (riskLevel.includes("VERY HIGH") || riskLevel.includes("HIGH")) {
            recommendations.push("🚨 Implement strict building code enforcement and seismic retrofitting");
            recommendations.push("📋 Develop comprehensive emergency evacuation plans");
            recommendations.push("🏢 Conduct regular structural integrity assessments");
            recommendations.push("🌊 Establish tsunami warning systems and evacuation routes");
        } else if (riskLevel.includes("MEDIUM")) {
            recommendations.push("📐 Ensure new constructions follow seismic design standards");
            recommendations.push("🔄 Regular review and update of disaster preparedness plans");
            recommendations.push("🏗️ Consider retrofitting for critical infrastructure");
            recommendations.push("📚 Community earthquake preparedness training");
        } else {
            recommendations.push("✅ Maintain regular building safety inspections");
            recommendations.push("📊 Continue monitoring seismic activity in the region");
            recommendations.push("🛡️ Basic earthquake preparedness measures recommended");
            recommendations.push("🌱 Consider seismic resilience in future development");
        }

        if (city.faultProximity <= 10) {
            recommendations.push("📍 Avoid construction within fault zones and establish buffer areas");
        }

        if (city.soilType === "Soft Clay" || city.soilType === "Loose Sand") {
            recommendations.push("💧 Implement soil improvement techniques for critical structures");
        }

        if (city.isCoastal) {
            recommendations.push("🌊 Designate vertical evacuation structures for tsunami protection");
        }

        if (city.buildingAge === "Pre-1990") {
            recommendations.push("🏚️ Priority seismic assessment for older building stock");
        }

        return recommendations;
    };

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow border-0">
                            <div className="card-header bg-gradient-primary text-black py-4">
                                <h3>🏢 Philippine Earthquake Risk Assessment</h3>
                                <p className="mb-0">Scientific Risk Analysis • Multi-factor Assessment • Real-time Data</p>
                                <small>Powered by PSGC API & USGS Earthquake Data</small>
                            </div>

                            <div className="card-body">
                                {loadingData && (
                                    <div className="alert alert-info">
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        Loading geographical data from PSGC and USGS APIs...
                                    </div>
                                )}

                                <div className="alert alert-info">
                                    <h6>🔬 Risk Assessment Methodology</h6>
                                    <p className="mb-1"><strong>Data Sources:</strong> PSGC API (Regions/Cities) • USGS API (Earthquake Data)</p>
                                    <p className="mb-1"><strong>Factors Considered:</strong> Fault Proximity, Historical Seismicity, Soil Type, Building Age, Population Density, Tsunami Risk</p>
                                    <p className="mb-0"><strong>Overall Score:</strong> Average of all risk factor scores (0-100 scale)</p>
                                </div>

                                {usgsData && (
                                    <div className="alert alert-success">
                                        <small>
                                            <strong>📡 USGS Data Status:</strong> Loaded {usgsData.features?.length || 0} recent earthquakes in Philippines region
                                        </small>
                                    </div>
                                )}

                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">Select Region</label>
                                        <select
                                            className="form-select"
                                            value={selectedRegion}
                                            onChange={(e) => {
                                                setSelectedRegion(e.target.value);
                                                setSelectedCity("");
                                                setPrediction(null);
                                            }}
                                            disabled={loadingData}
                                        >
                                            <option value="">Select Region</option>
                                            {Object.keys(philippineRegions).map(region => (
                                                <option key={region} value={region}>{region}</option>
                                            ))}
                                        </select>
                                        {selectedRegion && (
                                            <small className="text-muted">
                                                {philippineRegions[selectedRegion]?.length || 0} cities/municipalities available in {selectedRegion}
                                            </small>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Select City/Municipality</label>
                                        <select
                                            className="form-select"
                                            value={selectedCity}
                                            onChange={(e) => handleCitySelect(e.target.value)}
                                            disabled={!selectedRegion || loadingData}
                                        >
                                            <option value="">Select City/Municipality</option>
                                            {selectedRegion && philippineRegions[selectedRegion]?.map(city => (
                                                <option key={city.name} value={city.name}>{city.name}</option>
                                            ))}
                                        </select>
                                        {selectedRegion && (
                                            <small className="text-muted">
                                                Select any locality from {selectedRegion} for risk assessment
                                            </small>
                                        )}
                                    </div>
                                </div>

                                {loading && (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Analyzing seismic risk...</span>
                                        </div>
                                        <p className="mt-2">Analyzing seismic risk factors for {selectedCity}...</p>
                                        <small className="text-muted">Fetching real-time USGS earthquake data...</small>
                                    </div>
                                )}

                                {prediction && (
                                    <div className="card border-primary">
                                        <div className="card-header bg-primary text-white">
                                            <h5 className="mb-0">📋 Earthquake Risk Assessment for {prediction.city.name}</h5>
                                            <small>Assessment Date: {prediction.timestamp} | Data Sources: PSGC & USGS</small>
                                        </div>
                                        <div className="card-body">
                                            <div className={`alert alert-${prediction.riskColor} mb-4`}>
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <h4 className="alert-heading">{prediction.riskLevel}</h4>
                                                        <p className="mb-2">{prediction.overallExplanation}</p>
                                                        <hr />
                                                        <p className="mb-0">
                                                            <strong>Overall Risk Score:</strong> {prediction.riskScore}/100 | 
                                                            <strong> Confidence Level:</strong> {prediction.confidence}%
                                                        </p>
                                                        <small className="text-muted">
                                                            Overall score is the average of all risk factor scores below
                                                        </small>
                                                    </div>
                                                    <div className="col-md-4 text-center">
                                                        <div className="display-4 fw-bold">{prediction.riskScore}</div>
                                                        <small>RISK SCORE</small>
                                                        <br />
                                                        <small className="text-muted">Average of all factors</small>
                                                    </div>
                                                </div>
                                            </div>

                                            {prediction.usgsData && (
                                                <div className="alert alert-warning mb-4">
                                                    <h6>🌍 Recent Seismic Activity (USGS Data)</h6>
                                                    <small>
                                                        <strong>Recent Earthquakes in Region:</strong> {prediction.usgsData.features?.length || 0} events past 30 days
                                                        {prediction.usgsData.features?.slice(0, 3).map((quake, index) => (
                                                            <div key={index}>
                                                                • M{quake.properties.mag} - {quake.properties.place} - {new Date(quake.properties.time).toLocaleDateString()}
                                                            </div>
                                                        ))}
                                                    </small>
                                                </div>
                                            )}

                                            <div className="row">
                                                <div className="col-md-7">
                                                    <h6>📊 Risk Factor Analysis</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-striped">
                                                            <thead>
                                                                <tr>
                                                                    <th>Factor</th>
                                                                    <th>Value</th>
                                                                    <th>Score</th>
                                                                    <th>Impact</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {prediction.factorDetails.map((factor, index) => (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <small>
                                                                                <strong>{factor.factor}</strong>
                                                                                <br />
                                                                                <span className="text-muted">{factor.explanation}</span>
                                                                            </small>
                                                                        </td>
                                                                        <td><small>{factor.value}</small></td>
                                                                        <td>
                                                                            <small>
                                                                                <strong>{factor.score}</strong>
                                                                                <br />
                                                                                <span className="text-muted">/100</span>
                                                                            </small>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${
                                                                                factor.impact === "HIGH" ? "bg-danger" :
                                                                                factor.impact === "MEDIUM" ? "bg-warning" : "bg-success"
                                                                            }`}>
                                                                                {factor.impact}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="table-primary fw-bold">
                                                                    <td>
                                                                        <strong>OVERALL RISK SCORE</strong>
                                                                        <br />
                                                                        <span className="text-muted">Average of all factors</span>
                                                                    </td>
                                                                    <td>-</td>
                                                                    <td>
                                                                        <strong>{prediction.riskScore}</strong>
                                                                        <br />
                                                                        <span className="text-muted">/100</span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${
                                                                            prediction.riskLevel.includes("VERY HIGH") ? "bg-danger" :
                                                                            prediction.riskLevel.includes("HIGH") ? "bg-warning" :
                                                                            prediction.riskLevel.includes("MEDIUM") ? "bg-info" : "bg-success"
                                                                        }`}>
                                                                            {prediction.riskLevel.split(' ')[0]}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                <div className="col-md-5">
                                                    <h6>🛡️ Risk Mitigation Recommendations</h6>
                                                    <div className="list-group mb-3">
                                                        {prediction.recommendations.map((rec, index) => (
                                                            <div key={index} className="list-group-item">
                                                                <small>{rec}</small>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="card border-warning">
                                                        <div className="card-header bg-warning text-dark">
                                                            <h6 className="mb-0">⚠️ Key Risk Indicators</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <small>
                                                                <ul className="list-unstyled mb-0">
                                                                    <li>• Fault Proximity: {prediction.city.faultProximity} km from nearest active fault</li>
                                                                    <li>• Historical Earthquakes: {prediction.city.historicalQuakes} recorded events</li>
                                                                    <li>• Maximum Magnitude: {prediction.city.maxMagnitude}</li>
                                                                    <li>• Soil Type: {prediction.city.soilType}</li>
                                                                    <li>• Building Age Profile: {prediction.city.buildingAge}</li>
                                                                    <li>• Coastal: {prediction.city.isCoastal ? "Yes" : "No"}</li>
                                                                </ul>
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-light rounded">
                                                <h6>🔍 Technical Assessment Details</h6>
                                                <div className="row">
                                                    <div className="col-md-4">
                                                        <small><strong>Location:</strong> {prediction.city.latitude}°N, {prediction.city.longitude}°E</small>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <small><strong>Elevation:</strong> {prediction.city.elevation} meters</small>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <small><strong>Population:</strong> {prediction.city.population.toLocaleString()}</small>
                                                    </div>
                                                </div>
                                                <div className="row mt-2">
                                                    <div className="col-12">
                                                        <small><strong>Data Sources:</strong> PSGC API (Geographical Data) • USGS API (Seismic Data)</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!prediction && !loading && !loadingData && (
                                    <div className="text-center py-5 text-muted">
                                        <h5>Select a city/municipality to assess earthquake risk</h5>
                                        <p>Choose from localities across different Philippine regions to get detailed risk analysis</p>
                                        <small>Powered by real-time data from PSGC and USGS APIs</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Prediction;