import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

export const FIREBASE_DATABASE_URL = (
  import.meta.env.VITE_FIREBASE_DATABASE_URL ??
  "https://acuario-fa7d7.firebaseio.com"
).replace(/\/$/, "");

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "acuario-fa7d7.firebaseapp.com",
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "acuario-fa7d7",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "acuario-fa7d7.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

export function firebaseDisponible(): boolean {
  return Boolean(firebaseConfig.databaseURL);
}

export function obtenerDatabase(): Database | null {
  if (!firebaseDisponible()) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  if (!database) {
    database = getDatabase(app);
  }
  return database;
}
