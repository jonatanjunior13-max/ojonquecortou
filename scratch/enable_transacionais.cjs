const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBkmKUQs0Nf_oer1Mvwtg_QumzXANX7m0Y",
  authDomain: "ojonque.firebaseapp.com",
  projectId: "ojonque",
  storageBucket: "ojonque.firebasestorage.app",
  messagingSenderId: "108299544531",
  appId: "1:108299544531:web:b0fa221ca26901aae77126"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const docRef = doc(db, 'settings', 'studio');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const currentData = snap.data();
    console.log("Current Firestore automations settings:", currentData.automations);
    
    const updatedAutomations = {
      ...(currentData.automations || {}),
      waitingRequestEmailEnabled: true,
      bookingConfirmationEmailEnabled: true,
      reminder24hEmailEnabled: true,
      adminWaitingRequestEmailEnabled: true,
      adminBookingConfirmationEmailEnabled: true
    };
    
    await updateDoc(docRef, {
      automations: updatedAutomations
    });
    console.log("Transactional automations enabled successfully!");
  } else {
    console.log("No settings document found in Firestore.");
  }
}

run().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
