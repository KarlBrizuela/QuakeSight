// Enhanced Firebase connection test with better error handling
import { db } from './config';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('🧪 Testing Firebase connection...');
    console.log('🧪 Database instance:', db);
    
    // Check if db is properly initialized
    if (!db) {
      return {
        success: false,
        error: 'Database instance is undefined. Check Firebase configuration.',
        message: 'Firebase not initialized properly'
      };
    }
    
    // Safely access database properties
    let projectId = 'unknown';
    try {
      projectId = db._delegate?._databaseId?.projectId || db.app?.options?.projectId || 'unknown';
      console.log('🧪 Project ID:', projectId);
    } catch (accessError) {
      console.log('⚠️ Could not access project ID:', accessError.message);
    }
    
    // First try to read data (requires less permissions)
    console.log('🧪 Testing read permissions...');
    try {
      const testQuery = query(collection(db, 'test_collection'), limit(1));
      const snapshot = await getDocs(testQuery);
      console.log('✅ Read test successful, found', snapshot.size, 'documents');
    } catch (readError) {
      console.log('⚠️ Read test failed:', readError.message);
    }
    
    // Try to add a simple test document
    const testData = {
      test: true,
      message: 'Firebase connection test',
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server Environment',
      randomId: Math.random().toString(36).substring(7)
    };
    
    console.log('🧪 Testing write permissions...');
    console.log('🧪 Adding test document to collection: test_collection');
    const docRef = await addDoc(collection(db, 'test_collection'), testData);
    console.log('✅ Test document added with ID:', docRef.id);
    
    return {
      success: true,
      message: 'Firebase connection and permissions working correctly',
      docId: docRef.id,
      projectId: projectId
    };
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    
    // Provide specific error messages based on error code
    let errorMessage = error.message;
    let solution = '';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied - Firestore security rules are blocking this operation';
      solution = 'Update Firestore security rules to allow read/write operations in development mode';
    } else if (error.code === 'failed-precondition') {
      errorMessage = 'Firestore database not properly initialized';
      solution = 'Ensure Firestore database is created and enabled in Firebase Console';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Firebase service temporarily unavailable';
      solution = 'Check internet connection and try again';
    }
    
    return {
      success: false,
      error: errorMessage,
      solution: solution,
      code: error.code,
      projectId: db._delegate._databaseId.projectId,
      details: error
    };
  }
};