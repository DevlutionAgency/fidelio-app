import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

/**
 * Firebase Configuration for Fidelio App
 * Connected to Firebase project: fidelioapp-8fd68
 */
export const firebaseConfig = {
  apiKey:
    (import.meta as any).env?.VITE_FIREBASE_API_KEY ||
    'AIzaSyCKsItksnXDSpMPg5PAGIzO9rdbZvy0Sew',
  authDomain:
    (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN ||
    'fidelioapp-8fd68.firebaseapp.com',
  projectId:
    (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID ||
    'fidelioapp-8fd68',
  storageBucket:
    (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET ||
    'fidelioapp-8fd68.firebasestorage.app',
  messagingSenderId:
    (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    '821627719798',
  appId:
    (import.meta as any).env?.VITE_FIREBASE_APP_ID ||
    '1:821627719798:web:e948da9aba7f2080a60f57',
  measurementId:
    (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID ||
    'G-EJ8PX45E3D',
};

export const isFirebaseConfigured = true;

// Initialize Firebase App singleton
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;
let googleProvider: GoogleAuthProvider;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  // Initialize Analytics in browser runtime
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});
  }
} catch (err) {
  console.warn('[Firebase] Initialization error:', err);
}

export { app, auth, db, analytics };

export interface GoogleAuthResult {
  ok: boolean;
  user?: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  };
  error?: string;
}

/**
 * Connect with Google using Firebase Authentication Popup
 */
export async function signInWithGooglePopup(): Promise<GoogleAuthResult> {
  if (!auth || !googleProvider) {
    return {
      ok: false,
      error: 'Le service Firebase Authentication n’a pas pu être initialisé.',
    };
  }

  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!user.email) {
      return { ok: false, error: 'Impossible de récupérer l’adresse email de votre compte Google.' };
    }

    return {
      ok: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || undefined,
      },
    };
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user') {
      return { ok: false, error: 'Connexion Google annulée.' };
    }
    if (err.code === 'auth/cancelled-popup-request') {
      return { ok: false, error: 'Une autre fenêtre de connexion Google est déjà ouverte.' };
    }
    if (err.code === 'auth/unauthorized-domain') {
      return {
        ok: false,
        error: `Domaine non autorisé sur Firebase. Ajoutez ce domaine dans la console Firebase (Authentication > Settings > Authorized domains).`,
      };
    }
    return {
      ok: false,
      error: err?.message || 'Erreur lors de la connexion avec Google.',
    };
  }
}

/**
 * Sync Merchant to Cloud Firestore
 */
export async function syncMerchantToFirestore(merchant: any): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'merchants', merchant.id), merchant, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync merchant notice:', err);
  }
}

/**
 * Sync Customer to Cloud Firestore
 */
export async function syncCustomerToFirestore(customer: any): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'customers', customer.id), customer, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync customer notice:', err);
  }
}

/**
 * Sync Transaction to Cloud Firestore
 */
export async function syncTransactionToFirestore(transaction: any): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'transactions', transaction.id), transaction, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync transaction notice:', err);
  }
}

/**
 * Sync Lead to Cloud Firestore
 */
export async function syncLeadToFirestore(lead: any): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'leads', lead.id), lead, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync lead notice:', err);
  }
}

/**
 * Log out from Firebase Auth
 */
export async function logOutFromFirebase(): Promise<void> {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore
    }
  }
}
