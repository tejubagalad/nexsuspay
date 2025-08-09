import { initializeApp } from "firebase/app";
// App Check and ReCaptcha imports are removed
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import {
  updateDoc,
  deleteDoc,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs
} from "firebase/firestore";

// --- MODIFICATIONS START ---

// 1. Get the config from environment variables.
//    import.meta.env is for Vite. Use process.env for Create React App/Next.js.
const firebaseConfigString = import.meta.env.VITE_FIREBASE_CONFIG;

// 2. Validate that the environment variable exists.
if (!firebaseConfigString) {
  throw new Error("Firebase config not found in environment variables.");
}

// 3. Parse the Firebase config string back into a JSON object.
const firebaseConfig = JSON.parse(firebaseConfigString);

// --- MODIFICATIONS END ---


const app = initializeApp(firebaseConfig);

// App Check initialization is removed

const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  updateDoc,
  deleteDoc,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  RecaptchaVerifier,
  signInWithPhoneNumber
};