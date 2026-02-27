// Firebase configuration for React Native / Expo
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyB_BLOkz2pA4GXq-UP5JnQ64S2OcYPXQRA",
  authDomain: "ecomap-edced.firebaseapp.com",
  projectId: "ecomap-edced",
  storageBucket: "ecomap-edced.firebasestorage.app",
  messagingSenderId: "803920452",
  appId: "1:803920452:web:e77b316a727ce62fbaba11",
  measurementId: "G-2CD66B08ZK",
};

// Prevent re-initialization in hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use initializeAuth with AsyncStorage on first init, getAuth on re-init
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized (hot-reload), just get the existing instance
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };