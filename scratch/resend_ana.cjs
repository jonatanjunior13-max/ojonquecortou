const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, getDoc, doc, deleteDoc, addDoc } = require('firebase/firestore');

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

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.titan.email',
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

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
  console.log("Searching for Ana Duarte's booking on 2026-06-05...");
  const q = query(
    collection(db, 'bookings'),
    where('date', '==', '2026-06-05'),
    where('clientName', '==', 'Ana Duarte')
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    console.error("No booking found for Ana Duarte on 2026-06-05. Checking client_profiles...");
    const q2 = query(collection(db, 'client_profiles'), where('name', '==', 'Ana Duarte'));
    const snap2 = await getDocs(q2);
    if (snap2.empty) {
      console.error("Ana Duarte not found in profiles either.");
      process.exit(1);
    }
    const profile = snap2.docs[0].data();
    console.log(`Found profile: ${profile.name} - Email: ${profile.email}`);
    await sendToEmail(profile.email, profile.name);
  } else {
    const booking = snap.docs[0].data();
    console.log(`Found booking: ${booking.clientName} - Email in booking: ${booking.clientEmail}`);
    
    // Check if the profile email is updated
    const phoneKey = booking.clientPhone.replace(/\D/g, '');
    const profileDoc = await getDoc(doc(db, 'client_profiles', phoneKey));
    let emailToSend = booking.clientEmail;
    if (profileDoc.exists()) {
      const p = profileDoc.data();
      console.log(`Found profile: ${p.name} - Email in profile: ${p.email}`);
      emailToSend = p.email;
    }
    
    await sendToEmail(emailToSend, booking.clientName);
  }
  process.exit(0);
}

async function sendToEmail(email, name) {
  if (!email || !email.includes('@')) {
    console.error(`Invalid email: ${email}`);
    return;
  }
  console.log(`Corrected Email to send: ${email}`);
  
  // Load templates
  const TEMPLATES = loadTemplates();
  const d1Template = TEMPLATES['d1'];
  if (!d1Template) {
    console.error("D+1 template could not be loaded.");
    return;
  }
  
  const firstName = name.split(' ')[0];
  const subject = `${firstName}, como tá o fio hoje?`;
  const html = d1Template.replace(/{nome}/gi, firstName);
  
  console.log(`Sending D+1 email to ${name} (${email})...`);
  try {
    await transporter.sendMail({
      from: `"Studio do Jon" <${env.SMTP_USER}>`,
      replyTo: 'contato@ojonquecortou.com.br',
      to: email,
      subject: subject,
      html: html
    });
    console.log("✅ Email sent successfully!");
    
    // Write new log for today
    await addDoc(collection(db, 'automation_logs'), {
      timestamp: new Date().toISOString(),
      date: '2026-06-06',
      clientName: name,
      email: email,
      stage: 'D+1',
      sentBy: 'manual_resend_script'
    });
    console.log("Logged success to automation_logs.");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
