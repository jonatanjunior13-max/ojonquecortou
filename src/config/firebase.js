import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// Configurações do Firebase com suporte a variáveis de ambiente (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verifica se as chaves são válidas e não são placeholders
const isConfigValid = firebaseConfig.apiKey && 
                      firebaseConfig.apiKey !== 'placeholder-api-key' && 
                      !firebaseConfig.apiKey.includes('your_');

let app = null;
let auth = null;
let db = null;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true
      });
    } catch (e) {
      db = getFirestore(app);
    }
    console.log("Firebase inicializado com sucesso.");
  } catch (err) {
    console.error("Erro ao inicializar Firebase:", err);
  }
} else {
  console.log("Firebase rodando em Modo Demonstração (chaves ausentes ou inválidas)");
}

// Helper para abortar operações do Firestore que travam por falta de rede ou regras bloqueadas
const withTimeout = (promise, ms = 4500) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout de conexão com o banco de dados."));
    }, ms);
    
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

export { auth, db, withTimeout };
export default app;
