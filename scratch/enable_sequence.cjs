const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/ojonquecortou/.env.production';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    const key = match[1];
    let val = (match[2] || '').trim().replace(/\r$/, '');
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
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
  const settingsRef = doc(db, 'settings', 'studio');

  // Reativa a régua de relacionamento
  await updateDoc(settingsRef, {
    'automations.sequenceEnabled': true
  });

  // Verifica
  const snap = await getDoc(settingsRef);
  const updated = snap.data();
  const aut = updated.automations || {};
  
  console.log('✅ Régua reativada!');
  console.log(`   sequenceEnabled:       ${aut.sequenceEnabled}`);
  console.log(`   launchCampaignEnabled: ${aut.launchCampaignEnabled}`);
  console.log(`   birthdayEnabled:       ${aut.birthdayEnabled}`);
  
  process.exit(0);
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
