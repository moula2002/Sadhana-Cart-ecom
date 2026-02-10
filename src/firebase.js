// src/firebase.js
import { initializeApp } from "firebase/app";

/* ================= FIRESTORE ================= */
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

/* ================= STORAGE ================= */
import { getStorage } from "firebase/storage";

/* ================= AUTH ================= */
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  RecaptchaVerifier,
} from "firebase/auth";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDpjMz_gzDUtdLtBryB1hDBccT7vgqRYaE",
  authDomain: "sadhana-cart.firebaseapp.com",
  projectId: "sadhana-cart",
  storageBucket: "sadhana-cart.firebasestorage.app",
  messagingSenderId: "126398142924",
  appId: "1:126398142924:web:9ff3415ca18ad24b85a569",
  measurementId: "G-GQ40SLFB85",
};

/* ================= INIT APP ================= */
const app = initializeApp(firebaseConfig);

/* ================= SERVICES ================= */
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

/* ================= AUTH SETTINGS ================= */
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence enabled");
  })
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

/* ================= PROVIDERS ================= */
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/* ================= RECAPTCHA HELPER ================= */
const initializeRecaptcha = () => {
  // Clear any existing recaptcha
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = null;
  }

  // Create new recaptcha verifier
  window.recaptchaVerifier = new RecaptchaVerifier(
    auth,
    'recaptcha-container',
    {
      size: 'invisible',
      callback: (response) => {
        console.log("reCAPTCHA verified:", response);
      },
      'expired-callback': () => {
        console.log("reCAPTCHA expired");
      },
      'error-callback': (error) => {
        console.error("reCAPTCHA error:", error);
      }
    }
  );

  return window.recaptchaVerifier;
};

/* ================= EXPORTS ================= */
export {
  app,
  db,
  storage,
  auth,
  googleProvider,
  initializeRecaptcha,
  RecaptchaVerifier,
  
  // Firestore helpers
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp,
};