import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// All values here are public Firebase web config — safe to ship to the browser.
// Defined with the VITE_ prefix in env/.env.local so Vite inlines them at build.
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

// Reuse the app across HMR / prerender passes instead of re-initialising.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);

// Functions region — must match the region used in functions/src/index.ts.
export const functions = getFunctions(firebaseApp, "us-central1");
