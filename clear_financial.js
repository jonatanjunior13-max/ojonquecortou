import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearFinancialTransactions() {
  const collectionName = "financial_transactions";
  console.log(`Buscando transações em '${collectionName}'...`);
  const querySnapshot = await getDocs(collection(db, collectionName));
  const docs = querySnapshot.docs;
  
  if (docs.length === 0) {
    console.log(`A coleção '${collectionName}' já está vazia.`);
    return;
  }

  console.log(`Deletando ${docs.length} transações de '${collectionName}'...`);
  for (const document of docs) {
    await deleteDoc(doc(db, collectionName, document.id));
  }
  console.log(`Coleção '${collectionName}' zerada com sucesso!`);
}

async function run() {
  try {
    await clearFinancialTransactions();
    console.log("Limpeza concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
    process.exit(1);
  }
}

run();
