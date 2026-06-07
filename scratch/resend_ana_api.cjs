const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, getDoc, doc, addDoc } = require('firebase/firestore');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/.env';
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

function loadTemplates() {
  const tplPath = path.join('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js');
  const src = fs.readFileSync(tplPath, 'utf8');
  const templates = {};
  const keys = ['d1'];
  for (const key of keys) {
    const startTag = `  ${key}: \``;
    const si = src.indexOf(startTag);
    if (si < 0) {
      const si2 = src.indexOf(`${key}: \``);
      if (si2 < 0) { templates[key] = null; continue; }
      const ei2 = src.indexOf('`,', si2 + key.length + 3);
      templates[key] = src.substring(si2 + key.length + 3, ei2);
    } else {
      const ei = src.indexOf('`,', si + startTag.length);
      templates[key] = src.substring(si + startTag.length, ei);
    }
  }
  return templates;
}

async function run() {
  console.log("Searching for Ana Duarte's profile/booking to get corrected email...");
  const q2 = query(collection(db, 'client_profiles'), where('name', '==', 'Ana Duarte'));
  const snap2 = await getDocs(q2);
  if (snap2.empty) {
    console.error("Ana Duarte profile not found.");
    process.exit(1);
  }
  const p = snap2.docs[0].data();
  const email = p.email;
  const name = p.name;
  console.log(`Found corrected email from profile: ${email}`);

  // Load templates
  const TEMPLATES = loadTemplates();
  const d1Template = TEMPLATES['d1'];
  if (!d1Template) {
    console.error("D+1 template could not be loaded.");
    process.exit(1);
  }

  const firstName = name.split(' ')[0];
  const subject = `${firstName}, como tá o fio hoje?`;
  const html = d1Template.replace(/{nome}/gi, firstName);

  console.log(`Calling live API to send email to ${email}...`);
  try {
    const response = await fetch('https://www.ojonquecortou.com.br/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'campanha_raw',
        clientEmail: email,
        clientName: name,
        subject: subject,
        htmlBody: html
      })
    });
    
    if (response.ok) {
      console.log("✅ Live API successfully sent the email!");
      
      // Log it in Firestore
      await addDoc(collection(db, 'automation_logs'), {
        timestamp: new Date().toISOString(),
        date: '2026-06-06',
        clientName: name,
        email: email,
        stage: 'D+1',
        sentBy: 'manual_resend_api_script'
      });
      console.log("✅ Success logged in Firestore automation_logs.");
    } else {
      console.error("❌ Live API returned error:", await response.text());
    }
  } catch (err) {
    console.error("❌ API Fetch failed:", err);
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
