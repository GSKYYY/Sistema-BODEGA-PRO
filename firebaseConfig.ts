import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase Configuration for Bodega Pro
const firebaseConfig = {
  apiKey: "AIzaSyDI_4DGqmS_B04eNb8UB9pnHeerP-_qwrw",
  authDomain: "bodegapro-266ce.firebaseapp.com",
  projectId: "bodegapro-266ce",
  storageBucket: "bodegapro-266ce.firebasestorage.app",
  messagingSenderId: "265078323568",
  appId: "1:265078323568:web:61222f16dd98a6522377b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
// This ensures the app works without internet by storing data locally
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

export { db, auth };