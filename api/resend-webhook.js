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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Validação simples de segurança via query parameter
  const secret = req.query.secret;
  const expectedSecret = process.env.RESEND_WEBHOOK_SECRET || 'ojonque_resend_secret';
  if (secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: 'Payload incompleto.' });
  }

  console.log(`Recebido webhook do Resend. Tipo: ${type}`);

  // Tratar bounces (e-mails inexistentes/inválidos) ou complaints (marcado como spam)
  if (type === 'email.bounced' || type === 'email.complained') {
    const recipients = data.to || [];
    const logs = [];

    for (const email of recipients) {
      if (!email) continue;
      
      try {
        const q = query(collection(db, 'client_profiles'), where('email', '==', email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const updates = [];
          snapshot.forEach((document) => {
            const clientRef = doc(db, 'client_profiles', document.id);
            updates.push(updateDoc(clientRef, {
              email: 'Não informado',   // Remove o e-mail inválido
              unsubscribed: true,        // Evita re-inscrições automáticas
              emailInvalid: true,        // Flag para identificação no sistema
              lastBounceReason: type,    // Motivo do bounce
              lastBounceAt: new Date().toISOString()
            }));
            logs.push(`Cliente ${document.id} (${email}) atualizado. E-mail limpo devido a ${type}.`);
          });
          
          await Promise.all(updates);
        } else {
          logs.push(`Nenhum cliente cadastrado com o e-mail: ${email}`);
        }
      } catch (err) {
        console.error(`Erro ao tratar e-mail inválido (${email}):`, err);
        return res.status(500).json({ error: 'Erro ao atualizar base de dados.', details: err.message });
      }
    }

    return res.status(200).json({ success: true, processed: recipients, logs });
  }

  return res.status(200).json({ success: true, message: `Evento do tipo ${type} ignorado.` });
}
