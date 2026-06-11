import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import crypto from 'crypto';

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

function verifyMailgunSignature(signingKey, timestamp, token, signature) {
  if (!signingKey || !timestamp || !token || !signature) return false;
  const encodedToken = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp.toString() + token)
    .digest('hex');
  return encodedToken === signature;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. Validar Assinatura do Mailgun
  const signatureData = req.body.signature;
  const eventData = req.body['event-data'];

  if (!signatureData || !eventData) {
    return res.status(400).json({ error: 'Payload incompleto. Falta assinatura ou event-data.' });
  }

  const { timestamp, token, signature } = signatureData;
  const signingKey = process.env.MAILGUN_SIGNING_KEY || process.env.RESEND_API_KEY; // Fallback para compatibilidade se usar a mesma var

  if (!verifyMailgunSignature(signingKey, timestamp, token, signature)) {
    return res.status(401).json({ error: 'Unauthorized: Assinatura inválida do Mailgun.' });
  }

  const event = eventData.event; // 'failed' ou 'complained'
  const recipient = eventData.recipient; // E-mail alvo
  const reason = eventData['delivery-status']?.description || eventData.reason || event;

  console.log(`Recebido webhook do Mailgun. Evento: ${event}, Destinatário: ${recipient}`);

  // Tratar bounces (failed permanent) ou complaints
  const isPermanentFailure = event === 'failed' && eventData.severity === 'permanent';
  const isSpamComplaint = event === 'complained';

  if (isPermanentFailure || isSpamComplaint) {
    if (!recipient) {
      return res.status(200).json({ success: true, message: 'Nenhum destinatário informado no payload.' });
    }

    try {
      const q = query(collection(db, 'client_profiles'), where('email', '==', recipient.trim().toLowerCase()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const updates = [];
        snapshot.forEach((document) => {
          const clientRef = doc(db, 'client_profiles', document.id);
          updates.push(updateDoc(clientRef, {
            email: 'Não informado',                // Remove o e-mail inválido
            unsubscribed: true,                     // Evita re-inscrições automáticas
            emailInvalid: true,                     // Flag para identificação no sistema
            lastBounceReason: `${event}: ${reason}`, // Motivo
            lastBounceAt: new Date().toISOString()
          }));
        });
        
        await Promise.all(updates);
        console.log(`Cliente(s) atualizados com sucesso para e-mail limpo devido a bounce/complaint no endereço: ${recipient}`);
        return res.status(200).json({ success: true, recipient, message: 'Perfil do cliente atualizado com sucesso.' });
      } else {
        console.log(`Nenhum perfil de cliente cadastrado encontrado com o e-mail: ${recipient}`);
        return res.status(200).json({ success: true, recipient, message: 'E-mail não correspondia a nenhuma cliente cadastrada.' });
      }
    } catch (err) {
      console.error(`Erro ao tratar e-mail inválido (${recipient}):`, err);
      return res.status(500).json({ error: 'Erro ao atualizar base de dados.', details: err.message });
    }
  }

  return res.status(200).json({ success: true, message: `Evento ${event} ignorado.` });
}
