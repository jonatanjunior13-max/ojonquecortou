import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

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

    // Persistência via IndexedDB — essencial para PWA
    setPersistence(auth, indexedDBLocalPersistence).catch(() => {
      setPersistence(auth, browserLocalPersistence).catch(() => {});
    });

    // Configuração mínima do Firestore — sem opções experimentais
    db = getFirestore(app);
    console.log('Firebase inicializado.');
  } catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
  }
} else {
  console.log('Firebase em Modo Demo.');
}

/**
 * Busca uma coleção inteira via Firestore REST API.
 * Usa fetch HTTP puro — não usa WebChannel/gRPC/streaming.
 * Funciona corretamente em ambientes com Service Worker (PWA).
 *
 * @param {string} collectionPath - ex: 'bookings', 'client_profiles'
 * @param {string} idToken - Firebase Auth ID token
 * @returns {Promise<Array>} - array de documentos { id, ...data }
 */
export const fetchCollectionRest = async (collectionPath, idToken) => {
  const projectId = firebaseConfig.projectId;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?pageSize=500`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore REST ${collectionPath}: ${res.status} ${errText}`);
  }

  const json = await res.json();
  if (!json.documents) return [];

  return json.documents.map(docObj => {
    const id = docObj.name.split('/').pop();
    const data = parseFirestoreFields(docObj.fields || {});
    return { id, ...data };
  });
};

/**
 * Busca um único documento via Firestore REST API.
 */
export const fetchDocRest = async (collectionPath, docId, idToken) => {
  const projectId = firebaseConfig.projectId;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}/${docId}`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.fields ? parseFirestoreFields(json.fields) : null;
};

/**
 * Converte o formato de campos do Firestore REST para objetos JS planos.
 */
const parseFirestoreFields = (fields) => {
  const obj = {};
  for (const [key, value] of Object.entries(fields)) {
    obj[key] = parseFirestoreValue(value);
  }
  return obj;
};

const parseFirestoreValue = (value) => {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  return null;
};

// Helper de timeout para operações Firebase
const withTimeout = (promise, ms = 4500) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout Firebase.')), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export { auth, db, withTimeout };
export default app;
