// 🔥 Firebase Setup (FULLY FUNCTIONAL)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ PASTE YOUR REAL KEYS HERE
const firebaseConfig = {
  apiKey: "AIzaSyCwH5erg-bVoY6ouiZRkGHyiDT7D8R0tns",
  authDomain: "editbridge-manual.firebaseapp.com",
  projectId: "editbridge-manual",
  storageBucket: "editbridge-manual.firebasestorage.app",
  messagingSenderId: "278299438243",
  appId: "1:278299438243:web:c18fd39a654f8450f12316",
  measurementId: "G-Y456QQF6Z1"
};

// ✅ Prevent multiple app initialization (important in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🔐 Auth
export const auth = getAuth(app);

// 🗄 Firestore
export const db = getFirestore(app);

// 📦 Storage (for profile + portfolio images)
export const storage = getStorage(app);

// ⚡ Optional: Enable offline support (safe try-catch)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(() => {
    console.log("Offline persistence not enabled");
  });
}