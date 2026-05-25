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
  
  const automations = data.custom_automations || {};
  for (const [key, html] of Object.entries(automations)) {
    console.log(`\n=== Checking key: ${key} (length: ${html.length}) ===`);
    
    // Check for Marina
    const marinaRegex = /Marina/gi;
    let match;
    let count = 0;
    while ((match = marinaRegex.exec(html)) !== null) {
      count++;
      console.log(`Found "Marina" at index ${match.index}: "${html.substring(match.index - 30, match.index + 30).replace(/\r?\n/g, ' ')}"`);
    }
    console.log(`Total "Marina" in ${key}: ${count}`);
    
    // Check for broken tags like ata} or ervico}
    const brokenTags = ['ata}', 'ervico}', 'orario}'];
    brokenTags.forEach(tag => {
      const regex = new RegExp(`.{0,40}${tag}.{0,40}`, 'gi');
      let m;
      while ((m = regex.exec(html)) !== null) {
        // If it starts with '{d', it's not broken. Let's see if the '{d' or '{s' is missing.
        const snippet = m[0].replace(/\r?\n/g, ' ');
        console.log(`Found potential broken tag match for "${tag}": "${snippet}"`);
      }
    });
  }
}

run().then(() => process.exit(0));
