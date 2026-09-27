import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// ⚠️ استبدل القيم دي بالـ firebaseConfig بتاعك من Firebase Console
// (Project settings → Your apps → SDK setup and configuration)
const firebaseConfig = {
  apiKey: 'AIzaSyBywClMCJVsbojdPaU8zyqkslaukUYjiho',
  authDomain: 'rosa-bella-shop.firebaseapp.com',
  projectId: 'rosa-bella-shop',
  storageBucket: 'rosa-bella-shop.firebasestorage.app',
  messagingSenderId: '92329528252',
  appId: '1:92329528252:web:fc73c1974c752ed55c79b9',
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'PASTE_YOUR_API_KEY_HERE';

let db = null;
if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  // long-polling auto-detect avoids issues behind some networks/proxies
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
}

export { db };
