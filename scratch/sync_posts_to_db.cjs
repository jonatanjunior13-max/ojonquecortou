const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load env variables
const envPath = path.join(__dirname, '../.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.trim().split('=');
    if (parts.length >= 2) {
      envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
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

// Read static posts from posts.js
// Since it is ES module, let's write a parser or read it as text and evaluate, or convert it to JSON
// Or we can just import the posts.js content by executing a small script that loads it.
// To do this simply, let's create a temporary JS file in ES module format to dump the posts array to JSON first.
