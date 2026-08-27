import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

function getFirebase() {
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBkmKUQs0Nf_oer1Mvwtg_QumzXANX7m0Y',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'ojonque.firebaseapp.com',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'ojonque',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'ojonque.firebasestorage.app',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '108299544531',
    appId: process.env.VITE_FIREBASE_APP_ID || '1:108299544531:web:b0fa221ca26901aae77126'
  };
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);
  return { app, db, auth };
}

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
  try {
    const { db, auth } = getFirebase();
    const adminEmail = (process.env.CRON_FIREBASE_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'contato@ojonquecortou.com.br').trim();
    let adminPassword = (process.env.CRON_FIREBASE_PASSWORD || process.env.SMTP_PASS || '7956#Jon!').trim();
    if (adminPassword.startsWith('"') && adminPassword.endsWith('"')) adminPassword = adminPassword.slice(1, -1);

    const candidates = [
      adminPassword,
      adminPassword.endsWith('!') ? adminPassword.slice(0, -1) : `${adminPassword}!`,
      '7956#Jon!',
      '7956#Jon'
    ];
    let authenticated = false;
    for (const pass of candidates) {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, pass);
        authenticated = true;
        break;
      } catch (err) {}
    }

    if (!authenticated) {
      console.error('[Cron Reminders] Falha ao autenticar no Firebase com as credenciais disponíveis.');
      return res.status(500).json({ error: 'Falha na autenticação do Firebase no cron reminders.' });
    }

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

    for (const b of bookings) {
      if (!b.clientPhone) continue;

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
            successCount++;
            try {
              await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
            } catch (dbErr) {
              console.error(`Erro ao marcar reminderSent no Firestore para ${b.id}:`, dbErr);
            }
          } else {
            console.error(`Erro WA para ${waNumber}:`, await response.text());
            failCount++;
          }
        } catch (err) {
          console.error(`Erro de rede ao enviar WA para ${waNumber}:`, err);
          failCount++;
        }
      }
    }

    // 3. ENVIAR LEMBRETES DE WHATSAPP 2 HORAS ANTES (Para o dia de hoje)
    const qToday = query(collection(db, 'bookings'), where('date', '==', todayStr));
    const snapshotToday = await getDocs(qToday);
    const todayBookings = [];
    
    snapshotToday.forEach(doc => {
      const data = doc.data();
      if ((data.status === 'pendente' || data.status === 'confirmado') && !data.reminder2hSent) {
        todayBookings.push({ id: doc.id, ...data });
      }
    });

    const currentMin = now.getHours() * 60 + now.getMinutes();
    const template2h = settings?.waReminder2hTemplate || 'Olá, {cliente}! Passando para lembrar do seu atendimento daqui a pouco, às {hora} ({servico}). Tudo certo?';
    
    let wa2hSuccessCount = 0;
    let wa2hFailCount = 0;

    for (const b of todayBookings) {
      if (!b.clientPhone) continue;
      
      const bookingMin = timeToMin(b.time);
      const diffMin = bookingMin - currentMin;
      
      // Janela de disparo: de 110 a 145 minutos (aprox. 2h de antecedência)
      if (diffMin >= 110 && diffMin <= 145) {
        const cancelLink = `https://www.ojonquecortou.com.br/cancelar?id=${b.id}`;
        let msg = template2h
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

        if (waUrl) {
          try {
            const response = await fetch(waUrl, {
              method: 'POST',
              headers: waHeaders,
              body: JSON.stringify({ number: waNumber, text: msg })
            });
            if (response.ok) {
              wa2hSuccessCount++;
              try {
                await updateDoc(doc(db, 'bookings', b.id), { reminder2hSent: true });
              } catch (dbErr) {
                console.error(`Erro ao marcar reminder2hSent no Firestore para ${b.id}:`, dbErr);
              }
            } else {
              console.error(`Erro WA 2h para ${waNumber}:`, await response.text());
              wa2hFailCount++;
            }
          } catch (err) {
            console.error(`Erro de rede ao enviar WA 2h para ${waNumber}:`, err);
            wa2hFailCount++;
          }
        }
      }
    }

    // 4. DISPARAR E-MAILS DE LEMBRETE 24H (Para amanhã)
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
      whatsapp2h: {
        totalBookings: todayBookings.length,
        successCount: wa2hSuccessCount,
        failCount: wa2hFailCount
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
