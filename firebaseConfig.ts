
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDI_4DGqmS_B04eNb8UB9pnHeerP-_qwrw",
  authDomain: "bodegapro-266ce.firebaseapp.com",
  projectId: "bodegapro-266ce",
  storageBucket: "bodegapro-266ce.firebasestorage.app",
  messagingSenderId: "265078323568",
  appId: "1:265078323568:web:61222f16dd98a6522377b5"
};

let app;
// Initialize as mocks by default so imports don't crash the UI
let db: any = { type: 'mock', _isMock: true };
let auth: any = { type: 'mock', _isMock: true };

try {
    // 1. Initialize App (Singleton pattern)
    // Prevents "Firebase App named '[DEFAULT]' already exists" error
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // 2. Initialize Firestore safely
    try {
        const firestoreInstance = getFirestore(app);
        db = firestoreInstance;

        // Try to enable persistence (offline support)
        // This often fails in privacy mode or specific environments, so we catch it
        if (typeof window !== 'undefined') {
             try {
                 enableIndexedDbPersistence(db).catch((err) => {
                     // Silent suppression: Persistence failure is common (e.g. multiple tabs) and non-critical
                     console.debug("Firestore Persistence:", err.code);
                 });
             } catch (err) {
                 // Ignore synchronous persistence errors
             }
        }
    } catch (e) {
        console.warn("Firestore unavailable (running in offline/demo mode)");
    }

    // 3. Initialize Auth safely
    try {
        auth = getAuth(app);
    } catch (e) {
        console.warn("Auth unavailable (running in offline/demo mode)");
    }

} catch (e) {
    console.warn("Firebase core init failed. App running in detached mode.");
}

export { db, auth };
