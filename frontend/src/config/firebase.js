import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

/**
 * FIREBASE CONFIGURATION
 */
const firebaseConfig = {
  apiKey: "sample-api-key",
  authDomain: "sample-project.firebaseapp.com",
  projectId: "sample-project",
  storageBucket: "sample-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'nexus-portal-v1-stable';

export { app, auth, db, appId, doc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, signInAnonymously, signInWithCustomToken, onAuthStateChanged };