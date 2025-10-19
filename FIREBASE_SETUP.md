# Firebase Setup Instructions for QuakeSight

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Project name: `quakesight-earthquake-db` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Firestore Database

1. In your Firebase project console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your preferred location (choose closest to your users)
5. Click "Done"

## 3. Get Firebase Configuration

1. In Firebase console, click the gear icon (⚙️) → "Project settings"
2. Scroll down to "Your apps" section
3. Click "Web" icon (`</>`) to add a web app
4. App nickname: `QuakeSight Web App`
5. Click "Register app"
6. Copy the Firebase configuration object

## 4. Update Your Firebase Config

Replace the placeholder values in `src/firebase/config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## 5. Firestore Security Rules (Development)

In Firebase Console → Firestore Database → Rules, use these rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to earthquake_predictions collection
    match /earthquake_predictions/{document} {
      allow read, write: if true; // Change this for production
    }
  }
}
```

## 6. Production Security Rules (Later)

For production, implement proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /earthquake_predictions/{document} {
      allow read: if true;  // Allow public read access
      allow write: if request.auth != null;  // Require authentication for writes
    }
  }
}
```

## 7. Database Structure

The saved earthquake predictions will have this structure:

```
earthquake_predictions/
├── {auto-generated-id}/
│   ├── city: {
│   │   ├── name: string
│   │   ├── region: string
│   │   ├── latitude: number
│   │   ├── longitude: number
│   │   ├── populationDensity: number
│   │   ├── isCoastal: boolean
│   │   └── ...
│   │ }
│   ├── riskLevel: string
│   ├── riskScore: number
│   ├── factorScores: array
│   ├── recommendations: array
│   ├── timestamp: timestamp
│   └── ...
```

## 8. Testing the Database

1. Run your application: `npm start`
2. Generate an earthquake risk prediction
3. Click the "💾 Save Assessment" button
4. Check Firebase Console → Firestore Database to see the saved data

## 9. Optional: Analytics & Monitoring

Enable Firebase Analytics and Performance Monitoring:
1. Firebase Console → Analytics → Enable
2. Firebase Console → Performance → Enable

## 10. Environment Variables (Recommended)

For security, create `.env` file in your project root:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

Then update `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

## 🚀 You're Ready!

After completing these steps, your earthquake risk predictions will be automatically saved to Firebase Firestore database when users click the save button.