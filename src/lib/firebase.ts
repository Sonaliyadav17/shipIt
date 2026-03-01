import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config (provided by user)
const firebaseConfig = {
  apiKey: "AIzaSyCYKZc_yzVG1f1sIChCYGAsWUl4XzwyspY",
  authDomain: "shipit-1fb1c.firebaseapp.com",
  projectId: "shipit-1fb1c",
  storageBucket: "shipit-1fb1c.firebasestorage.app",
  messagingSenderId: "487994599568",
  appId: "1:487994599568:web:5a8b2836ad7a768ff51015",
  measurementId: "G-WKPYP6K4YL",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
