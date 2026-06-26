/**
 * /api/setmore-webhook
 * 
 * Receives Setmore booking webhooks and:
 *  1. Saves the booking to Firestore (same structure as native bookings)
 *  2. Sends a WhatsApp confirmation to the client
 *  3. Sends a WhatsApp notification to the studio owner
 * 
 * Configure in Setmore:
 *   Apps & Integrations → Webhooks
 *   URL: https://www.ojonquecortou.com.br/api/setmore-webhook
 *   Events: appointment_booked, appointment_cancelled, appointment_rescheduled
 * 
 * Set SETMORE_WEBHOOK_SECRET in Vercel environment variables.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, addDoc, query,
  where, getDocs, updateDoc, doc, getDoc
} from 'firebase/firestore';

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseSetmoreDateTime(dateStr, timeStr) {
  // Setmore sends: date "2025-06-26", time "14:00" or "2:00 PM"
  if (!dateStr) return { date: null, time: null };
  let time = timeStr || '';
  // Normalize 12h → 24h if needed
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
  // Keep only digits, ensure country code 55
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

async function sendWhatsApp(settings, phone, message) {
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

// ─── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow GET for Setmore webhook verification ping
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'setmore-webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional shared secret verification
  const secret = process.env.SETMORE_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers['x-setmore-secret'] || req.query.secret;
    if (incoming !== secret) {
      console.warn('[setmore-webhook] Token inválido');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const payload = req.body;
  console.log('[setmore-webhook] Payload recebido:', JSON.stringify(payload));

  // ── Setmore webhook shape ────────────────────────────────────────────────
  // {
  //   "event": "appointment_booked" | "appointment_cancelled" | "appointment_rescheduled",
  //   "appointment": {
  //     "key": "apt_xxx",
  //     "service_name": "Corte com o Jon",
  //     "staff_name": "Jon",
  //     "customer_name": "Maria Silva",
  //     "customer_email": "maria@email.com",
  //     "customer_phone": "31999990000",
  //     "start_time": "2025-06-26T14:00:00",
  //     "end_time": "2025-06-26T15:30:00",
  //     "date": "2025-06-26",
  //     "start": "14:00",
  //     "end": "15:30",
  //     "duration": 90,
  //     "label_id": null,
  //     "comment": ""
  //   }
  // }

  const event = payload?.event || payload?.type || '';
  const appt = payload?.appointment || payload?.data || payload || {};

  // Extract fields — Setmore may send date inside start_time ISO string
  let dateStr = appt.date;
  let timeStr = appt.start;

  if (!dateStr && appt.start_time) {
    const iso = appt.start_time; // "2025-06-26T14:00:00"
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
    console.warn('[setmore-webhook] Data/hora inválida no payload');
    return res.status(400).json({ error: 'Data ou hora inválida no payload' });
  }

  const settings = await loadStudioSettings();
  const ownerPhone = cleanPhone(settings.whatsappNumber || settings.phone || '');

  // ── BOOKED ────────────────────────────────────────────────────────────────
  if (!event || event === 'appointment_booked' || event === 'booked') {
    // Check if already exists (avoid duplicates on retries)
    let existingId = null;
    if (setmoreId) {
      const q = query(collection(db, 'bookings'), where('setmoreId', '==', setmoreId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        existingId = snap.docs[0].id;
        console.log('[setmore-webhook] Agendamento já existe:', existingId);
        return res.status(200).json({ status: 'already_exists', id: existingId });
      }
    }

    // Save to Firestore in the same structure as native bookings
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
      source: 'google',        // "Agendado pelo Google"
      setmoreId,
      notes: comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingPayload);
    console.log('[setmore-webhook] Agendamento salvo:', docRef.id);

    // WhatsApp → Cliente
    if (clientPhone) {
      const msg =
        `Olá, *${clientName}*! 🎉\n\n` +
        `Seu agendamento no *Studio do Jon* foi confirmado:\n\n` +
        `📅 *${ptDate(date)}* às *${time}*\n` +
        `✂️ *${serviceName}*\n\n` +
        `Nos vemos em breve! Qualquer dúvida é só chamar. 😊`;
      await sendWhatsApp(settings, clientPhone, msg);
    }

    // WhatsApp → Dono (aviso de novo agendamento pelo Google)
    if (ownerPhone) {
      const msg =
        `🔔 *Novo agendamento via Google!*\n\n` +
        `👤 *${clientName}*` + (clientPhone ? ` | ${clientPhone}` : '') + `\n` +
        `📅 *${ptDate(date)}* às *${time}*\n` +
        `✂️ *${serviceName}*\n` +
        (comment ? `💬 "${comment}"\n` : '') +
        `\n_Salvo automaticamente no CRM_ ✅`;
      await sendWhatsApp(settings, ownerPhone, msg);
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
        console.log('[setmore-webhook] Agendamento cancelado:', bookingDoc.id);

        if (ownerPhone) {
          const msg =
            `❌ *Cancelamento via Google*\n\n` +
            `👤 *${clientName}*\n` +
            `📅 *${ptDate(date)}* às *${time}*\n` +
            `✂️ *${serviceName}*\n\n` +
            `_Status atualizado no CRM_ ✅`;
          await sendWhatsApp(settings, ownerPhone, msg);
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
        console.log('[setmore-webhook] Agendamento reagendado:', bookingDoc.id);

        if (clientPhone) {
          const msg =
            `📅 *Reagendamento confirmado!*\n\n` +
            `Olá, *${clientName}*! Seu horário foi atualizado:\n\n` +
            `📅 *${ptDate(date)}* às *${time}*\n` +
            `✂️ *${serviceName}*\n\n` +
            `Nos vemos em breve! 😊`;
          await sendWhatsApp(settings, clientPhone, msg);
        }

        if (ownerPhone) {
          const msg =
            `🔄 *Reagendamento via Google*\n\n` +
            `👤 *${clientName}*\n` +
            `📅 Novo horário: *${ptDate(date)}* às *${time}*\n` +
            `✂️ *${serviceName}*\n\n` +
            `_CRM atualizado_ ✅`;
          await sendWhatsApp(settings, ownerPhone, msg);
        }

        return res.status(200).json({ status: 'rescheduled', id: bookingDoc.id });
      }
    }
    return res.status(200).json({ status: 'not_found' });
  }

  // Evento desconhecido — só confirmar recebimento
  console.log('[setmore-webhook] Evento desconhecido:', event);
  return res.status(200).json({ status: 'ignored', event });
}
