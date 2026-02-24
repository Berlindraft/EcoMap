// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_BLOkz2pA4GXq-UP5JnQ64S2OcYPXQRA",
  authDomain: "ecomap-edced.firebaseapp.com",
  projectId: "ecomap-edced",
  storageBucket: "ecomap-edced.firebasestorage.app",
  messagingSenderId: "803920452",
  appId: "1:803920452:web:e77b316a727ce62fbaba11",
  measurementId: "G-2CD66B08ZK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);