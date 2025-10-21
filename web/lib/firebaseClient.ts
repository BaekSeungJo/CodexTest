import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;

export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    };

    if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
      throw new Error("Missing Firebase configuration. Please set NEXT_PUBLIC_FIREBASE_* environment variables.");
    }

    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  }

  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const app = getFirebaseApp();
    auth = getAuth(app);
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    }
  }

  return auth;
};
