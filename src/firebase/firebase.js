// src/firebase/firebase.js

// Import only what we need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKIYdXE-EP4dtLPlyTvmi80zgn7CwjX5A",
  authDomain: "schoolscheduler-fa641.firebaseapp.com",
  projectId: "schoolscheduler-fa641",
  storageBucket: "schoolscheduler-fa641.appspot.com",
  messagingSenderId: "596469399057",
  appId: "1:596469399057:web:a2100d14d619af5a187bb0",
  measurementId: "G-99HXXPMT05"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);     // Firestore database
export const auth = getAuth(app);         // Authentication
