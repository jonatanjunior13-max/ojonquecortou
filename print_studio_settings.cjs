const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/.env';
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
  const docSnap = await getDoc(doc(db, 'settings', 'studio'));
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('Studio settings keys and values (except HTML templates to keep it small):');
    const cleanData = { ...data };
    delete cleanData.custom_automations;
    delete cleanData.email_templates;
    console.log(JSON.stringify(cleanData, null, 2));
  } else {
    console.log('No settings/studio doc');
  }
  process.exit(0);
}

run().catch(console.error);
