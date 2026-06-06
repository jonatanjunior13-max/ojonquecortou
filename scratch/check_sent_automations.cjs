const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const idx = cleanLine.indexOf('=');
    if (idx !== -1) {
      const key = cleanLine.substring(0, idx).trim();
      let val = cleanLine.substring(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[key] = val;
    }
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
  console.log('Fetching last 20 automation logs...');
  const logsRef = collection(db, 'automation_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(20));
  const snap = await getDocs(q);

  if (snap.empty) {
    console.log('Nenhum log de automação encontrado.');
  } else {
    snap.forEach(doc => {
      const d = doc.data();
      console.log(`[${d.timestamp}] Target: ${d.clientName} (${d.email}) - Stage/Type: ${d.stage || d.type}`);
    });
  }
  process.exit(0);
}

run().catch(console.error);
