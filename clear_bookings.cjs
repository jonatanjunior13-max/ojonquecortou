const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log('--- Iniciando limpeza do Firestore ---');
  
  // 1. Limpar bookings
  const bookingsRef = collection(db, 'bookings');
  const bookingsSnap = await getDocs(bookingsRef);
  let bookingsDeleted = 0;
  
  for (const docSnap of bookingsSnap.docs) {
    await deleteDoc(doc(db, 'bookings', docSnap.id));
    bookingsDeleted++;
  }
  console.log(`Deletados ${bookingsDeleted} agendamentos da coleção 'bookings'.`);

  // 2. Limpar automation_logs
  const logsRef = collection(db, 'automation_logs');
  const logsSnap = await getDocs(logsRef);
  let logsDeleted = 0;
  
  for (const docSnap of logsSnap.docs) {
    await deleteDoc(doc(db, 'automation_logs', docSnap.id));
    logsDeleted++;
  }
  console.log(`Deletados ${logsDeleted} registros da coleção 'automation_logs'.`);

  // 3. Limpar financial_transactions
  const financialRef = collection(db, 'financial_transactions');
  const financialSnap = await getDocs(financialRef);
  let financialDeleted = 0;
  
  for (const docSnap of financialSnap.docs) {
    await deleteDoc(doc(db, 'financial_transactions', docSnap.id));
    financialDeleted++;
  }
  console.log(`Deletados ${financialDeleted} transações da coleção 'financial_transactions'.`);

  // 4. Limpar admin_notifications
  const notificationsRef = collection(db, 'admin_notifications');
  const notificationsSnap = await getDocs(notificationsRef);
  let notificationsDeleted = 0;
  
  for (const docSnap of notificationsSnap.docs) {
    await deleteDoc(doc(db, 'admin_notifications', docSnap.id));
    notificationsDeleted++;
  }
  console.log(`Deletados ${notificationsDeleted} notificações da coleção 'admin_notifications'.`);

  console.log('--- Limpeza concluída com sucesso! ---');
  process.exit(0);
}

run().catch(err => {
  console.error('Erro na limpeza:', err);
  process.exit(1);
});
