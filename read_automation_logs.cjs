const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

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
  console.log("Reading latest automation logs...");
  const q = query(
    collection(db, 'automation_logs'),
    orderBy('timestamp', 'desc'),
    limit(30)
  );
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} logs:`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`- [${data.timestamp}] Date: ${data.date} | Client: ${data.clientName} | Email: ${data.email} | Stage: ${data.stage}`);
  });
  
  console.log("\nReading latest admin notifications...");
  const q2 = query(
    collection(db, 'admin_notifications'),
    orderBy('timestamp', 'desc'),
    limit(5)
  );
  const snap2 = await getDocs(q2);
  console.log(`Found ${snap2.size} admin notifications:`);
  snap2.forEach(doc => {
    const data = doc.data();
    console.log(`- [${data.timestamp}] Date: ${data.date} | Client: ${data.clientName} | Type: ${data.type} | Subject: ${data.subject}`);
  });
  
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
