const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');

const envPath = path.join(__dirname, '../.env');
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
  console.log('Querying all bookings to filter in memory...');
  const q = query(
    collection(db, 'bookings')
  );
  const snap = await getDocs(q);
  console.log(`Fetched ${snap.size} total bookings.`);
  
  const completed = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (['Concluído', 'finalizado'].includes(data.status)) {
      completed.push({ id: doc.id, ...data });
    }
  });
  
  completed.sort((a, b) => b.date.localeCompare(a.date));
  
  console.log(`\nFound ${completed.length} completed/finalized bookings (showing top 30):`);
  completed.slice(0, 30).forEach(b => {
    console.log(`- Date: ${b.date} | Client: ${b.clientName} | Service: ${b.serviceName} | Status: ${b.status}`);
  });
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
