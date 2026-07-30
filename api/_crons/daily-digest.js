import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import nodemailer from 'nodemailer';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

let app, db, auth;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error('Erro ao inicializar Firebase:', e);
}

// ── helpers ────────────────────────────────────────────────────────────────────

function ptWeekday(date) {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[date.getDay()];
}

function ptMonthShort(monthIndex) {
  return ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][monthIndex];
}

function formatBrDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getTomorrowInBrasilia() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const day = parseInt(parts.find(p => p.type === 'day').value, 10);
  const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
  const year = parseInt(parts.find(p => p.type === 'year').value, 10);
  
  // Construct a date at 12:00 PM today in UTC to avoid daylight saving and timezone shift issues, then add 1 day
  const todayBr = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const tomorrowBr = new Date(todayBr.getTime() + 24 * 60 * 60 * 1000);
  
  const tomorrowParts = formatter.formatToParts(tomorrowBr);
  const tomorrowDay = tomorrowParts.find(p => p.type === 'day').value;
  const tomorrowMonth = tomorrowParts.find(p => p.type === 'month').value;
  const tomorrowYear = tomorrowParts.find(p => p.type === 'year').value;
  
  const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long'
  });
  let weekdayName = weekdayFormatter.format(tomorrowBr);
  weekdayName = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
  
  const monthName = ptMonthShort(parseInt(tomorrowMonth, 10) - 1);
  
  return {
    isoStr: `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`,
    display: `${weekdayName}, ${parseInt(tomorrowDay, 10)} de ${monthName} de ${tomorrowYear}`,
    dayNumber: parseInt(tomorrowDay, 10),
    monthName,
    year: tomorrowYear,
    weekday: weekdayName,
    jsDate: tomorrowBr
  };
}

function statusLabel(status) {
  const map = {
    pendente: { label: 'Pendente', color: '#b07d2a', bg: '#FFF8EB' },
    confirmado: { label: 'Confirmado', color: '#2a7d4b', bg: '#EDFAF4' },
    finalizado: { label: 'Finalizado', color: '#4B5563', bg: '#F3F4F6' },
    cancelado: { label: 'Cancelado', color: '#991B1B', bg: '#FEF2F2' },
    faltou: { label: 'Falta', color: '#6B21A8', bg: '#F5F3FF' },
  };
  return map[status] || { label: status, color: '#4B5563', bg: '#F9FAFB' };
}

// ── email template ─────────────────────────────────────────────────────────────

function buildDigestEmail(bookings, tomorrow) {
  const activeBookings = bookings.filter(b => b.status !== 'cancelado' && b.status !== 'faltou');
  const pendingCount = bookings.filter(b => b.status === 'pendente').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmado').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelado').length;
  const total = bookings.length;

  // Sort by time
  const sorted = [...activeBookings].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Build appointment rows
  const apptRows = sorted.length === 0
    ? `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #8A7866; font-size: 14px; font-style: italic;">Nenhum agendamento ativo para amanhã</td></tr>`
    : sorted.map((b, i) => {
        const st = statusLabel(b.status);
        const serviceName = b.service?.name || b.serviceName || '—';
        const clientName = b.clientName || 'Cliente';
        const phone = b.clientPhone ? b.clientPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : '—';
        const isLast = i === sorted.length - 1;
        return `
          <tr style="border-bottom: ${isLast ? 'none' : '1px solid rgba(26, 19, 16, 0.06)'};">
            <td style="padding: 14px 16px; vertical-align: middle; white-space: nowrap;">
              <span style="font-size: 16px; font-weight: 700; color: #1A1310; font-family: Georgia, serif;">${b.time || '—'}</span>
            </td>
            <td style="padding: 14px 12px; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 600; color: #1A1310;">${clientName}</div>
              <div style="font-size: 12px; color: #8A7866;">${phone}</div>
            </td>
            <td style="padding: 14px 12px; vertical-align: middle;">
              <div style="font-size: 13px; color: #2E241E;">${serviceName}</div>
              ${b.duration ? `<div style="font-size: 11px; color: #8A7866;">${b.duration} min</div>` : ''}
            </td>
            <td style="padding: 14px 12px 14px 8px; vertical-align: middle; text-align: right; white-space: nowrap;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; background-color: ${st.bg}; color: ${st.color};">${st.label}</span>
            </td>
          </tr>
        `;
      }).join('');

  const cancelledRows = bookings.filter(b => b.status === 'cancelado').length > 0
    ? `<div style="margin-top: 12px; font-size: 12px; color: #8A7866; text-align: center;">${cancelledCount} agendamento${cancelledCount > 1 ? 's' : ''} cancelado${cancelledCount > 1 ? 's' : ''} para amanhã não listado${cancelledCount > 1 ? 's' : ''} acima.</div>`
    : '';

  const noneMessage = total === 0
    ? `<div style="padding: 32px; text-align: center; font-size: 15px; color: #8A7866; font-style: italic; font-family: Georgia, serif;">Nenhum agendamento para amanhã.</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agenda de Amanhã — Studio do Jon</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EFE5D2; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1310; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFE5D2" style="background-color: #EFE5D2;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF5E8" style="max-width: 640px; background-color: #FAF5E8; border-radius: 10px; overflow: hidden; border: 1px solid rgba(26,19,16,0.1); box-shadow: 0 4px 24px rgba(26,19,16,0.1);">

          <!-- ── Header ── -->
          <tr>
            <td style="padding: 28px 40px 24px 40px; border-bottom: 1px solid rgba(26,19,16,0.08);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left">
                    <span style="display: inline-block; width: 34px; height: 34px; border-radius: 50%; background-color: #1A1310; color: #FAF5E8; text-align: center; line-height: 34px; font-size: 18px; font-weight: bold; font-style: italic; font-family: Georgia, serif; vertical-align: middle;">J</span>
                    <span style="display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #1A1310; margin-left: 10px; vertical-align: middle; font-family: 'Manrope', sans-serif;">Studio do Jon</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #C97B49;">Resumo do Dia</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Date hero ── -->
          <tr>
            <td style="padding: 36px 40px 28px 40px; background: linear-gradient(135deg, #1A1310 0%, #2E241E 100%);">
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #C97B49; margin-bottom: 10px;">Agenda de Amanhã</div>
              <div style="font-size: 36px; font-family: Georgia, serif; font-style: italic; color: #FAF5E8; line-height: 1.1; margin-bottom: 6px;">${tomorrow.weekday}</div>
              <div style="font-size: 16px; color: rgba(250,245,232,0.6); font-weight: 400;">${tomorrow.dayNumber} de ${tomorrow.monthName} de ${tomorrow.year}</div>
            </td>
          </tr>

          <!-- ── Stats bar ── -->
          <tr>
            <td style="padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 20px 0; text-align: center; width: 25%; border-right: 1px solid rgba(26,19,16,0.06);">
                    <div style="font-size: 28px; font-weight: 700; font-family: Georgia, serif; color: #1A1310;">${total}</div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A7866; font-weight: 600; margin-top: 3px;">Total</div>
                  </td>
                  <td style="padding: 20px 0; text-align: center; width: 25%; border-right: 1px solid rgba(26,19,16,0.06);">
                    <div style="font-size: 28px; font-weight: 700; font-family: Georgia, serif; color: #2a7d4b;">${confirmedCount}</div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A7866; font-weight: 600; margin-top: 3px;">Confirmados</div>
                  </td>
                  <td style="padding: 20px 0; text-align: center; width: 25%; border-right: 1px solid rgba(26,19,16,0.06);">
                    <div style="font-size: 28px; font-weight: 700; font-family: Georgia, serif; color: #b07d2a;">${pendingCount}</div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A7866; font-weight: 600; margin-top: 3px;">Pendentes</div>
                  </td>
                  <td style="padding: 20px 0; text-align: center; width: 25%;">
                    <div style="font-size: 28px; font-weight: 700; font-family: Georgia, serif; color: #991B1B;">${cancelledCount}</div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A7866; font-weight: 600; margin-top: 3px;">Cancelados</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Separator ── -->
          <tr><td style="height: 1px; background-color: rgba(26,19,16,0.08); padding: 0;"></td></tr>

          <!-- ── Appointments table ── -->
          <tr>
            <td style="padding: 24px 40px 8px 40px;">
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #C97B49; margin-bottom: 16px;">Horários do Dia</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              ${noneMessage}
              ${total > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid rgba(26,19,16,0.08); border-radius: 8px; overflow: hidden; background-color: #fff;">
                <thead>
                  <tr style="background-color: #F5EDDB;">
                    <th style="padding: 10px 16px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #8A7866; border-bottom: 1px solid rgba(26,19,16,0.08);">Horário</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #8A7866; border-bottom: 1px solid rgba(26,19,16,0.08);">Cliente</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #8A7866; border-bottom: 1px solid rgba(26,19,16,0.08);">Serviço</th>
                    <th style="padding: 10px 12px 10px 8px; text-align: right; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #8A7866; border-bottom: 1px solid rgba(26,19,16,0.08);">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${apptRows}
                </tbody>
              </table>
              ${cancelledRows}
              ` : ''}
            </td>
          </tr>

          <!-- ── CTA button ── -->
          <tr>
            <td style="padding: 8px 40px 32px 40px; text-align: center;">
              <a href="https://www.ojonquecortou.com.br/admin" style="display: inline-block; padding: 12px 28px; background-color: #1A1310; color: #FAF5E8 !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;">Abrir Painel Admin →</a>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding: 22px 40px; background-color: #F5EDDB; border-top: 1px solid rgba(26,19,16,0.08); text-align: center;">
              <div style="font-size: 13px; font-weight: 600; color: #1A1310; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
                Studio do Jon <span style="font-style: italic; font-weight: 400; color: #C97B49; font-family: Georgia, serif; text-transform: none; letter-spacing: normal;">— corte com leitura.</span>
              </div>
              <div style="font-size: 11px; color: #6B5A4B; line-height: 1.7;">
                Rua Francisco Ovídio, 184 · Caiçaras · Belo Horizonte · MG<br>
                Quarta a Sábado · 9h às 19h
              </div>
              <div style="margin-top: 14px; font-size: 10px; color: #8A7866; text-transform: uppercase; letter-spacing: 0.08em;">
                © ${new Date().getFullYear()} Studio do Jon · Resumo automático
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── handler ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  try {
    const adminEmail = (process.env.CRON_FIREBASE_EMAIL || '').trim();
    const adminPassword = (process.env.CRON_FIREBASE_PASSWORD || '').trim();
    const recipientEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || '').trim();

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: 'Faltam credenciais CRON_FIREBASE_EMAIL / CRON_FIREBASE_PASSWORD.' });
    }

    if (!recipientEmail) {
      return res.status(500).json({ error: 'Falta ADMIN_NOTIFICATION_EMAIL ou SMTP_USER para enviar o resumo.' });
    }

    // Autenticar no Firebase
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    // Calcular data de amanhã no fuso de Brasília
    const tomorrow = getTomorrowInBrasilia();

    // Buscar TODOS os agendamentos de amanhã (independente de status)
    const q = query(collection(db, 'bookings'), where('date', '==', tomorrow.isoStr));
    const snapshot = await getDocs(q);
    const bookings = [];
    snapshot.forEach(d => {
      bookings.push({ id: d.id, ...d.data() });
    });

    // Montar e-mail
    const html = buildDigestEmail(bookings, tomorrow);
    const subject = `📅 Agenda de amanhã — ${tomorrow.weekday}, ${tomorrow.dayNumber} de ${tomorrow.monthName}`;

    // Configuração SMTP
    const sanitizeEnv = (val, fallback = '') => val ? String(val).replace(/[\r\n"']/g, '').trim() : fallback;
    const cleanEmail = (str) => {
      if (!str) return 'contato@ojonquecortou.com.br';
      const m = str.match(/<([^>]+)>/) || str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return m ? m[1].replace(/[\r\n"']/g, '').trim() : str.replace(/[\r\n"']/g, '').trim();
    };

    const smtpHost = sanitizeEnv(process.env.SMTP_HOST, 'smtp.titan.email');
    const smtpPort = sanitizeEnv(process.env.SMTP_PORT, '465');
    const smtpSecure = sanitizeEnv(process.env.SMTP_SECURE) === 'true' || smtpPort === '465';
    const smtpUser = sanitizeEnv(process.env.SMTP_USER, 'contato@ojonquecortou.com.br');
    const smtpPass = sanitizeEnv(process.env.SMTP_PASS, '7956#Jon!');
    const smtpFrom = cleanEmail(process.env.SMTP_FROM || 'contato@ojonquecortou.com.br');

    if (!smtpHost || !smtpUser || !smtpPass) {
      // Em ambiente de dev/preview, apenas loga
      console.log('[cron-daily-digest] SMTP não configurado. Resumo que seria enviado:', { subject, totalBookings: bookings.length, recipient: recipientEmail });
      return res.status(200).json({ success: true, simulated: true, subject, totalBookings: bookings.length });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"Studio do Jon" <${smtpFrom}>`,
      to: cleanEmail(recipientEmail),
      subject,
      html
    });

    console.log(`[cron-daily-digest] Resumo enviado para ${recipientEmail}. Agendamentos: ${bookings.length}`);
    return res.status(200).json({
      success: true,
      subject,
      recipient: recipientEmail,
      tomorrowDate: tomorrow.isoStr,
      totalBookings: bookings.length
    });

  } catch (error) {
    console.error('[cron-daily-digest] Erro:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.', details: error.message });
  }
}
