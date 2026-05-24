import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).send('Email ausente.');
  }

  try {
    const q = query(collection(db, 'client_profiles'), where('email', '==', email));
    const snapshot = await getDocs(q);

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
      updates.push(updateDoc(doc(db, 'client_profiles', document.id), { unsubscribed: true }));
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
