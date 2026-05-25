const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

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
  const docRef = doc(db, 'settings', 'studio');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.professionals && data.professionals.length > 0) {
      data.professionals = data.professionals.map(p => {
        if (p.id === 'jon') {
          return { ...p, avatar: '/jon-perfil.png' };
        }
        return p;
      });
      await setDoc(docRef, data);
      console.log('Successfully updated Jon\'s avatar in Firestore settings/studio.');
    } else {
      console.log('No professionals found in settings/studio');
    }
  } else {
    console.log('No settings/studio doc exists');
  }
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
