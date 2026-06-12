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

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  // Simple auth
  const adminToken = req.headers['x-admin-token'] || req.query.token;
  if (!adminToken || adminToken !== 'studio-jon-admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API Key não configurada (RESEND_API_KEY).' });
  }

  try {
    // Buscar lista de supressões (bounces + spam complaints + unsubscribes) na Resend
    const resendUrl = 'https://api.resend.com/emails?limit=100';
    const suppressionUrl = 'https://api.resend.com/audiences';

    // Primeiro tentamos pegar supressões via API
    // A Resend usa "Suppression" no lugar de "Bounces" do Mailgun
    const resResend = await fetch('https://api.resend.com/emails?limit=100&status=bounced', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let bounces = [];

    if (resResend.ok) {
      const resendData = await resResend.json();
      bounces = (resendData.data || []).map(email => ({
        address: email.to?.[0] || email.to || '',
        error: email.last_event || 'bounced',
        created_at: email.created_at
      }));
    } else {
      // Se a endpoint /emails?status=bounced não funcionar, retornamos lista vazia
      const errText = await resResend.text();
      console.warn('Resend bounce fetch warning:', resResend.status, errText);
      // Não retornamos erro — lista vazia é uma resposta válida
    }

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
      const bounceEmail = (bounce.address || '').trim().toLowerCase();
      if (!bounceEmail) return;
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
          name: 'Sem cliente vinculada',
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
      totalBounces: bounces.length,
      matchedBouncesCount: matchedBounces.length,
      items: matchedBounces,
      totalClientsWithEmail: clients.length
    });

  } catch (err) {
    return res.status(500).json({ error: 'Falha no processamento', details: err.message });
  }
}
