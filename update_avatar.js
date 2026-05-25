import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

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
      const data = docSnap.data();
      const professionals = data.professionals || [];
      const updatedProfessionals = professionals.map(p => {
        if (p.id === 'jon') {
          return { ...p, avatar: '/jon-perfil.jpg' };
        }
        return p;
      });
      await updateDoc(docRef, { professionals: updatedProfessionals });
      console.log("Successfully updated Jon's avatar to '/jon-perfil.jpg' in Firestore!");
    } else {
      console.log("No settings document found.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error updating avatar:", error);
    process.exit(1);
  }
}

run();
