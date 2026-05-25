import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const docRef = doc(db, 'settings', 'studio');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Studio Settings in Firestore:", JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("No settings document found in Firestore.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error fetching settings:", error);
    process.exit(1);
  }
}

run();
