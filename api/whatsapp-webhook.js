import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc } from 'firebase/firestore';

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

// Proxy de envio (outbound) — chamado pelo painel via /api/whatsapp.
// Reune a antiga função api/whatsapp.js para ficar dentro do limite de
// 12 Serverless Functions do plano Hobby. Dispatch pelo campo `gateway`.
async function handleOutboundProxy(req, res) {
  const { gateway, phone, message, config, extraData } = req.body;

  if (!gateway || !phone || !message) {
    return res.status(400).json({ error: 'Parâmetros gateway, phone e message são obrigatórios.' });
  }

  try {
    let url = '';
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    if (gateway === 'zapi') {
      const { zApiInstanceId, zApiToken } = config || {};
      if (!zApiInstanceId || !zApiToken) {
        return res.status(400).json({ error: 'Z-API não configurada corretamente' });
      }
      url = `https://api.z-api.io/instances/${zApiInstanceId}/token/${zApiToken}/send-text`;
      body = { phone, message };
    } else if (gateway === 'evolution') {
      const { evolutionApiUrl, evolutionApiKey, evolutionInstanceName } = config || {};
      if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
        return res.status(400).json({ error: 'Evolution API não configurada corretamente' });
      }
      url = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${evolutionInstanceName}`;
      headers['apikey'] = evolutionApiKey;
      body = { number: phone, text: message };
    } else if (gateway === 'custom') {
      const { customWebhookUrl } = config || {};
      if (!customWebhookUrl) {
        return res.status(400).json({ error: 'Webhook customizado não configurado' });
      }
      url = customWebhookUrl;
      body = { phone, message, ...extraData };
    } else {
      return res.status(400).json({ error: 'Gateway inválido ou não suportado' });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const resText = await response.text();
    let resJson = {};
    try {
      resJson = JSON.parse(resText);
    } catch (e) {
      resJson = { text: resText };
    }

    if (response.ok) {
      return res.status(200).json({ success: true, data: resJson });
    } else {
      return res.status(response.status).json({ error: 'Erro no gateway de WhatsApp', details: resJson });
    }
  } catch (error) {
    console.error('Erro no proxy de whatsapp:', error);
    return res.status(500).json({ error: 'Erro interno no servidor de envio', message: error.message });
  }
}

// ─── Setmore Webhook Helpers & Handler ──────────────────────────────────────

function parseSetmoreDateTime(dateStr, timeStr) {
  if (!dateStr) return { date: null, time: null };
  let time = timeStr || '';
  const pm = /PM/i.test(time);
  const am = /AM/i.test(time);
  time = time.replace(/\s*(AM|PM)/i, '').trim();
  if ((pm || am) && time.includes(':')) {
    let [h, m] = time.split(':').map(Number);
    if (pm && h !== 12) h += 12;
    if (am && h === 12) h = 0;
    time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return { date: dateStr, time };
}

function cleanPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return '55' + digits;
  return digits;
}

function ptDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${parseInt(d, 10)} de ${months[parseInt(m, 10) - 1]}`;
}

async function loadStudioSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'studio'));
    return snap.exists() ? snap.data() : {};
  } catch { return {}; }
}

async function sendSetmoreWhatsApp(settings, phone, message) {
  const { whatsappGateway, zApiInstanceId, zApiToken,
          evolutionApiUrl, evolutionApiKey, evolutionInstanceName } = settings;
  if (!whatsappGateway || !phone) return;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://www.ojonquecortou.com.br';

  const body = {
    gateway: whatsappGateway,
    phone,
    message,
    config: { zApiInstanceId, zApiToken, evolutionApiUrl, evolutionApiKey, evolutionInstanceName }
  };

  try {
    await fetch(`${baseUrl}/api/whatsapp-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('[setmore-webhook] Erro ao enviar WhatsApp:', err.message);
  }
}

async function handleSetmoreWebhook(req, res) {
  const payload = req.body;
  console.log('[setmore-webhook-router] Payload recebido:', JSON.stringify(payload));

  const event = payload?.event || payload?.type || '';
  const appt = payload?.appointment || payload?.data || payload || {};

  let dateStr = appt.date;
  let timeStr = appt.start;

  if (!dateStr && appt.start_time) {
    const iso = appt.start_time; 
    dateStr = iso.split('T')[0];
    timeStr = iso.split('T')[1]?.substring(0, 5);
  }

  const { date, time } = parseSetmoreDateTime(dateStr, timeStr);
  const clientName  = appt.customer_name  || appt.client_name  || 'Cliente';
  const clientPhone = cleanPhone(appt.customer_phone || appt.client_phone || '');
  const clientEmail = appt.customer_email || appt.client_email || '';
  const serviceName = appt.service_name   || appt.service      || 'Serviço';
  const duration    = appt.duration       || 60;
  const setmoreId   = appt.key            || appt.id           || '';
  const comment     = appt.comment        || appt.notes        || '';

  if (!date || !time) {
    console.warn('[setmore-webhook-router] Data/hora inválida no payload');
    return res.status(400).json({ error: 'Data ou hora inválida no payload' });
  }

  const settings = await loadStudioSettings();
  const ownerPhone = cleanPhone(settings.whatsappNumber || settings.phone || '');

  // ── BOOKED ────────────────────────────────────────────────────────────────
  if (!event || event === 'appointment_booked' || event === 'booked') {
    let existingId = null;
    if (setmoreId) {
      const q = query(collection(db, 'bookings'), where('setmoreId', '==', setmoreId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        existingId = snap.docs[0].id;
        console.log('[setmore-webhook-router] Agendamento já existe:', existingId);
        return res.status(200).json({ status: 'already_exists', id: existingId });
      }
    }

    const bookingPayload = {
      clientName,
      clientPhone,
      clientEmail,
      serviceName,
      service: { name: serviceName },
      date,
      time,
      duration: Number(duration),
      status: 'confirmado',
      source: 'google',        
      setmoreId,
      notes: comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingPayload);
    console.log('[setmore-webhook-router] Agendamento salvo:', docRef.id);

    if (clientPhone) {
      const msg =
        `Olá, *${clientName}*! 🎉\n\n` +
        `Seu agendamento no *Studio do Jon* foi confirmado:\n\n` +
        `📅 *${ptDate(date)}* às *${time}*\n` +
        `✂️ *${serviceName}*\n\n` +
        `Nos vemos em breve! Qualquer dúvida é só chamar. 😊`;
      await sendSetmoreWhatsApp(settings, clientPhone, msg);
    }

    if (ownerPhone) {
      const msg =
        `🔔 *Novo agendamento via Google!*\n\n` +
        `👤 *${clientName}*` + (clientPhone ? ` | ${clientPhone}` : '') + `\n` +
        `📅 *${ptDate(date)}* às *${time}*\n` +
        `✂️ *${serviceName}*\n` +
        (comment ? `💬 "${comment}"\n` : '') +
        `\n_Salvo automaticamente no CRM_ ✅`;
      await sendSetmoreWhatsApp(settings, ownerPhone, msg);
    }

    return res.status(200).json({ status: 'created', id: docRef.id });
  }

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  if (event === 'appointment_cancelled' || event === 'cancelled') {
    if (setmoreId) {
      const q = query(collection(db, 'bookings'), where('setmoreId', '==', setmoreId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const bookingDoc = snap.docs[0];
        await updateDoc(doc(db, 'bookings', bookingDoc.id), {
          status: 'cancelado',
          updatedAt: new Date().toISOString()
        });
        console.log('[setmore-webhook-router] Agendamento cancelado:', bookingDoc.id);

        if (ownerPhone) {
          const msg =
            `❌ *Cancelamento via Google*\n\n` +
            `👤 *${clientName}*\n` +
            `📅 *${ptDate(date)}* às *${time}*\n` +
            `✂️ *${serviceName}*\n\n` +
            `_Status atualizado no CRM_ ✅`;
          await sendSetmoreWhatsApp(settings, ownerPhone, msg);
        }

        return res.status(200).json({ status: 'cancelled', id: bookingDoc.id });
      }
    }
    return res.status(200).json({ status: 'not_found' });
  }

  // ── RESCHEDULED ───────────────────────────────────────────────────────────
  if (event === 'appointment_rescheduled' || event === 'rescheduled') {
    if (setmoreId) {
      const q = query(collection(db, 'bookings'), where('setmoreId', '==', setmoreId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const bookingDoc = snap.docs[0];
        await updateDoc(doc(db, 'bookings', bookingDoc.id), {
          date,
          time,
          updatedAt: new Date().toISOString()
        });
        console.log('[setmore-webhook-router] Agendamento reagendado:', bookingDoc.id);

        if (clientPhone) {
          const msg =
            `📅 *Reagendamento confirmado!*\n\n` +
            `Olá, *${clientName}*! Seu horário foi atualizado:\n\n` +
            `📅 *${ptDate(date)}* às *${time}*\n` +
            `✂️ *${serviceName}*\n\n` +
            `Nos vemos em breve! 😊`;
          await sendSetmoreWhatsApp(settings, clientPhone, msg);
        }

        if (ownerPhone) {
          const msg =
            `🔄 *Reagendamento via Google*\n\n` +
            `👤 *${clientName}*\n` +
            `📅 Novo horário: *${ptDate(date)}* às *${time}*\n` +
            `✂️ *${serviceName}*\n\n` +
            `_CRM atualizado_ ✅`;
          await sendSetmoreWhatsApp(settings, ownerPhone, msg);
        }

        return res.status(200).json({ status: 'rescheduled', id: bookingDoc.id });
      }
    }
    return res.status(200).json({ status: 'not_found' });
  }

  console.log('[setmore-webhook-router] Evento desconhecido:', event);
  return res.status(200).json({ status: 'ignored', event });
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Setmore: if setmoreId or source: 'google' or appointment key is present
  const isSetmore = req.body && (req.body.event?.includes('appointment_') || req.body.appointment || req.body.setmoreId || req.body.source === 'google' || req.query.source === 'google');
  if (isSetmore) {
    return handleSetmoreWebhook(req, res);
  }

  // Outbound: chamada do painel para enviar mensagem (campo `gateway` presente).
  if (req.body && req.body.gateway) {
    return handleOutboundProxy(req, res);
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
      where('status', 'in', ['pendente', 'confirmado']),
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
      return res.status(200).json({ status: 'not_found', reason: 'no_pending_or_confirmed_booking_for_phone', last8: last8Digits });
    }

    // 4. Atualiza o status do agendamento para confirmado pela cliente
    await updateDoc(matchedBooking.ref, {
      status: 'confirmado pela cliente',
      confirmedVia: 'whatsapp_webhook',
      confirmedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      bookingId: matchedBooking.id,
      clientName: matchedBooking.clientName,
      status: 'updated_to_confirmed_pela_cliente'
    });

  } catch (error) {
    console.error('Erro no webhook do WhatsApp:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
