// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBRfRcvS_9miuYuOHbBYjXY_i8oG_lQNHg",
  authDomain: "foster-c21f8.firebaseapp.com",
  projectId: "foster-c21f8",
  storageBucket: "foster-c21f8.firebasestorage.app",
  messagingSenderId: "744958868468",
  appId: "1:744958868468:web:649ce075433b10eaabd7a1",
  measurementId: "G-6JR72KDP99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
