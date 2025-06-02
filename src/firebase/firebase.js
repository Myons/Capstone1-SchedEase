// src/firebase/firebase.js

// Import everything we need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth,
  setPersistence,
  browserLocalPersistence, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword
} from "firebase/auth";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);      // Firestore database
export const auth = getAuth(app);         // Authentication

// Create admin account function
export const createAdminAccount = async (email, password, name) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create admin document in Firestore
    const adminData = {
      name: name,
      email: email,
      role: "admin",
      status: "Full-time",
      createdAt: new Date(),
      uid: userCredential.user.uid,
      facultyId: `ADM-${String(Date.now()).slice(-4)}`,
      isTeacher: false
    };

    // Add to faculty collection using the auth UID as the document ID
    await setDoc(doc(db, "faculty", userCredential.user.uid), adminData);
    
    return {
      success: true,
      message: "Admin account created successfully"
    };
  } catch (error) {
    console.error("Error creating admin account:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Get the current user's ID token
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
};

// API base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Create an API client that includes the Firebase ID token
export const apiClient = {
  get: async (endpoint) => {
    const token = await getIdToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
  
  post: async (endpoint, data) => {
    const token = await getIdToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  put: async (endpoint, data) => {
    const token = await getIdToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  delete: async (endpoint) => {
    const token = await getIdToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

// Export auth methods for use in components
export { 
  setPersistence, 
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword 
};