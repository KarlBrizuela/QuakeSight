import { collection, addDoc, getDocs, query, orderBy, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// Collection name for earthquake predictions
const COLLECTION_NAME = 'earthquake_predictions';

// Simple test function to check if collection is accessible
export const testCollectionAccess = async () => {
  try {
    console.log('🧪 Testing collection access...');
    const collectionRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(collectionRef);
    
    console.log('✅ Collection accessible, document count:', snapshot.size);
    return {
      success: true,
      count: snapshot.size,
      message: `Collection accessible with ${snapshot.size} documents`
    };
  } catch (error) {
    console.error('❌ Collection access error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to access collection'
    };
  }
};

// Save earthquake risk prediction to database
export const savePredictionToDatabase = async (predictionData) => {
  try {
    console.log('💾 Saving prediction to database...');
    console.log('💾 Input data received:', predictionData);
    console.log('💾 Database instance:', db);
    
        // Prepare data for database storage
        const dataToSave = {
            // Basic prediction info
            city: {
                name: predictionData.city?.name || (typeof predictionData.city === 'string' ? predictionData.city : 'Unknown City'),
                region: predictionData.city?.region || predictionData.region || 'Unknown Region',
                latitude: predictionData.city?.latitude || null,
                longitude: predictionData.city?.longitude || null,
                populationDensity: predictionData.city?.populationDensity || null,
                population: predictionData.city?.population || null,
                landArea: predictionData.city?.landArea || null,
                isCoastal: predictionData.city?.isCoastal || false,
                elevation: predictionData.city?.elevation || null
            },      // Risk assessment results
      riskLevel: predictionData.riskLevel,
      riskScore: parseFloat(predictionData.riskScore),
      confidence: predictionData.confidence,
      riskColor: predictionData.riskColor,
      
            // Seismic data
            seismicData: {
                faultProximity: predictionData.city?.faultProximity || null,
                historicalQuakes: predictionData.city?.historicalQuakes || 0,
                maxMagnitude: predictionData.city?.maxMagnitude || null,
                soilType: predictionData.city?.soilType || 'Unknown',
                buildingAge: predictionData.city?.buildingAge || 'Unknown',
                dataSource: predictionData.city?.dataSource || 'Unknown',
                isEnhancedData: predictionData.city?.isEnhancedData || false
            },
            
            // Factor details for later analysis
            factorScores: (predictionData.factorDetails || []).map(factor => ({
                factor: factor?.factor || 'Unknown Factor',
                score: parseFloat(factor?.score || 0),
                impact: factor?.impact || 'UNKNOWN',
                value: factor?.value || 'N/A'
            })),
            
            // Recommendations
            recommendations: predictionData.recommendations || [],
            
            // Metadata
            timestamp: serverTimestamp(),
            assessmentDate: predictionData.timestamp || new Date().toISOString(),
            overallExplanation: predictionData.overallExplanation || 'Risk assessment completed',
            
            // ML predictions if available
            mlPredictions: {
                risk5yr: predictionData.mlRisk5yr || null,
                risk10yr: predictionData.mlRisk10yr || null
            }
    };
    
    // Add document to Firestore
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
    
    console.log('✅ Prediction saved successfully with ID:', docRef.id);
    return {
      success: true,
      id: docRef.id,
      message: 'Earthquake risk prediction saved successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error saving prediction:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to save prediction. Please try again.'
    };
  }
};

// Get all saved predictions (for history/analysis)
export const getSavedPredictions = async (limitValue = 50) => {
  try {
    console.log('📖 Fetching saved predictions...');
    
    const q = limitValue > 0 ? query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(limitValue)
    ) : query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const predictions = [];
    
    querySnapshot.forEach((doc) => {
      predictions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Retrieved ${predictions.length} saved predictions`);
    return {
      success: true,
      data: predictions
    };
    
  } catch (error) {
    console.error('❌ Error fetching predictions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get predictions for a specific city
export const getPredictionsForCity = async (cityName, regionName) => {
  try {
    console.log(`📖 Fetching predictions for ${cityName}, ${regionName}...`);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('city.name', '==', cityName),
      where('city.region', '==', regionName),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const predictions = [];
    
    querySnapshot.forEach((doc) => {
      predictions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Retrieved ${predictions.length} predictions for ${cityName}`);
    return {
      success: true,
      data: predictions
    };
    
  } catch (error) {
    console.error('❌ Error fetching city predictions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get predictions by risk level (for analytics)
export const getPredictionsByRiskLevel = async (riskLevel) => {
  try {
    console.log(`📊 Fetching ${riskLevel} risk predictions...`);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('riskLevel', '==', riskLevel),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const predictions = [];
    
    querySnapshot.forEach((doc) => {
      predictions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Retrieved ${predictions.length} ${riskLevel} predictions`);
    return {
      success: true,
      data: predictions
    };
    
  } catch (error) {
    console.error('❌ Error fetching risk level predictions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};