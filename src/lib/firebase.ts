import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if provided in config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection check on boot
if (typeof window !== 'undefined') {
  (async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firestore offline status:', error.message);
      }
    }
  })();
}
