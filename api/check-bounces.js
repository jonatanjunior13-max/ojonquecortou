import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

let app, db;
try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

// A chave do Mailgun está armazenada na variável RESEND_API_KEY na Vercel
const MAILGUN_API_KEY = process.env.RESEND_API_KEY;
const MAILGUN_DOMAIN = 'mg.ojonquecortou.com.br';

export default async function handler(req, res) {
  // Simple auth
  const adminToken = req.headers['x-admin-token'] || req.query.token;
  if (!adminToken || adminToken !== 'studio-jon-admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!MAILGUN_API_KEY) {
    return res.status(500).json({ error: 'Mailgun API Key não configurada (RESEND_API_KEY).' });
  }

  try {
    const basicAuth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
    const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/bounces`;
    
    const resMailgun = await fetch(mailgunUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`
      }
    });

    if (!resMailgun.ok) {
      const errText = await resMailgun.text();
      return res.status(500).json({ error: `Erro Mailgun: ${resMailgun.status}`, details: errText });
    }

    const mailgunData = await resMailgun.json();
    const bounces = mailgunData.items || [];

    if (!db) {
      return res.status(500).json({ error: 'Firebase não inicializado' });
    }

    const snapshot = await getDocs(collection(db, 'client_profiles'));
    const clients = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.email) {
        clients.push({
          id: docSnap.id,
          name: data.name,
          email: data.email.trim().toLowerCase(),
          newsletter: data.newsletter
        });
      }
    });

    const matchedBounces = [];
    bounces.forEach(bounce => {
      const bounceEmail = bounce.address.trim().toLowerCase();
      const matchedClients = clients.filter(c => c.email === bounceEmail);
      
      if (matchedClients.length > 0) {
        matchedClients.forEach(c => {
          matchedBounces.push({
            name: c.name,
            email: c.email,
            phone: c.id,
            newsletterStatus: c.newsletter === false ? 'Desativado' : 'Ativo',
            error: bounce.error,
            createdAt: bounce.created_at
          });
        });
      } else {
        matchedBounces.push({
          name: 'Sem cliente ativa vinculada',
          email: bounceEmail,
          phone: null,
          newsletterStatus: 'N/A',
          error: bounce.error,
          createdAt: bounce.created_at
        });
      }
    });

    return res.status(200).json({
      success: true,
      totalMailgunBounces: bounces.length,
      matchedBouncesCount: matchedBounces.length,
      items: matchedBounces
    });

  } catch (err) {
    return res.status(500).json({ error: 'Falha no processamento', details: err.message });
  }
}
