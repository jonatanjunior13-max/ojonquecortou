import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
    }
    const serviceAccount = JSON.parse(serviceAccountStr);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).send('Email ausente.');
  }

  try {
    const db = admin.firestore();
    const snapshot = await db.collection('client_profiles').where('email', '==', email).get();

    if (snapshot.empty) {
      // If we don't find it, we just say it's done to prevent enumeration.
      return res.status(200).send(`
        <html>
        <head><meta charset="utf-8"><title>Descadastrado</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0a0a0a; color: #fff;">
          <h2>Tudo certo!</h2>
          <p>O email ${email} não receberá mais comunicações de marketing.</p>
        </body>
        </html>
      `);
    }

    const updates = [];
    snapshot.forEach((document) => {
      updates.push(document.ref.update({ unsubscribed: true }));
    });

    await Promise.all(updates);

    return res.status(200).send(`
      <html>
      <head><meta charset="utf-8"><title>Descadastrado</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0a0a0a; color: #fff;">
        <h2>Inscrição Cancelada</h2>
        <p>O email <strong>${email}</strong> foi removido da nossa lista com sucesso.</p>
        <p>Você não receberá mais lembretes ou campanhas do Studio do Jon.</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Erro no unsubscribe:', error);
    return res.status(500).send('Erro interno do servidor.');
  }
}
