// Browser-compatible Firebase test
import { db } from './config';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

// Function to test Firebase in browser console
window.testFirebase = async () => {
  try {
    console.log('🧪 Testing Firebase connection...');
    console.log('🧪 Database instance:', db);
    console.log('🧪 Project ID:', db._delegate._databaseId.projectId);
    
    // Test read permissions
    console.log('🧪 Testing read permissions...');
    try {
      const testQuery = query(collection(db, 'test_collection'), limit(1));
      const snapshot = await getDocs(testQuery);
      console.log('✅ Read test successful, found', snapshot.size, 'documents');
    } catch (readError) {
      console.log('⚠️ Read test failed:', readError.message);
    }
    
    // Test write permissions
    const testData = {
      test: true,
      message: 'Firebase connection test from browser',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      randomId: Math.random().toString(36).substring(7)
    };
    
    console.log('🧪 Testing write permissions...');
    const docRef = await addDoc(collection(db, 'test_collection'), testData);
    console.log('✅ Test document added with ID:', docRef.id);
    
    return {
      success: true,
      message: 'Firebase connection working!',
      docId: docRef.id
    };
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

console.log('Firebase test loaded. Run testFirebase() in console to test.');