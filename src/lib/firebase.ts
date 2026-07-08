import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

function validateApiKey(key: string | undefined): string | null {
  if (!key || key.trim() === "") {
    return "VITE_FIREBASE_API_KEY is missing. Add it to your .env file (from Firebase Console → Project settings → Your apps → Web app).";
  }
  const trimmed = key.trim();
  if (trimmed.startsWith("@secret:") || trimmed.includes(" ")) {
    return "VITE_FIREBASE_API_KEY looks like a placeholder or contains whitespace. Paste the raw key value (starts with 'AIzaSy').";
  }
  if (!trimmed.startsWith("AIza") || trimmed.length < 30) {
    return "VITE_FIREBASE_API_KEY doesn't look like a valid Firebase Web API key (should start with 'AIzaSy' and be ~39 chars).";
  }
  return null;
}

export const firebaseConfigError: string | null = validateApiKey(firebaseConfig.apiKey);

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

if (!firebaseConfigError) {
  try {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    _db = getFirestore(_app);
    _auth = getAuth(_app);
  } catch (err) {
    console.error("[firebase] Initialization failed:", err);
  }
} else {
  console.warn("[firebase] " + firebaseConfigError);
}

function makeUnavailableProxy<T>(name: string): T {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          `[firebase] ${name} is unavailable: ${firebaseConfigError ?? "Firebase failed to initialize."}`
        );
      },
    }
  ) as T;
}

export const firebaseApp: FirebaseApp = _app ?? makeUnavailableProxy<FirebaseApp>("firebaseApp");
export const db: Firestore = _db ?? makeUnavailableProxy<Firestore>("db");
export const auth: Auth = _auth ?? makeUnavailableProxy<Auth>("auth");
export const googleProvider = new GoogleAuthProvider();

let analyticsInstance: Analytics | null = null;
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (!_app) return null;
  if (analyticsInstance) return analyticsInstance;
  if (!firebaseConfig.measurementId) return null;
  if (await isSupported()) {
    analyticsInstance = getAnalytics(_app);
    return analyticsInstance;
  }
  return null;
}
