import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? "",
};

function isConfiguredValue(val: string): boolean {
  return Boolean(val && !val.startsWith("your-") && !val.includes("YOUR_"));
}

export const isFirebaseConfigured =
  isConfiguredValue(firebaseConfig.apiKey) && isConfiguredValue(firebaseConfig.projectId);

let cachedServices: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

export function getFirebaseServices(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }

  if (!cachedServices) {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    cachedServices = { app, auth, db };
  }

  return cachedServices;
}
