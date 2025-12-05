import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, type Firestore } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function initializeFirebase() {
  if (!app && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
  return { app, db, auth };
}

export function getFirebaseAuth(): Auth | null {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

export async function signInWithEmail(email: string, password: string) {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase not initialized');
  }
  return signInWithEmailAndPassword(authInstance, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase not initialized');
  }
  return createUserWithEmailAndPassword(authInstance, email, password);
}

export async function signInWithGoogle() {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase not initialized');
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
}

export async function signOut() {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase not initialized');
  }
  return firebaseSignOut(authInstance);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    return () => {};
  }
  return onAuthStateChanged(authInstance, callback);
}

export async function saveToFirestore(collectionName: string, data: any) {
  if (!db) {
    initializeFirebase();
  }
  if (!db) {
    throw new Error('Firebase not initialized');
  }
  
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    timestamp: new Date().toISOString(),
  });
  
  return docRef.id;
}

export async function getFromFirestore(collectionName: string, maxItems = 10) {
  if (!db) {
    initializeFirebase();
  }
  if (!db) {
    throw new Error('Firebase not initialized');
  }
  
  const q = query(
    collection(db, collectionName),
    orderBy('timestamp', 'desc'),
    limit(maxItems)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function isFirebaseInitialized() {
  return !!app && !!db;
}

export function isFirebaseConfigured() {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.appId;
}
