// ─── Firebase App Initialization ─────────────────────────────────────────────
// HOW TO SET UP:
// 1. Go to https://console.firebase.google.com
// 2. Create/select a project → Add a web app
// 3. copy the firebaseConfig values into .env.local:
//    NEXT_PUBLIC_FIREBASE_API_KEY=...
//    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
//    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
//    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
//    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
//    NEXT_PUBLIC_FIREBASE_APP_ID=...
// 4. In Firebase Console → Authentication → Sign-in methods:
//    Enable: Email/Password ✅  &  Google ✅

import { initializeApp, getApps } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    GithubAuthProvider,
    OAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent duplicate initialization in Next.js dev hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const githubProvider = new GithubAuthProvider();

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export {
    auth,
    googleProvider,
    githubProvider,
    appleProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    firebaseSignOut,
    updateProfile,
    onAuthStateChanged,
};
