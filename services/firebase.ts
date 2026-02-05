import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Try to get config from window (Render/Production environment injection)
// or from import.meta.env (Vite dev/build environment)
const firebaseConfig = (window as any).__firebase_config
    ? JSON.parse((window as any).__firebase_config)
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

const appId = (window as any).__app_id || import.meta.env.VITE_APP_ID || 'infistel-app';

let app = null;
try {
    if (getApps().length === 0) {
        if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined") {
            app = initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully");
        } else {
            console.warn("Firebase configuration missing or incomplete. Using local persistence fallback.");
        }
    } else {
        app = getApp();
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export { appId };
export default app;
