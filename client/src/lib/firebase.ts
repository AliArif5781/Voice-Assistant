import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function initializeFirebase(config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}) {
  if (!app) {
    app = initializeApp(config);
    db = getFirestore(app);
  }
  return { app, db };
}

export async function saveToFirestore(collectionName: string, data: any) {
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
