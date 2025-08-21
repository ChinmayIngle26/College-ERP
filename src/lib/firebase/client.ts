
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// IMPORTANT: Ensure you have a .env.local file in the root of your project
// with your Firebase configuration variables.
// These variables MUST be prefixed with NEXT_PUBLIC_ to be available on the client-side.
// You can find these values in your Firebase project console:
// Project Settings > General tab > Your apps > Web app > SDK setup and configuration (select Config).
//
// Example .env.local content:
// NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
// NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef...
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (Optional for Analytics)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Uncomment if using Analytics
};

// --- Configuration Validation ---
// Define required keys for basic Auth/Firestore functionality
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingConfigKeys = requiredKeys.filter(
  (key) => !(firebaseConfig as Record<string, any>)[key]
).map((key) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (missingConfigKeys.length > 0) {
  console.error(
    `\n--- FIREBASE CONFIGURATION ERROR ---` +
    `\nFirebase initialization failed due to missing or incomplete environment variables.` +
    `\nPlease ensure the following environment variables are correctly set in your .env.local file:` +
    `\n${missingConfigKeys.join('\n')}` +
    `\n\nCommon Issues:` +
    `\n1. The '.env.local' file is missing or located in the wrong directory (should be in the project root).` +
    `\n2. Variables are missing the required 'NEXT_PUBLIC_' prefix.` +
    `\n3. The development server was not restarted after modifying '.env.local'.` +
    `\n4. Incorrect values were copied from the Firebase console.` +
    `\n\nFind your config values in: Firebase Console > Project Settings > General tab > Your apps > Web app > SDK setup and configuration.` +
    `\nFirebase services (Auth, Firestore, etc.) will NOT function correctly.` +
    `\n---------------------------------------\n`
  );
} else {
  // --- Firebase Initialization ---
  try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
    } else {
        app = getApp();
        console.log("Firebase app already exists.");
    }

    // Get Auth and Firestore instances ONLY if app initialization was successful
    auth = getAuth(app);
    db = getFirestore(app);

  } catch (error: any) {
    console.error(
        `\n--- FIREBASE INITIALIZATION FAILED ---` +
        `\nAn error occurred during Firebase initialization: ${error.message}` +
        `\nCode: ${error.code || 'N/A'}` +
        `\n\nCheck:` +
        `\n1. Your Firebase project settings (is the project active?).` +
        `\n2. The configuration values in '.env.local' (API Key, Auth Domain, Project ID etc.).` +
        `\n3. Network connectivity.` +
        `\n--------------------------------------\n`
        );
    // Ensure auth and db remain null if initialization fails
    app = null;
    auth = null;
    db = null;
  }
}

// Export potentially null values; consuming code MUST handle this possibility.
export { app, auth, db };
