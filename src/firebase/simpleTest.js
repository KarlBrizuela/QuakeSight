// Simple Firebase initialization test
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAdQ1ABJINjhf0XIfroF51Qt5DvyIQj2UI",
  authDomain: "quakesight-earthquake-db.firebaseapp.com",
  projectId: "quakesight-earthquake-db",
  storageBucket: "quakesight-earthquake-db.firebasestorage.app",
  messagingSenderId: "67910196111",
  appId: "1:67910196111:web:243d18125a281e0cdc49fa",
  measurementId: "G-8JMXKKR1HB"
};

// Simple test function
export const testBasicFirebase = () => {
  try {
    console.log('🔧 Testing basic Firebase initialization...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized:', app.name);
    console.log('✅ Firebase app options:', app.options);
    
    // Initialize Firestore
    const db = getFirestore(app);
    console.log('✅ Firestore initialized:', !!db);
    console.log('✅ Database app:', db.app.name);
    
    return {
      success: true,
      message: 'Firebase initialized successfully',
      app: app,
      db: db
    };
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Make it available globally for browser testing
if (typeof window !== 'undefined') {
  window.testBasicFirebase = testBasicFirebase;
}