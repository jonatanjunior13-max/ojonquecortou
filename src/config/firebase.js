import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configurações do Firebase com suporte a variáveis de ambiente (.env)
// e fallbacks seguros para evitar quebras em ambientes locais sem credenciais.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ojonquecortou.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ojonquecortou",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ojonquecortou.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder-app-id"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços de Autenticação e Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
