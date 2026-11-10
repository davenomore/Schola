import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: "teacher-assistant-383cf.firebaseapp.com",
  projectId: "teacher-assistant-383cf",
  storageBucket: "teacher-assistant-383cf.firebasestorage.app",
  messagingSenderId: "835083313032",
  appId: "1:835083313032:web:214ad1692511b0f060643d",
  measurementId: "G-6DQWVJG5CY"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
