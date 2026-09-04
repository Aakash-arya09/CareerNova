// ─── src/firebase.js ─────────────────────────────────────────────────────────
// Firebase Authentication for CareerNova — real Google + Email/Password login.
// All auth is handled by Firebase, so the old OTP server (server.js) is not needed.

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

// ─── FIREBASE CONFIG (from Firebase Console → Project Settings) ──────────────
const firebaseConfig = {
  apiKey: "AIzaSyCke2zBvZJbtdCFI7QYTQk3clOhDBuYaQs",
  authDomain: "careernova-3cacc.firebaseapp.com",
  projectId: "careernova-3cacc",
  storageBucket: "careernova-3cacc.firebasestorage.app",
  messagingSenderId: "960586972151",
  appId: "1:960586972151:web:7947cbb8cfb9c805cb0cf2",
  measurementId: "G-DN0RZ0BWJN",
};

// ─── INIT ─────────────────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Request these extra Google scopes
provider.addScope("profile");
provider.addScope("email");

// Force the Google account picker every time (so users can switch accounts)
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

/** Listen to auth state changes (call in App on mount to persist sessions) */
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
