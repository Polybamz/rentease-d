/**
 * Firebase client configuration.
 *
 * Reads the web-app config from Vite env vars (`.env`). Exposes the singletons
 * used across the app for Authentication and Storage. If the API key is missing
 * the config is skipped and `firebaseConfigError` is set so the UI can render a
 * helpful warning instead of crashing.
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

function readConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  if (!apiKey) return { config: null, error: "Missing VITE_FIREBASE_API_KEY in .env" };
  return {
    config: {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    },
    error: null,
  };
}

const { config, error } = readConfig();

let app: FirebaseApp | null = null;
let auth: Auth;
let googleProvider: GoogleAuthProvider | null = null;

if (config) {
  app = initializeApp(config);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export const firebaseConfigError = error;
export { app, auth, googleProvider };