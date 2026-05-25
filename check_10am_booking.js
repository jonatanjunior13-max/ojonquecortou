import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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
    const q = query(
      collection(db, 'bookings'),
      where('time', '==', '10:00')
    );
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} bookings at 10:00:`);
    querySnapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('---');
    });
    process.exit(0);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    process.exit(1);
  }
}

run();
