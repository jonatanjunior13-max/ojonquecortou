import dotenv from 'dotenv';
dotenv.config();
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBkmKUQs0Nf_oer1Mvwtg_QumzXANX7m0Y',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'ojonque.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'ojonque',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'ojonque.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '108299544531',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:108299544531:web:b0fa221ca26901aae77126'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

async function check() {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD não configurada no .env');
  }
  await signInWithEmailAndPassword(auth, process.env.ADMIN_NOTIFICATION_EMAIL || 'contato@ojonquecortou.com.br', process.env.ADMIN_PASSWORD);
  const snap = await getDocs(collection(db, 'automation_logs'));
  let count = 0;
  snap.forEach(d => {
    if (d.data().stage === 'novo_endereco_setembro') count++;
  });
  console.log(`E-mails já registrados como enviados anteriormente: ${count}`);
}
check();
