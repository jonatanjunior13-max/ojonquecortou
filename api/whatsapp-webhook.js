import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

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

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle Webhook verification (GET requests)
  if (req.method === 'GET') {
    const mode = req.query?.['hub.mode'];
    const token = req.query?.['hub.verify_token'];
    const challenge = req.query?.['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      } else {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    return res.status(400).json({ error: 'Bad Request' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    let senderPhone = '';
    let messageText = '';
    let fromMe = false;

    // 1. Identificar se é Evolution API ou Z-API e extrair dados
    if (payload.event === 'messages.upsert' && payload.data) {
      // EVOLUTION API (Estrutura padrão)
      const msgData = payload.data;
      fromMe = msgData.key?.fromMe || false;
      senderPhone = msgData.key?.remoteJid || '';
      
      if (msgData.message) {
        if (msgData.message.conversation) {
          messageText = msgData.message.conversation;
        } else if (msgData.message.extendedTextMessage?.text) {
          messageText = msgData.message.extendedTextMessage.text;
        } else if (msgData.message.buttonsResponseMessage?.selectedButtonId) {
          messageText = msgData.message.buttonsResponseMessage.selectedButtonId;
        } else if (msgData.message.listResponseMessage?.title) {
          messageText = msgData.message.listResponseMessage.title;
        }
      }
    } else if (payload.key?.remoteJid) {
      // Outro formato alternativo da Evolution API
      fromMe = payload.key.fromMe || false;
      senderPhone = payload.key.remoteJid;
      if (payload.message) {
        messageText = payload.message.conversation || payload.message.extendedTextMessage?.text || '';
      }
    } else if (payload.phone && payload.text) {
      // Z-API (Estrutura padrão)
      senderPhone = payload.phone;
      fromMe = payload.fromMe || false;
      messageText = payload.text.message || payload.text || '';
    }

    // Ignora se for mensagem enviada por nós mesmos
    if (fromMe) {
      return res.status(200).json({ status: 'ignored', reason: 'message_from_me' });
    }

    // Limpa e normaliza o telefone do remetente
    const cleanedPhone = senderPhone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length < 8) {
      return res.status(200).json({ status: 'ignored', reason: 'invalid_phone', phone: senderPhone });
    }

    // Pega os últimos 8 dígitos para uma busca resiliente (ex: ignora o nono dígito instável e DDI)
    const last8Digits = cleanedPhone.slice(-8);

    // Normaliza o texto recebido para verificar se é uma confirmação
    const normalizedText = messageText
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const cleanWord = normalizedText.replace(/[^\w\s]/g, '').trim();

    const confirmKeywords = ['sim', 'confirmar', 'confirmo', 'confirmado', 'ok', 'vou', 'quero', 'agendado', 'positivo', 's', 'y'];
    const isConfirmation = confirmKeywords.includes(cleanWord) || 
                          cleanWord.startsWith('sim ') || 
                          cleanWord.startsWith('confirmar ') || 
                          cleanWord.startsWith('ok ') ||
                          cleanWord.startsWith('vou ') ||
                          cleanWord.startsWith('quero ');

    if (!isConfirmation) {
      return res.status(200).json({ status: 'ignored', reason: 'not_a_confirmation_message', text: messageText });
    }

    // 2. Carrega as configurações do estúdio para validar se o gateway está ativo
    const settingsDoc = await getDoc(doc(db, 'settings', 'studio'));
    const settings = settingsDoc.exists() ? settingsDoc.data() : null;

    if (!settings || !settings.waReminderEnabled) {
      return res.status(200).json({ status: 'ignored', reason: 'whatsapp_integration_disabled' });
    }

    // 3. Busca agendamentos pendentes em uma janela de 3 dias (ontem, hoje e amanhã)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('status', '==', 'pendente'),
      where('date', 'in', [yesterdayStr, todayStr, tomorrowStr])
    );

    const snapshot = await getDocs(q);
    let matchedBooking = null;

    snapshot.forEach(docSnap => {
      if (matchedBooking) return; // Pega o primeiro que encontrar
      const data = docSnap.data();
      const dbPhone = (data.clientPhone || '').replace(/\D/g, '');
      if (dbPhone.endsWith(last8Digits)) {
        matchedBooking = { id: docSnap.id, ref: docSnap.ref, ...data };
      }
    });

    if (!matchedBooking) {
      return res.status(200).json({ status: 'not_found', reason: 'no_pending_booking_for_phone', last8: last8Digits });
    }

    // 4. Atualiza o status do agendamento para confirmado
    await updateDoc(matchedBooking.ref, {
      status: 'confirmado',
      confirmedVia: 'whatsapp_webhook',
      confirmedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      bookingId: matchedBooking.id,
      clientName: matchedBooking.clientName,
      status: 'updated_to_confirmed'
    });

  } catch (error) {
    console.error('Erro no webhook do WhatsApp:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
