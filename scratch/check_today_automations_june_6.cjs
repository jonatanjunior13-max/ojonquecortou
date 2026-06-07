const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getDoc, doc, query, where } = require('firebase/firestore');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/.env';
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
  const todayStr = '2026-06-06'; // Today: June 6, 2026
  const windows = [1, 7, 21, 35, 50, 60, 90, 150];
  
  console.log(`Checking automations for today: ${todayStr}`);
  
  for (const daysAgo of windows) {
    const d = new Date(todayStr);
    d.setDate(d.getDate() - daysAgo);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${day}`;
    
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', targetDateStr),
      where('status', 'in', ['Concluído', 'finalizado'])
    );
    const snap = await getDocs(q);
    
    if (snap.size > 0) {
      console.log(`\n--- Days Ago: D+${daysAgo} (Date: ${targetDateStr}) ---`);
      for (const bDoc of snap.docs) {
        const booking = bDoc.data();
        console.log(`Booking ID: ${bDoc.id}`);
        console.log(`Client: ${booking.clientName} (${booking.clientEmail}, ${booking.clientPhone})`);
        console.log(`Service: ${booking.serviceName} | Status: ${booking.status}`);
        
        // Check unsubscribed
        const phoneKey = booking.clientPhone.replace(/\D/g, '');
        const profileDoc = await getDoc(doc(db, 'client_profiles', phoneKey));
        const isUnsubscribed = profileDoc.exists() && profileDoc.data().unsubscribed === true;
        console.log(`  Unsubscribed: ${isUnsubscribed}`);
        
        // Check recent booking
        const recentQ = query(
          collection(db, 'bookings'),
          where('clientPhone', '==', booking.clientPhone)
        );
        const recentSnap = await getDocs(recentQ);
        const hasRecent = recentSnap.docs.some(doc => {
          const rb = doc.data();
          return rb.date > targetDateStr && ['Concluído', 'Confirmado', 'finalizado'].includes(rb.status);
        });
        console.log(`  Recent booking: ${hasRecent}`);
        
        // Check if already in logs
        const logQ = query(
          collection(db, 'automation_logs'),
          where('email', '==', booking.clientEmail),
          where('date', '==', todayStr),
          where('stage', '==', `D+${daysAgo}`)
        );
        const logSnap = await getDocs(logQ);
        console.log(`  Already sent today: ${!logSnap.empty}`);
      }
    }
  }
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
