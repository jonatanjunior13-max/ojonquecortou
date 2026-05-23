import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
    const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = formatter.formatToParts(new Date());
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const todayStr = `${year}-${month}-${day}`;

    // Buscar agendamentos de hoje
    const q = query(collection(db, 'bookings'), where('date', '==', todayStr));
    const snapshot = await getDocs(q);

    const bookings = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filtrar confirmados e pendentes
      if (data.status === 'pendente' || data.status === 'confirmado') {
        bookings.push({ id: doc.id, ...data });
      }
    });

    if (bookings.length === 0) {
      return res.status(200).json({ message: 'Nenhum agendamento pendente ou confirmado para hoje.', todayStr });
    }

    // Obter as configurações do painel para ler as credenciais da Evolution API
    const settingsDoc = await getDoc(doc(db, 'settings', 'studio'));
    const settings = settingsDoc.exists() ? settingsDoc.data() : null;

    if (!settings || !settings.waReminderEnabled) {
      return res.status(200).json({ message: 'Lembretes automáticos estão desativados no painel.' });
    }

    const gateway = settings.waReminderGateway || 'zapi';
    let url = '';
    let headers = {
      'Content-Type': 'application/json'
    };

    if (gateway === 'evolution') {
      if (!settings.evolutionApiUrl || !settings.evolutionApiKey || !settings.evolutionInstanceName) {
        return res.status(500).json({ error: 'Faltam credenciais da Evolution API nas configurações.' });
      }
      url = `${settings.evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${settings.evolutionInstanceName}`;
      headers['apikey'] = settings.evolutionApiKey;
    } else {
      return res.status(400).json({ error: 'O Cron job atualmente foi otimizado para Evolution API.' });
    }

    const template = settings.waReminderTemplate || 'Olá, {cliente}! Passando para lembrar do seu horário hoje ({data} às {hora}) para o serviço: {servico}.';

    let successCount = 0;
    let failCount = 0;

    for (const b of bookings) {
      if (!b.clientPhone) continue;

      let msg = template
        .replace('{cliente}', b.clientName.split(' ')[0])
        .replace('{data}', b.date.split('-').reverse().join('/'))
        .replace('{hora}', b.time)
        .replace('{servico}', b.service?.name || b.serviceName);

      const phoneNum = b.clientPhone.replace(/\D/g, '');
      const waNumber = phoneNum.startsWith('55') ? phoneNum : `55${phoneNum}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            number: waNumber,
            text: msg
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          console.error(`Erro ao enviar para ${waNumber}:`, await response.text());
          failCount++;
        }
      } catch (err) {
        console.error(`Erro de rede ao enviar para ${waNumber}:`, err);
        failCount++;
      }
    }

    return res.status(200).json({
      message: 'Disparos finalizados.',
      todayStr,
      totalBookings: bookings.length,
      successCount,
      failCount
    });

  } catch (error) {
    console.error('Erro geral no cron-reminders:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.', details: error.message });
  }
}
