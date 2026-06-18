import { initializeApp, getApps } from 'firebase/app';
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const MAILGUN_API_KEY = process.env.RESEND_API_KEY;
const MAILGUN_DOMAIN = 'mg.ojonquecortou.com.br';

function verifyMailgunSignature(signingKey, timestamp, token, signature) {
  if (!signingKey || !timestamp || !token || !signature) return false;
  const encodedToken = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp.toString() + token)
    .digest('hex');
  return encodedToken === signature;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // 1. GET Action: Check Bounces list from Mailgun
  if (req.method === 'GET') {
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

  // 2. POST Action: Receive webhook notifications from Mailgun
  if (req.method === 'POST') {
    const signatureData = req.body.signature;
    const eventData = req.body['event-data'];

    if (!signatureData || !eventData) {
      return res.status(400).json({ error: 'Payload incompleto. Falta assinatura ou event-data.' });
    }

    const { timestamp, token, signature } = signatureData;
    const signingKey = process.env.MAILGUN_SIGNING_KEY || MAILGUN_API_KEY;

    if (!verifyMailgunSignature(signingKey, timestamp, token, signature)) {
      return res.status(401).json({ error: 'Unauthorized: Assinatura inválida do Mailgun.' });
    }

    const event = eventData.event;
    const recipient = eventData.recipient;
    const reason = eventData['delivery-status']?.description || eventData.reason || event;

    console.log(`Recebido webhook do Mailgun. Evento: ${event}, Destinatário: ${recipient}`);

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
              email: 'Não informado',
              unsubscribed: true,
              emailInvalid: true,
              lastBounceReason: `${event}: ${reason}`,
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

  return res.status(405).json({ message: 'Method Not Allowed' });
}
