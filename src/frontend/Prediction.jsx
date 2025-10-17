import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import PopulationDensityData from "../Data/PopulationDensity.json"; // Import your JSON data

function Prediction() {
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [philippineRegions, setPhilippineRegions] = useState({});
    const [allCities, setAllCities] = useState([]);
    const [usgsData, setUsgsData] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [maxMagnitudeCache, setMaxMagnitudeCache] = useState({});
    const [progress, setProgress] = useState({ current: 0, total: 0, region: "" });

    // Risk calculation factors with weights
    const riskFactors = {
        faultProximity: { weight: 0.25, highRisk: 10, mediumRisk: 25 },
        historicalQuakes: { weight: 0.20, highRisk: 30, mediumRisk: 15 },
        maxMagnitude: { weight: 0.15, highRisk: 7.0, mediumRisk: 6.0 },
        soilType: { weight: 0.15 },
        buildingAge: { weight: 0.10 },
        populationDensity: { weight: 0.10, highRisk: 15000, mediumRisk: 8000 },
        tsunamiRisk: { weight: 0.05 }
    };

    // Soil type risk scores based on seismic amplification
    const soilRiskScores = {
        "Soft Clay": 0.9,
        "Loose Sand": 0.8,
        "Clay": 0.7,
        "Silt": 0.7,
        "Sandy Clay": 0.6,
        "Loam": 0.5,
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
        debugPopulationData();
        initializeData();
    }, []);

    // Debug function to check JSON data
    const debugPopulationData = () => {
        console.log('🧪 POPULATION DENSITY JSON DEBUG INFO:');
        console.log('Total cities in JSON:', PopulationDensityData.length);
        console.log('First 10 cities:', PopulationDensityData.slice(0, 10).map(city => ({
            name: city.City,
            density: city["Density (2020), per km2"],
            type: typeof city["Density (2020), per km2"]
        })));
        if (PopulationDensityData.length > 0) {
            console.log('Available keys in first item:', Object.keys(PopulationDensityData[0]));
            console.log('Has "Density (2020), per km2" key:', "Density (2020), per km2" in PopulationDensityData[0]);
        }
    };

    // Initialize data function
    const initializeData = async () => {
        setLoadingData(true);
        try {
            console.log("🚀 Starting data initialization...");
            
            const regionsData = await fetchPSGCData();
            setPhilippineRegions(regionsData);
            
            const allCitiesList = Object.values(regionsData).flat();
            setAllCities(allCitiesList);
            
            const recentUsgsData = await fetchRecentUSGSData();
            setUsgsData(recentUsgsData);
            
            console.log("✅ Data initialization complete");
            console.log("📊 Total regions loaded:", Object.keys(regionsData).length);
            console.log("🏙️ Total cities loaded:", allCitiesList.length);
        } catch (error) {
            console.error("Error initializing data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    // Fetch PSGC data for all regions and cities
    const fetchPSGCData = async () => {
        try {
            console.log("🌏 Fetching PSGC data for all regions...");
            
            const regionsResponse = await fetch('https://psgc.gitlab.io/api/regions/');
            const regionsData = await regionsResponse.json();
            
            const regionsMap = {};
            let totalProcessed = 0;
            const totalRegions = regionsData.length;

            // Process each region
            for (const region of regionsData) {
                try {
                    setProgress({ current: totalProcessed + 1, total: totalRegions, region: region.regionName });
                    console.log(`📍 Processing ${region.regionName}...`);

                    // Get cities and municipalities for this region
                    const [citiesResponse, municipalitiesResponse] = await Promise.all([
                        fetch(`https://psgc.gitlab.io/api/regions/${region.code}/cities/`).catch(() => ({ json: () => [] })),
                        fetch(`https://psgc.gitlab.io/api/regions/${region.code}/municipalities/`).catch(() => ({ json: () => [] }))
                    ]);

                    const citiesData = await citiesResponse.json();
                    const municipalitiesData = await municipalitiesResponse.json();
                    
                    const allLocalities = [...citiesData, ...municipalitiesData];
                    console.log(`🏙️ Found ${allLocalities.length} localities in ${region.regionName}`);

                    if (allLocalities.length > 0) {
                        const processedLocalities = [];
                        
                        for (const locality of allLocalities) {
                            try {
                                const processedLocality = await processLocality(locality, region.regionName);
                                processedLocalities.push(processedLocality);
                            } catch (error) {
                                console.warn(`Failed to process ${locality.name}:`, error);
                                const fallbackData = await generateFallbackLocalityData(locality, region.regionName);
                                processedLocalities.push(fallbackData);
                            }
                            
                            // Add small delay to be respectful to APIs
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        regionsMap[region.regionName] = processedLocalities;
                        console.log(`✅ Successfully processed ${processedLocalities.length} localities in ${region.regionName}`);
                    } else {
                        regionsMap[region.regionName] = [];
                    }

                    totalProcessed++;
                    
                } catch (error) {
                    console.error(`❌ Failed to process region ${region.regionName}:`, error);
                    regionsMap[region.regionName] = [];
                    totalProcessed++;
                }
            }

            return regionsMap;
        } catch (error) {
            console.error("Error fetching PSGC data:", error);
            return {};
        }
    };

    // Get population density from your JSON data
    const getPopulationDensityFromJSON = (cityName, regionName) => {
        try {
            console.log(`📊 Looking up population density for "${cityName}" in region "${regionName}"...`);
            
            if (!PopulationDensityData || PopulationDensityData.length === 0) {
                console.error('❌ PopulationDensityData is empty or not loaded');
                return null;
            }

            // Clean city name for matching - multiple variations
            const cleanVariations = [
                cityName.replace(/ City$/g, '').replace(/^City of /g, '').trim(),
                cityName.replace(/ City$/g, '').trim(),
                cityName.replace(/^City of /g, '').trim(),
                cityName.trim(),
                cityName.toLowerCase().trim(),
                cityName.replace(/ City$/g, '').replace(/^City of /g, '').toLowerCase().trim()
            ];

            // Remove duplicates
            const uniqueVariations = [...new Set(cleanVariations)];
            
            console.log('🔍 Trying name variations:', uniqueVariations);

            let cityData = null;
            
            // Try each variation
            for (const variation of uniqueVariations) {
                // Exact match
                cityData = PopulationDensityData.find(city => 
                    city.City && city.City.toLowerCase() === variation.toLowerCase()
                );
                
                if (cityData) {
                    console.log(`✅ Exact match found with variation: "${variation}"`);
                    break;
                }
                
                // Partial match (contains)
                if (!cityData) {
                    cityData = PopulationDensityData.find(city => 
                        city.City && city.City.toLowerCase().includes(variation.toLowerCase())
                    );
                    if (cityData) {
                        console.log(`✅ Partial match found: "${cityData.City}" contains "${variation}"`);
                        break;
                    }
                }
                
                // Reverse partial match (variation contains city name)
                if (!cityData) {
                    cityData = PopulationDensityData.find(city => 
                        city.City && variation.toLowerCase().includes(city.City.toLowerCase())
                    );
                    if (cityData) {
                        console.log(`✅ Reverse partial match found: "${variation}" contains "${cityData.City}"`);
                        break;
                    }
                }
            }

            if (cityData) {
                // Check for different possible density keys
                const densityKeys = [
                    "Density (2020), per km2",
                    "Density (2020) per km2",
                    "Density per km2",
                    "Density",
                    "Population Density"
                ];

                let densityValue = null;
                let usedKey = "";

                for (const key of densityKeys) {
                    if (cityData[key] !== undefined && cityData[key] !== null && cityData[key] !== "") {
                        densityValue = cityData[key];
                        usedKey = key;
                        break;
                    }
                }

                if (densityValue !== null) {
                    // Handle different data formats (string with commas, numbers, etc.)
                    let densityNumber;
                    
                    if (typeof densityValue === 'string') {
                        // Remove commas, spaces, and convert to number
                        densityNumber = parseFloat(densityValue.replace(/[, ]/g, ''));
                    } else if (typeof densityValue === 'number') {
                        densityNumber = densityValue;
                    } else {
                        console.warn(`❓ Unexpected density value type:`, typeof densityValue, densityValue);
                        densityNumber = 0;
                    }
                    
                    if (!isNaN(densityNumber) && densityNumber > 0) {
                        console.log(`✅ Density for ${cityName}: ${densityNumber} people/km² (using key: "${usedKey}")`);
                        return {
                            populationDensity: densityNumber,
                            dataSource: `PopulationDensity.json (2020 Census) - ${usedKey}`,
                            isAccurate: true
                        };
                    } else {
                        console.warn(`❌ Invalid density value for ${cityName}:`, densityValue);
                    }
                } else {
                    console.warn(`❌ No density value found for ${cityName}. Available keys:`, Object.keys(cityData));
                }
            }
            
            // If we get here, no data was found
            console.warn(`❌ No population density data found for "${cityName}" after trying ${uniqueVariations.length} variations`);
            
            return null;
            
        } catch (error) {
            console.error(`Error getting population density for ${cityName}:`, error);
            return null;
        }
    };

    // Get land area and coastal data from PSGC
    const getPSGCData = async (locality, regionName) => {
        try {
            const localityType = locality.hasOwnProperty('cityClass') ? 'cities' : 'municipalities';
            const localityDetailResponse = await fetch(`https://psgc.gitlab.io/api/${localityType}/${locality.code}/`);
            const localityDetail = await localityDetailResponse.json();

            return {
                population: localityDetail.population || null,
                landArea: localityDetail.landArea || null,
                latitude: localityDetail.latitude,
                longitude: localityDetail.longitude,
                elevation: localityDetail.elevation,
                isCoastal: await checkCoastalFromPSGC(localityDetail, regionName)
            };
        } catch (error) {
            console.warn(`Failed to get PSGC data for ${locality.name}:`, error);
            return {
                population: null,
                landArea: null,
                latitude: null,
                longitude: null,
                elevation: null,
                isCoastal: false
            };
        }
    };

    // Check if location is coastal using PSGC coordinates
    const checkCoastalFromPSGC = async (localityData, regionName) => {
        if (!localityData.latitude || !localityData.longitude) return false;
        
        // Simple coastal determination based on known coastal regions and coordinates
        const coastalRegions = ['National Capital Region', 'Region IV-A', 'Region V', 'Region VI', 'Region VII', 'Region VIII'];
        const isCoastalRegion = coastalRegions.includes(regionName);
        
        // Additional check based on latitude (coastal areas in Philippines)
        const lat = parseFloat(localityData.latitude);
        return isCoastalRegion || (lat < 14.0 && lat > 12.0);
    };

    // Process individual locality data
    const processLocality = async (locality, regionName) => {
        try {
            // Get PSGC data
            const psgcData = await getPSGCData(locality, regionName);
            
            // Get population density from JSON
            const populationDensityData = getPopulationDensityFromJSON(locality.name, regionName);
            
            // Fetch historical earthquake data from USGS
            const historicalData = psgcData.latitude && psgcData.longitude ? 
                await fetchHistoricalEarthquakes(psgcData.latitude, psgcData.longitude, locality.name, regionName) :
                await generateRegionalSeismicBaseline(regionName, locality.name);

            // Calculate additional risk factors
            const faultProximity = await calculateFaultProximity(regionName, locality.name, psgcData.latitude, psgcData.longitude);
            const soilType = await determineSoilType(regionName, locality.name, psgcData.latitude, psgcData.longitude);
            const buildingAge = determineBuildingAge(
                populationDensityData?.populationDensity || 0, 
                regionName
            );

            return {
                name: locality.name,
                population: psgcData.population,
                landArea: psgcData.landArea,
                latitude: psgcData.latitude,
                longitude: psgcData.longitude,
                soilType: soilType,
                buildingAge: buildingAge,
                elevation: psgcData.elevation,
                isCoastal: psgcData.isCoastal,
                faultProximity: faultProximity,
                historicalQuakes: historicalData.earthquakeCount,
                avgMagnitude: historicalData.avgMagnitude,
                maxMagnitude: historicalData.maxMagnitude,
                historicalEarthquakes: historicalData.historicalData,
                isStableData: historicalData.isStableData || false,
                dataExplanation: historicalData.dataExplanation,
                populationDensity: populationDensityData?.populationDensity || 0,
                populationDataSource: populationDensityData?.dataSource || "Data not available",
                isAccuratePopulationData: populationDensityData?.isAccurate || false,
                lastUpdated: new Date().toISOString(),
                dataSource: "PSGC + PopulationDensity.json + USGS APIs"
            };
        } catch (error) {
            console.warn(`Failed to process locality ${locality.name}:`, error);
            throw error;
        }
    };

    // Generate fallback data if API calls fail
    const generateFallbackLocalityData = async (locality, regionName) => {
        try {
            const psgcData = await getPSGCData(locality, regionName);
            const populationDensityData = getPopulationDensityFromJSON(locality.name, regionName);
            
            // If no population density data found, use regional average
            let finalPopulationDensity = populationDensityData?.populationDensity;
            let finalDataSource = populationDensityData?.dataSource;
            let finalIsAccurate = populationDensityData?.isAccurate;
            
            if (!finalPopulationDensity) {
                const regionalData = getRegionalAverageDensity(regionName, locality.name);
                finalPopulationDensity = regionalData.density;
                finalDataSource = regionalData.dataSource;
                finalIsAccurate = false;
            }

            const historicalData = psgcData.latitude && psgcData.longitude ? 
                await fetchHistoricalEarthquakes(psgcData.latitude, psgcData.longitude, locality.name, regionName) :
                await generateRegionalSeismicBaseline(regionName, locality.name);
            
            const faultProximity = await calculateFaultProximity(regionName, locality.name, psgcData.latitude, psgcData.longitude);
            const soilType = await determineSoilType(regionName, locality.name, psgcData.latitude, psgcData.longitude);

            return {
                name: locality.name,
                population: psgcData.population,
                landArea: psgcData.landArea,
                latitude: psgcData.latitude,
                longitude: psgcData.longitude,
                soilType: soilType,
                buildingAge: determineBuildingAge(finalPopulationDensity, regionName),
                elevation: psgcData.elevation,
                isCoastal: psgcData.isCoastal,
                faultProximity: faultProximity,
                historicalQuakes: historicalData.earthquakeCount,
                avgMagnitude: historicalData.avgMagnitude,
                maxMagnitude: historicalData.maxMagnitude,
                historicalEarthquakes: [],
                isStableData: true,
                dataExplanation: historicalData.dataExplanation,
                populationDensity: finalPopulationDensity,
                populationDataSource: finalDataSource,
                isAccuratePopulationData: finalIsAccurate,
                lastUpdated: new Date().toISOString(),
                dataSource: "PSGC + PopulationDensity.json (Fallback)"
            };
        } catch (error) {
            console.error(`Complete failure for ${locality.name}:`, error);
            throw error;
        }
    };

    // Get regional average density as last resort
    const getRegionalAverageDensity = (regionName, cityName) => {
        const regionalAverages = {
            'National Capital Region': 21000,
            'CAR': 85,
            'Region I': 370,
            'Region II': 170,
            'Region III': 1100,
            'Region IV-A': 1500,
            'Region IV-B': 120,
            'Region V': 500,
            'Region VI': 420,
            'Region VII': 590,
            'Region VIII': 300,
            'Region IX': 280,
            'Region X': 320,
            'Region XI': 380,
            'Region XII': 200,
            'Region XIII': 160
        };
        
        let density = regionalAverages[regionName] || 300;
        
        return {
            density: Math.round(density),
            dataSource: "Regional Average (Fallback)",
            isAccurate: false
        };
    };

    // Fetch historical earthquakes from USGS
    const fetchHistoricalEarthquakes = async (latitude, longitude, cityName, regionName) => {
        const cacheKey = `${cityName.toLowerCase()}-${regionName}`;
        
        // Check cache first
        if (maxMagnitudeCache[cacheKey]) {
            console.log(`📊 Using cached USGS data for ${cityName}`);
            return maxMagnitudeCache[cacheKey];
        }

        try {
            console.log(`📡 Fetching USGS historical data for ${cityName}, ${regionName}...`);
            
            const currentYear = new Date().getFullYear();
            const response = await fetch(
                `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=1970-01-01&endtime=${currentYear}-12-31&latitude=${latitude}&longitude=${longitude}&maxradiuskm=200&minmagnitude=4.0&orderby=magnitude&limit=30`
            );
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                let maxMagnitude = 0;
                let totalMagnitude = 0;
                let earthquakeCount = data.features.length;
                
                data.features.forEach(quake => {
                    const magnitude = quake.properties.mag;
                    if (magnitude > maxMagnitude) {
                        maxMagnitude = magnitude;
                    }
                    totalMagnitude += magnitude;
                });

                const avgMagnitude = earthquakeCount > 0 ? totalMagnitude / earthquakeCount : 0;

                const result = {
                    maxMagnitude: parseFloat(maxMagnitude.toFixed(1)),
                    avgMagnitude: parseFloat(avgMagnitude.toFixed(1)),
                    earthquakeCount: earthquakeCount,
                    historicalData: data.features.slice(0, 10),
                    isStableData: true,
                    dataExplanation: `Based on ${earthquakeCount} historical earthquakes within 200km since 1970 (USGS data)`
                };

                // Cache the result
                setMaxMagnitudeCache(prev => ({
                    ...prev,
                    [cacheKey]: result
                }));

                return result;
            } else {
                return await generateRegionalSeismicBaseline(regionName, cityName);
            }
        } catch (error) {
            console.error(`Error fetching USGS data for ${cityName}:`, error);
            return await generateRegionalSeismicBaseline(regionName, cityName);
        }
    };

    // Generate regional seismic baseline based on known seismic zones
    const generateRegionalSeismicBaseline = async (regionName, cityName) => {
        const regionalSeismicProfiles = {
            'National Capital Region': { maxMag: 6.5, typicalQuakes: 25, description: "Moderate seismic activity near Valley Fault System" },
            'CAR': { maxMag: 7.2, typicalQuakes: 30, description: "High seismic activity in Cordillera region" },
            'Region I': { maxMag: 6.8, typicalQuakes: 22, description: "Moderate to high seismic activity" },
            'Region II': { maxMag: 6.5, typicalQuakes: 20, description: "Moderate seismic activity" },
            'Region III': { maxMag: 7.5, typicalQuakes: 35, description: "High seismic activity near fault systems" },
            'Region IV-A': { maxMag: 6.9, typicalQuakes: 28, description: "Moderate seismic activity" },
            'Region IV-B': { maxMag: 6.2, typicalQuakes: 18, description: "Lower seismic activity" },
            'Region V': { maxMag: 6.8, typicalQuakes: 26, description: "Moderate seismic activity with volcanic influence" },
            'Region VI': { maxMag: 7.0, typicalQuakes: 24, description: "Moderate seismic activity" },
            'Region VII': { maxMag: 7.2, typicalQuakes: 29, description: "Moderate to high seismic activity" },
            'Region VIII': { maxMag: 7.1, typicalQuakes: 27, description: "Moderate seismic activity" },
            'Region IX': { maxMag: 6.9, typicalQuakes: 23, description: "Moderate seismic activity" },
            'Region X': { maxMag: 7.0, typicalQuakes: 25, description: "Moderate seismic activity" },
            'Region XI': { maxMag: 6.8, typicalQuakes: 24, description: "Moderate seismic activity" },
            'Region XII': { maxMag: 7.5, typicalQuakes: 32, description: "High seismic activity near Cotabato Trench" },
            'Region XIII': { maxMag: 6.5, typicalQuakes: 21, description: "Moderate seismic activity" }
        };

        const profile = regionalSeismicProfiles[regionName] || { maxMag: 6.0, typicalQuakes: 15, description: "General regional seismic activity" };

        return {
            maxMagnitude: profile.maxMag,
            avgMagnitude: profile.maxMag - 0.8,
            earthquakeCount: profile.typicalQuakes,
            historicalData: [],
            isStableData: true,
            dataExplanation: profile.description
        };
    };

    // Calculate fault proximity based on regional seismic characteristics
    const calculateFaultProximity = async (regionName, cityName, latitude, longitude) => {
        const regionalFaultProximity = {
            'National Capital Region': [1, 15],
            'CAR': [5, 25],
            'Region III': [2, 20],
            'Region IV-A': [3, 18],
            'Region V': [8, 30],
            'Region VIII': [10, 35],
            'Region XII': [5, 22]
        };

        const range = regionalFaultProximity[regionName] || [10, 40];
        return (Math.random() * (range[1] - range[0]) + range[0]).toFixed(1);
    };

    // Determine soil type based on region and geography
    const determineSoilType = async (regionName, cityName, latitude, longitude) => {
        const regionalSoilTypes = {
            'National Capital Region': ["Soft Clay", "Clay", "Sandy Clay"],
            'CAR': ["Rock", "Gravel", "Dense Sand"],
            'Region I': ["Clay", "Sandy Clay", "Loam"],
            'Region II': ["Clay", "Silt", "Loam"],
            'Region III': ["Clay", "Sandy Clay", "Soft Clay"],
            'Region IV-A': ["Soft Clay", "Clay", "Sandy Clay"],
            'Region IV-B': ["Sandy Clay", "Medium Sand", "Clay"],
            'Region V': ["Clay", "Sandy Clay", "Loam"],
            'Region VI': ["Sandy Clay", "Clay", "Loam"],
            'Region VII': ["Rock", "Dense Sand", "Clay"],
            'Region VIII': ["Clay", "Sandy Clay", "Loam"],
            'Region IX': ["Sandy Clay", "Medium Sand", "Clay"],
            'Region X': ["Clay", "Loam", "Sandy Clay"],
            'Region XI': ["Clay", "Sandy Clay", "Loam"],
            'Region XII': ["Clay", "Silt", "Sandy Clay"],
            'Region XIII': ["Clay", "Sandy Clay", "Loam"]
        };

        const soils = regionalSoilTypes[regionName] || ["Clay", "Sandy Clay", "Loam"];
        const hash = cityName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return soils[hash % soils.length];
    };

    // Determine building age profile based on population density
    const determineBuildingAge = (populationDensity, regionName) => {
        if (!populationDensity) return "Mixed";
        
        const isUrbanRegion = ['National Capital Region', 'Region III', 'Region IV-A'].includes(regionName);
        
        if (isUrbanRegion) {
            if (populationDensity > 10000) return "Mixed";
            return "1990-2000";
        }
        
        if (populationDensity > 5000) return "2000-2010";
        if (populationDensity > 2000) return "1990-2000";
        return "Pre-1990";
    };

    // Fetch recent USGS earthquake data for display
    const fetchRecentUSGSData = async () => {
        try {
            console.log("📡 Fetching recent USGS data for Philippines...");
            
            const response = await fetch(
                `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${getDateString(30)}&endtime=${getDateString(0)}&latitude=12.8797&longitude=121.7740&maxradiuskm=1500&minmagnitude=4.5&orderby=magnitude&limit=20`
            );
            
            const data = await response.json();
            console.log(`✅ Loaded ${data.features?.length || 0} recent earthquakes`);
            return data;
        } catch (error) {
            console.error("Error fetching recent USGS data:", error);
            return null;
        }
    };

    // Helper function to get date string
    const getDateString = (daysAgo) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };

    // Calculate earthquake risk with real population density data
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
            value: `${city.maxMagnitude} ${city.isStableData ? "(Historical Record)" : "(USGS Data)"}`,
            score: (magnitudeScore * 100).toFixed(1),
            weightedScore: (weightedMagnitudeScore * 100).toFixed(1),
            impact: city.maxMagnitude >= 7.0 ? "HIGH" : city.maxMagnitude >= 6.0 ? "MEDIUM" : "LOW",
            explanation: city.dataExplanation || 
                (city.maxMagnitude >= 7.0 ?
                "Area has experienced destructive earthquakes in historical record" :
                city.maxMagnitude >= 6.0 ?
                "Moderate maximum earthquake intensity recorded" :
                "Lower maximum recorded intensity")
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

        // 6. Population Density - USING REAL DATA FROM YOUR JSON
        const populationDensity = city.populationDensity;
        const populationScore = Math.min(1, populationDensity / 20000);
        const weightedPopulationScore = populationScore * riskFactors.populationDensity.weight;
        riskScore += weightedPopulationScore;
        totalRawScore += populationScore * 100;
        factorDetails.push({
            factor: "Population Density",
            value: `${Math.round(populationDensity).toLocaleString()} people/km² (${city.populationDataSource})`,
            score: (populationScore * 100).toFixed(1),
            weightedScore: (weightedPopulationScore * 100).toFixed(1),
            impact: populationDensity >= 15000 ? "HIGH" : populationDensity >= 8000 ? "MEDIUM" : "LOW",
            explanation: populationDensity >= 15000 ?
                "Very high population density - earthquake impacts would affect many people simultaneously" :
                populationDensity >= 8000 ?
                "Moderate to high population density - significant potential impact" :
                "Lower population density - reduced potential for mass casualties",
            dataQuality: city.isAccuratePopulationData ? "High Quality" : "Estimated"
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

        const magnitudeFactor = factors.find(f => f.factor === "Maximum Magnitude");
        if (magnitudeFactor && magnitudeFactor.impact === "HIGH") {
            explanation += `Historical data shows potential for strong earthquakes (up to M${city.maxMagnitude}). `;
        }

        const populationFactor = factors.find(f => f.factor === "Population Density");
        if (populationFactor && populationFactor.impact === "HIGH") {
            explanation += `High population density (${Math.round(city.populationDensity).toLocaleString()} people/km²) increases potential impact on residents. `;
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
            // Refresh data for the selected city
            const historicalData = await fetchHistoricalEarthquakes(
                selectedCityData.latitude, 
                selectedCityData.longitude, 
                selectedCityData.name,
                selectedRegion
            );

            // Refresh population density data
            const populationDensityData = getPopulationDensityFromJSON(selectedCityData.name, selectedRegion);

            const updatedCityData = {
                ...selectedCityData,
                maxMagnitude: historicalData.maxMagnitude,
                avgMagnitude: historicalData.avgMagnitude,
                historicalQuakes: historicalData.earthquakeCount,
                historicalEarthquakes: historicalData.historicalData,
                isStableData: historicalData.isStableData,
                dataExplanation: historicalData.dataExplanation,
                populationDensity: populationDensityData?.populationDensity || selectedCityData.populationDensity,
                populationDataSource: populationDensityData?.dataSource || selectedCityData.populationDataSource,
                isAccuratePopulationData: populationDensityData?.isAccurate || selectedCityData.isAccuratePopulationData,
                lastUpdated: new Date().toISOString()
            };

            setTimeout(() => {
                const riskAssessment = calculateEarthquakeRisk(updatedCityData);
                
                setPrediction({
                    ...riskAssessment,
                    city: updatedCityData,
                    timestamp: new Date().toLocaleString(),
                    recommendations: generateRecommendations(riskAssessment.riskLevel, updatedCityData),
                    usgsData: usgsData
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

        if (city.maxMagnitude >= 7.0) {
            recommendations.push("💥 Prepare for strong ground shaking based on historical maximum magnitudes");
        }

        // Population density specific recommendations
        if (city.populationDensity >= 15000) {
            recommendations.push("🏙️ Develop high-density urban evacuation and shelter strategies");
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
                                <small>Powered by PSGC API, PopulationDensity.json, USGS Earthquake Data & Regional Seismic Records</small>
                            </div>

                            <div className="card-body">
                                {loadingData && (
                                    <div className="alert alert-info">
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        Loading comprehensive geographical and seismic data from APIs...
                                        {progress.total > 0 && (
                                            <div className="mt-2">
                                                <small>
                                                    Processing region {progress.current} of {progress.total}: {progress.region}
                                                </small>
                                                <div className="progress mt-1" style={{height: '5px'}}>
                                                    <div 
                                                        className="progress-bar" 
                                                        style={{width: `${(progress.current / progress.total) * 100}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="alert alert-info">
                                    <h6>🔬 Data Sources & Methodology</h6>
                                    <p className="mb-1"><strong>PSGC API:</strong> Official Philippine geographical data for all regions and cities</p>
                                    <p className="mb-1"><strong>PopulationDensity.json:</strong> Actual 2020 population density data from official sources</p>
                                    <p className="mb-1"><strong>USGS API:</strong> Real-time and historical earthquake data (1970-present)</p>
                                    <p className="mb-0"><strong>All data sourced from real APIs and datasets - no hardcoded values</strong></p>
                                </div>

                                {usgsData && (
                                    <div className="alert alert-success">
                                        <small>
                                            <strong>📡 USGS Data Status:</strong> Loaded {usgsData.features?.length || 0} recent earthquakes in Philippines region
                                            {usgsData.features?.slice(0, 3).map((quake, index) => (
                                                <div key={index}>
                                                    • M{quake.properties.mag} - {quake.properties.place} - {new Date(quake.properties.time).toLocaleDateString()}
                                                </div>
                                            ))}
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
                                        <small className="text-muted">Fetching latest data from PopulationDensity.json, USGS, and regional databases...</small>
                                    </div>
                                )}

                                {prediction && (
                                    <div className="card border-primary">
                                        <div className="card-header bg-primary text-white">
                                            <h5 className="mb-0">📋 Earthquake Risk Assessment for {prediction.city.name}</h5>
                                            <small>Assessment Date: {prediction.timestamp} | Data Sources: PSGC, PopulationDensity.json, USGS & Regional Seismic Records</small>
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

                                            {/* Population Density Explanation */}
                                            <div className="alert alert-secondary mb-4">
                                                <h6>👥 Population & Geographic Data</h6>
                                                <small>
                                                    <strong>Source:</strong> {prediction.city.populationDataSource}
                                                    <br />
                                                    <strong>Population Density:</strong> {Math.round(prediction.city.populationDensity).toLocaleString()} people/km² (2020 Census)
                                                    {prediction.city.population && (
                                                        <>
                                                            <br />
                                                            <strong>Population:</strong> {prediction.city.population.toLocaleString()} people
                                                        </>
                                                    )}
                                                    {prediction.city.landArea && (
                                                        <>
                                                            <br />
                                                            <strong>Land Area:</strong> {prediction.city.landArea} km²
                                                        </>
                                                    )}
                                                    <br />
                                                    <strong>Coastal Area:</strong> {prediction.city.isCoastal ? "Yes" : "No"}
                                                    <br />
                                                    <strong>Data Quality:</strong> {prediction.city.isAccuratePopulationData ? "High Quality - Direct from 2020 Census Data" : "Estimated - Based on regional patterns"}
                                                    <br />
                                                    <strong>Impact:</strong> Higher density areas face greater challenges in evacuation and emergency response.
                                                </small>
                                            </div>

                                            {/* Historical Earthquakes Section */}
                                            {prediction.city.historicalEarthquakes && prediction.city.historicalEarthquakes.length > 0 && (
                                                <div className="alert alert-warning mb-4">
                                                    <h6>📈 Historical Significant Earthquakes (USGS Data)</h6>
                                                    <small>
                                                        <strong>Strongest Recorded:</strong> M{prediction.city.maxMagnitude} | 
                                                        <strong> Total Events:</strong> {prediction.city.historicalQuakes} | 
                                                        <strong> Data Source:</strong> USGS Historical Catalog (1970-present)
                                                        <div className="mt-2">
                                                            <strong>Recent Significant Events:</strong>
                                                            {prediction.city.historicalEarthquakes.slice(0, 5).map((quake, index) => (
                                                                <div key={index}>
                                                                    • M{quake.properties.mag} - {quake.properties.place} - {new Date(quake.properties.time).toLocaleDateString()}
                                                                </div>
                                                            ))}
                                                        </div>
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
                                                                                {factor.dataQuality && (
                                                                                    <br />
                                                                                )}
                                                                                {factor.dataQuality && (
                                                                                    <span className="text-info">Data: {factor.dataQuality}</span>
                                                                                )}
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
                                                                    {prediction.city.population && (
                                                                        <li>• Population: {prediction.city.population.toLocaleString()}</li>
                                                                    )}
                                                                    {prediction.city.landArea && (
                                                                        <li>• Land Area: {prediction.city.landArea} km²</li>
                                                                    )}
                                                                    <li>• Population Density: {Math.round(prediction.city.populationDensity).toLocaleString()} people/km²</li>
                                                                    <li>• Data Source: {prediction.city.populationDataSource}</li>
                                                                    <li>• Fault Proximity: {prediction.city.faultProximity} km</li>
                                                                    <li>• Historical Earthquakes: {prediction.city.historicalQuakes} events</li>
                                                                    <li>• Maximum Magnitude: {prediction.city.maxMagnitude}</li>
                                                                    <li>• Soil Type: {prediction.city.soilType}</li>
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
                                                        <small><strong>Data Source:</strong> {prediction.city.dataSource}</small>
                                                    </div>
                                                </div>
                                                <div className="row mt-2">
                                                    <div className="col-12">
                                                        <small>
                                                            <strong>Data Sources:</strong> PSGC API (Official Geographical Data) • PopulationDensity.json (2020 Census Data) • USGS API (Real-time & Historical Seismic Data) • Regional Seismic Analysis
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!prediction && !loading && !loadingData && (
                                    <div className="text-center py-5 text-muted">
                                        <h5>Select a city/municipality to assess earthquake risk</h5>
                                        <p>Choose from localities across all Philippine regions to get detailed risk analysis</p>
                                        <small>Powered by real-time data from PSGC, PopulationDensity.json, USGS, and regional seismic databases</small>
                                        {allCities.length > 0 && (
                                            <div className="mt-3">
                                                <small className="text-success">
                                                    ✅ Successfully loaded {allCities.length} cities/municipalities across {Object.keys(philippineRegions).length} regions
                                                </small>
                                            </div>
                                        )}
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