const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

// Load environment variables from local .env
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

console.log('Raw envContent:', JSON.stringify(envContent));

console.log('Parsed env path:', envPath);
console.log('Parsed env keys:', Object.keys(env));
console.log('Parsed env values:', env);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

console.log('Using Firebase config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const settingsRef = doc(db, 'settings', 'studio');
  const snap = await getDoc(settingsRef);
  
  if (!snap.exists()) {
    console.error('Documento settings/studio não encontrado!');
    process.exit(1);
  }

  const current = snap.data();
  console.log('Estado atual dos automations:', JSON.stringify(current.automations || {}, null, 2));

  console.log('Desativando automations.launchCampaignEnabled...');
  await updateDoc(settingsRef, {
    'automations.launchCampaignEnabled': false
  });

  // Verificar
  const verify = await getDoc(settingsRef);
  const updated = verify.data();
  console.log('\n✅ Atualizado com sucesso! Estado agora:', JSON.stringify(updated.automations || {}, null, 2));
  
  process.exit(0);
}

run().catch(err => {
  console.error('Erro ao desativar campanha de lançamento:', err);
  process.exit(1);
});
