const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Load environment variables manually from .env file
const envPath = path.join(__dirname, '../.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.trim().split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      envConfig[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const docRef = doc(db, 'settings', 'studio');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    console.log("No settings document found");
    return;
  }
  const data = snap.data();
  
  const emailTemplates = data.email_templates || {};
  console.log("=== EMAIL TEMPLATES IN FIRESTORE ===");
  for (const [key, val] of Object.entries(emailTemplates)) {
    console.log(`\nKey: ${key}`);
    console.log(`Subject: ${val.subject}`);
    // Check if body has Marina
    const body = val.body || '';
    const marinaRegex = /Marina/gi;
    let match;
    let count = 0;
    while ((match = marinaRegex.exec(body)) !== null) {
      count++;
      console.log(`  Found "Marina" at index ${match.index}: "${body.substring(match.index - 30, match.index + 30).replace(/\r?\n/g, ' ')}"`);
    }
    console.log(`  Total Marina: ${count}`);
    console.log(`  Body length: ${body.length}`);
  }
}

run().then(() => process.exit(0));
