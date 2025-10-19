// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase config
// You'll need to replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAdQ1ABJINjhf0XIfroF51Qt5DvyIQj2UI",
  authDomain: "quakesight-earthquake-db.firebaseapp.com",
  projectId: "quakesight-earthquake-db",
  storageBucket: "quakesight-earthquake-db.firebasestorage.app",
  messagingSenderId: "67910196111",
  appId: "1:67910196111:web:243d18125a281e0cdc49fa",
  measurementId: "G-8JMXKKR1HB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;