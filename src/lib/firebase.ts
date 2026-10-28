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
  collection,
  getDocs,
  type Firestore,
} from 'firebase/firestore';

/**
 * Firebase Configuration (loaded from Vite environment variables)
 * In production or local development, set these in your .env:
 * VITE_FIREBASE_API_KEY=...
 * VITE_FIREBASE_AUTH_DOMAIN=...
 * VITE_FIREBASE_PROJECT_ID=...
 * VITE_FIREBASE_STORAGE_BUCKET=...
 * VITE_FIREBASE_MESSAGING_SENDER_ID=...
 * VITE_FIREBASE_APP_ID=...
 */
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey.length > 5 &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('votre_api_key')
);

// Initialize Firebase App singleton
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('[Firebase] Init warning:', err);
  }
}

export { app, auth, db };

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
  // If Firebase keys are not yet configured in .env, guide the user or provide quick dev simulation
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    // Provide an informative message or fallback
    return {
      ok: false,
      error:
        'Firebase n’est pas encore configuré. Ajoutez vos clés Firebase (VITE_FIREBASE_API_KEY, etc.) dans votre fichier .env pour activer la vraie authentification Google.',
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
      return { ok: false, error: 'Connexion Google annulée par l’utilisateur.' };
    }
    if (err.code === 'auth/cancelled-popup-request') {
      return { ok: false, error: 'Une autre fenêtre de connexion Google est déjà ouverte.' };
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
  if (!db || !isFirebaseConfigured) return;
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
  if (!db || !isFirebaseConfigured) return;
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
  if (!db || !isFirebaseConfigured) return;
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
  if (!db || !isFirebaseConfigured) return;
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
  if (auth && isFirebaseConfigured) {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore
    }
  }
}
