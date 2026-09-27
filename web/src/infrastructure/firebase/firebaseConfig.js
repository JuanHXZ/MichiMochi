import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyB0kcVRaDmt-rKIam5nmoj1AxPzEpd9NFU",
  authDomain: "michimochiapp.firebaseapp.com",
  projectId: "michimochiapp",
  storageBucket: "michimochiapp.firebasestorage.app",
  messagingSenderId: "1044600548905",
  appId: "1:1044600548905:web:5ed7ed104b1163fd70b638",
  measurementId: "G-NL7KVJRZT6"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
