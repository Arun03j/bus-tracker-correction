// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBRuzFbuZgYJJ_Blr5oQM3I3ygndZeP-1E",
  authDomain: "projectgps-a0284.firebaseapp.com",
  databaseURL: "https://projectgps-a0284-default-rtdb.firebaseio.com",
  projectId: "projectgps-a0284",
  storageBucket: "projectgps-a0284.firebasestorage.app",
  messagingSenderId: "172812680724",
  appId: "1:172812680724:web:7ac02ad278a5ca5028f101",
  measurementId: "G-BPYMSN60LY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;

