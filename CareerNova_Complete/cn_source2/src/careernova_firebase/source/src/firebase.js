// ─── src/firebase.js ─────────────────────────────────────────────────────────
// Firebase configuration for CareerNova
// ⚠️  Replace every value below with YOUR project's values from Firebase Console
//     (See the step-by-step guide in SETUP_GUIDE.md)

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCke2zBvZJbtdCFI7QYTQk3clOhDBuYaQs",
  authDomain: "careernova-3cacc.firebaseapp.com",
  projectId: "careernova-3cacc",
  storageBucket: "careernova-3cacc.firebasestorage.app",
  messagingSenderId: "960586972151",
  appId: "1:960586972151:web:7947cbb8cfb9c805cb0cf2",
  measurementId: "G-DN0RZ0BWJN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Request these extra Google scopes (optional — removes them if not needed)
provider.addScope("profile");
provider.addScope("email");

// Force account picker every time (so user can switch accounts)
provider.setCustomParameters({ prompt: "select_account" });

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────

/** Sign in with Google popup → returns { uid, name, email, photo } */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  const u = result.user;
  return { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL };
};

/** Sign up with email + password, then set displayName */
export const signUpWithEmail = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return { uid: cred.user.uid, name, email };
};

/** Sign in with email + password */
export const signInWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const u = cred.user;
  return { uid: u.uid, name: u.displayName, email: u.email };
};

/** Send Firebase password-reset email */
export const resetPasswordEmail = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/** Sign out */
export const logOut = async () => {
  await signOut(auth);
};

/** Listen to auth state changes (call in App on mount) */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (u) => {
    if (u) {
      callback({
        uid: u.uid,
        name: u.displayName || u.email,
        email: u.email,
        photo: u.photoURL,
      });
    } else {
      callback(null);
    }
  });
};

export { auth };
