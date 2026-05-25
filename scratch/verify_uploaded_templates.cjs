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
  appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
  const docRef = doc(db, 'settings', 'studio');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    console.error("No studio settings document found.");
    process.exit(1);
  }

  const data = snap.data();
  const automations = data.custom_automations || {};
  console.log("=== Firestore Verification ===");
  
  const keys = ['solicitacao_recebida', 'horario_confirmado', 'lembrete_24h', 'reativacao_5_meses'];
  
  keys.forEach(key => {
    const html = automations[key];
    if (!html) {
      console.log(`❌ Key "${key}" not found in custom_automations!`);
      return;
    }
    
    console.log(`\n--- Verification for: ${key} (size: ${html.length} bytes) ---`);
    
    // Check for hardcoded Marina
    const marinaCount = (html.match(/Marina/gi) || []).length;
    console.log(`  "Marina" count: ${marinaCount} ${marinaCount === 0 ? '✅' : '❌'}`);

    // Check for Janeiro
    const janeiroCount = (html.match(/Janeiro/gi) || []).length;
    console.log(`  "Janeiro" count: ${janeiroCount} ${janeiroCount === 0 ? '✅' : '❌'}`);

    // Check for placeholder address
    const badAddressCount = (html.match(/Rua dos Cacheados/gi) || []).length;
    console.log(`  "Rua dos Cacheados" count: ${badAddressCount} ${badAddressCount === 0 ? '✅' : '❌'}`);

    // Check for real address
    const goodAddressCount = (html.match(/Rua Francisco Ovídio, 184/gi) || []).length;
    console.log(`  "Rua Francisco Ovídio, 184" count: ${goodAddressCount} ${goodAddressCount > 0 ? '✅' : '❌'}`);

    // Check for mockup chrome header class
    const chromeHeaderCount = (html.match(/mail-client-chrome/gi) || []).length;
    console.log(`  "mail-client-chrome" count: ${chromeHeaderCount} ${chromeHeaderCount === 0 ? '✅' : '❌'}`);

    // Check for placeholder tags
    const nomeCount = (html.match(/{nome}/gi) || []).length;
    const dataCount = (html.match(/{data}/gi) || []).length;
    const horarioCount = (html.match(/{horario}/gi) || []).length;
    const servicoCount = (html.match(/{servico}/gi) || []).length;
    
    console.log(`  "{nome}" count: ${nomeCount} ${nomeCount > 0 || key === 'lembrete_24h' ? '✅' : '❌'}`);
    console.log(`  "{data}" count: ${dataCount} ${dataCount > 0 || key === 'reativacao_5_meses' || key === 'lembrete_24h' ? '✅' : '❌'}`);
    console.log(`  "{horario}" count: ${horarioCount} ${horarioCount > 0 || key === 'reativacao_5_meses' ? '✅' : '❌'}`);
    console.log(`  "{servico}" count: ${servicoCount} ${servicoCount > 0 || key === 'reativacao_5_meses' ? '✅' : '❌'}`);
  });
}

verify().then(() => {
  process.exit(0);
}).catch(console.error);
