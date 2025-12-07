/* 
  This file connects your React app to Firebase.
  Firebase gives us:
  - Authentication (login, signup, email verification)
  - Firestore Database (store profiles, matches, chats)
  - Storage (upload profile photos)
*/

// These imports load only the Firebase services we need.
// This keeps your app fast and small.
import { initializeApp } from "firebase/app"; // Connects to Firebase project
import { getAuth } from "firebase/auth"; // User login + signup
import { getFirestore } from "firebase/firestore"; // Database
import { getStorage } from "firebase/storage"; // Photo upload

/* 
  This object contains ALL the unique settings for your Firebase project.
  You will get this from Firebase Console → Project Settings → Web App.
*/
const firebaseConfig = {
  apiKey: "AIzaSyCccXm6aQ6UXKDkUFVpSfETBCVdlg689Po",
  authDomain: "student-roommate-app-693bf.firebaseapp.com",
  projectId: "student-roommate-app-693bf",
  storageBucket: "student-roommate-app-693bf.appspot.com",   // ✅ FIXED
  messagingSenderId: "703123849444",
  appId: "1:703123849444:web:71c675b407fb9c81bbacf1"
};

/*
  Initialize the Firebase app.
  Think of this as "turning on" Firebase for your React project.
*/
const app = initializeApp(firebaseConfig);

/*
  Create the main Firebase tools we will use everywhere in the project.
*/

// Authentication tool → handles signup, login, email verification
export const auth = getAuth(app);

// Firestore database tool → store profiles, matches, chats
export const db = getFirestore(app);

// Storage tool → upload profile photos, house photos
export const storage = getStorage(app);

/*
  We export "app" itself in case we need deeper Firebase features later.
*/
export default app;
