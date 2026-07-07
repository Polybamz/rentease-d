import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: "spendwise-936ca.firebaseapp.com",
  projectId: "spendwise-936ca",
  storageBucket: "spendwise-936ca.firebasestorage.app",
  messagingSenderId: "230886907337",
  appId: "1:230886907337:web:c863a63591dbc788781c18",
  measurementId: "G-FTVX4MNL58",
};

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let analyticsInstance: Analytics | null = null;
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  if (await isSupported()) {
    analyticsInstance = getAnalytics(firebaseApp);
    return analyticsInstance;
  }
  return null;
}
