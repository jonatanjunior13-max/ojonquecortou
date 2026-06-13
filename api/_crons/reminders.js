import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to dispatch email
async function dispatchEmail(payload, hostUrl) {
  try {
    const res = await fetch(`${hostUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Erro ao chamar /api/send-email:', err);
    return false;
  }
}

export default async function handler(req, res) {
  // Autenticação na API de Cron (Vercel manda um cabeçalho Authorization: Bearer CRON_SECRET)
  // Opcionalmente, pode ser chamado manualmente para testes.
  try {
    const adminEmail = process.env.CRON_FIREBASE_EMAIL;
    const adminPassword = process.env.CRON_FIREBASE_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: 'Faltam credenciais CRON_FIREBASE_EMAIL e PASSWORD nas variaveis de ambiente da Vercel.' });
    }

    // Login com conta de Admin para poder ler a coleção bookings
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    // Data de hoje (YYYY-MM-DD no Brasil)
    const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false });
    const now = new Date();
    const parts = formatter.formatToParts(now);
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const todayStr = `${year}-${month}-${day}`;

    // Calcular data de amanhã (para o lembrete 24h por e-mail) de forma segura contra fusos horários
    const todayBr = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12, 0, 0));
    const tomorrowBr = new Date(todayBr.getTime() + 24 * 60 * 60 * 1000);
    const tomParts = formatter.formatToParts(tomorrowBr);
    const tomDay = tomParts.find(p => p.type === 'day').value;
    const tomMonth = tomParts.find(p => p.type === 'month').value;
    const tomYear = tomParts.find(p => p.type === 'year').value;
    const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

    // Buscar agendamentos de amanhã para o e-mail e WhatsApp de lembrete 24h
    const q = query(collection(db, 'bookings'), where('date', '==', tomorrowStr));
    const snapshot = await getDocs(q);
    const bookings = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Inclui todos os agendamentos de amanhã que ainda não receberam lembrete
      if ((data.status === 'pendente' || data.status === 'confirmado') && !data.reminderSent) {
        bookings.push({ id: doc.id, ...data });
      }
    });

    const tomorrowBookings = bookings;

    if (bookings.length === 0) {
      return res.status(200).json({ message: 'Nenhum agendamento pendente ou confirmado para amanhã.', tomorrowStr });
    }

    // Obter as configurações do painel para ler as credenciais da Evolution API
    const settingsDoc = await getDoc(doc(db, 'settings', 'studio'));
    const settings = settingsDoc.exists() ? settingsDoc.data() : null;

    const waEnabled = settings?.waReminderEnabled;
    const gateway = settings?.waReminderGateway || 'evolution';

    // Montar URL do gateway de WA (se ativo)
    let waUrl = '';
    let waHeaders = { 'Content-Type': 'application/json' };

    if (waEnabled && gateway === 'evolution') {
      if (settings.evolutionApiUrl && settings.evolutionApiKey && settings.evolutionInstanceName) {
        waUrl = `${settings.evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${settings.evolutionInstanceName}`;
        waHeaders['apikey'] = settings.evolutionApiKey;
      }
    }

    const template = settings?.waReminderTemplate || 'Olá, {cliente}! Passando para lembrar do seu horário amanhã ({data} às {hora}) para o serviço: {servico}. Podemos confirmar?';

    let successCount = 0;
    let failCount = 0;

    const CHUNK_SIZE = 10;
    const bookingsChunks = [];
    for (let i = 0; i < bookings.length; i += CHUNK_SIZE) {
      bookingsChunks.push(bookings.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of bookingsChunks) {
      const waPromises = chunk.map(async (b) => {
        if (!b.clientPhone) return { success: false, id: null };

        const cancelLink = `https://www.ojonquecortou.com.br/cancelar?id=${b.id}`;
        let msg = template
          .replace('{cliente}', b.clientName.split(' ')[0])
          .replace('{data}', b.date.split('-').reverse().join('/'))
          .replace('{hora}', b.time)
          .replace('{servico}', b.service?.name || b.serviceName);

        if (msg.includes('{link_cancelamento}')) {
          msg = msg.replace('{link_cancelamento}', cancelLink);
        } else {
          msg += `\n\nCaso precise cancelar ou remarcar: ${cancelLink}`;
        }

        const phoneNum = b.clientPhone.replace(/\D/g, '');
        const waNumber = phoneNum.startsWith('55') ? phoneNum : `55${phoneNum}`;

        // Dispara WA apenas se gateway configurado
        if (waUrl) {
          try {
            const response = await fetch(waUrl, {
              method: 'POST',
              headers: waHeaders,
              body: JSON.stringify({ number: waNumber, text: msg })
            });
            if (response.ok) {
              try {
                await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
              } catch (dbErr) {
                console.error(`Erro ao marcar reminderSent no Firestore para ${b.id}:`, dbErr);
              }
              return { success: true, id: b.id };
            } else {
              console.error(`Erro WA para ${waNumber}:`, await response.text());
              return { success: false, id: b.id };
            }
          } catch (err) {
            console.error(`Erro de rede ao enviar WA para ${waNumber}:`, err);
            return { success: false, id: b.id };
          }
        }
        return { success: false, id: null }; // No gateway
      });

      const results = await Promise.all(waPromises);
      for (const res of results) {
        if (res.id) {
          if (res.success) {
            successCount++;
          } else {
            failCount++;
          }
        }
      }
    }

    // Disparar e-mails de lembrete 24h para amanhã
    let emailSuccessCount = 0;
    let emailFailCount = 0;
    const isLocal = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const hostUrl = `${isLocal ? 'http' : 'https'}://${req.headers.host}`;

    for (const b of tomorrowBookings) {
      if (!b.clientEmail || !b.clientEmail.includes('@') || b.clientEmail === 'Não informado') continue;

      // Verificar opt-out do cliente
      try {
        const phoneKey = b.clientPhone.replace(/\D/g, '');
        const profileDoc = await getDoc(doc(db, 'client_profiles', phoneKey));
        if (profileDoc.exists() && profileDoc.data().unsubscribed === true) {
          console.log(`Ignorando lembrete de e-mail para cliente descadastrado: ${b.clientName} (${b.clientEmail})`);
          continue;
        }
      } catch (err) {
        console.warn('Erro ao checar opt-out:', err);
      }

      const ok = await dispatchEmail({
        type: 'lembrete_24h',
        clientEmail: b.clientEmail,
        clientName: b.clientName,
        subject: `Lembrete: Seu horário é amanhã, ${b.clientName.split(' ')[0]}`,
        date: b.date,
        time: b.time,
        serviceName: b.service?.name || b.serviceName,
        id: b.id,
        servicePrice: b.servicePrice ?? b.service?.price ?? b.price ?? null
      }, hostUrl);

      if (ok) {
        emailSuccessCount++;
        try {
          await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
        } catch (dbErr) {}
      } else {
        emailFailCount++;
      }
      
      // Pausa de segurança de 5 segundos (Titan SMTP limits)
      await sleep(5000);
    }

    return res.status(200).json({
      message: 'Disparos finalizados.',
      todayStr,
      tomorrowStr,
      whatsapp: {
        totalBookings: bookings.length,
        successCount,
        failCount
      },
      emailReminders24h: {
        totalBookings: tomorrowBookings.length,
        successCount: emailSuccessCount,
        failCount: emailFailCount
      }
    });

  } catch (error) {
    console.error('Erro geral no cron-reminders:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.', details: error.message });
  }
}
