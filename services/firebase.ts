import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = (window as any).__firebase_config
    ? JSON.parse((window as any).__firebase_config)
    : null;

const appId = (window as any).__app_id || 'infistel-app';

let app;
if (getApps().length === 0) {
    if (firebaseConfig && firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
    } else {
        // Fallback or placeholder for development without Firebase keys
        app = null;
    }
} else {
    app = getApp();
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export { appId };
export default app;
