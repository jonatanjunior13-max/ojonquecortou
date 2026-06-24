import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, limit, orderBy } from 'firebase/firestore';
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
  console.log('Iniciando cron de auto-post do Google Business Profile');
  
  try {
    const adminEmail = process.env.CRON_FIREBASE_EMAIL;
    const adminPassword = process.env.CRON_FIREBASE_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: 'Faltam credenciais CRON_FIREBASE_EMAIL e PASSWORD.' });
    }

    // Login com a conta de admin para ler o Firestore
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    // Carregar configurações do Studio
    const settingsSnap = await getDoc(doc(db, 'settings', 'studio'));
    if (!settingsSnap.exists()) {
      return res.status(500).json({ error: 'Configurações do Studio não encontradas.' });
    }

    const settings = settingsSnap.data();
    const automations = settings?.automations || {};
    
    // 1. Verificar se a automação de auto-post está ativada
    if (automations.google_posting_enabled === false) {
      console.log('Automação de auto-post do Google Meu Negócio está desativada.');
      return res.status(200).json({ success: true, message: 'Automação desativada.' });
    }

    // 2. Determinar o dia da semana atual no fuso do Brasil (Brasília)
    const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' });
    const weekdayFull = formatter.format(new Date()).toLowerCase();

    let weekday = 'segunda';
    if (weekdayFull.includes('domingo')) weekday = 'domingo';
    else if (weekdayFull.includes('segunda')) weekday = 'segunda';
    else if (weekdayFull.includes('ter') || weekdayFull.includes('terça')) weekday = 'terca';
    else if (weekdayFull.includes('quar') || weekdayFull.includes('quarta')) weekday = 'quarta';
    else if (weekdayFull.includes('quin') || weekdayFull.includes('quinta')) weekday = 'quinta';
    else if (weekdayFull.includes('sex')) weekday = 'sexta';
    else if (weekdayFull.includes('sáb') || weekdayFull.includes('sabado')) weekday = 'sabado';

    const selectedDays = automations.google_posting_days || ['segunda'];
    
    // 3. Verificar se hoje é dia de postagem
    if (!selectedDays.includes(weekday)) {
      console.log(`Hoje (${weekday}) não está selecionado nos dias de publicação automática:`, selectedDays);
      return res.status(200).json({ success: true, message: `Hoje (${weekday}) não é dia de publicação.` });
    }

    // 4. Buscar o post agendado mais antigo
    const postsQuery = query(
      collection(db, 'gbp_posts'),
      where('status', '==', 'scheduled'),
      orderBy('timestamp', 'asc'),
      limit(1)
    );

    const postsSnap = await getDocs(postsQuery);
    if (postsSnap.empty) {
      console.log('Nenhum post agendado com status "scheduled" encontrado.');
      return res.status(200).json({ success: true, message: 'Sem posts agendados na fila.' });
    }

    const postDoc = postsSnap.docs[0];
    const postToPublish = { id: postDoc.id, ...postDoc.data() };

    console.log(`Post encontrado para publicação automática: ${postToPublish.id}`);

    // 5. Chamar a API de publicação real/simulada do GBP
    const isLocal = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const hostUrl = `${protocol}://${req.headers.host}`;

    const gbpRes = await fetch(`${hostUrl}/api/gbp?action=post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: postToPublish.text,
        image: postToPublish.image
      })
    });

    const gbpData = await gbpRes.json();
    if (!gbpRes.ok) {
      throw new Error(`Falha ao publicar no Google: ${gbpData.error || 'Erro desconhecido'}`);
    }

    // 6. Atualizar status do post no Firestore para publicado
    const nowStr = new Date().toLocaleDateString('pt-BR');
    await updateDoc(doc(db, 'gbp_posts', postToPublish.id), {
      status: 'published',
      scheduledDate: `Publicado em ${nowStr}`
    });

    // 7. Adicionar registro no histórico/logs de automação
    const newLog = {
      timestamp: new Date().toISOString(),
      clientName: 'Google Business Profile',
      clientPhone: 'Auto-Post',
      email: '',
      stage: `Publicação automática concluída: "${postToPublish.text.substring(0, 40)}..."`,
      channel: 'google_maps',
      status: 'success'
    };
    await addDoc(collection(db, 'automation_logs'), newLog);

    console.log(`Auto-post publicado e atualizado com sucesso!`);
    return res.status(200).json({
      success: true,
      message: 'Post publicado com sucesso via automação!',
      details: gbpData
    });

  } catch (error) {
    console.error('Erro na execução do cron de auto-post:', error);
    
    // Log de erro no Firestore
    try {
      const newLog = {
        timestamp: new Date().toISOString(),
        clientName: 'Google Business Profile',
        clientPhone: 'Auto-Post',
        email: '',
        stage: `Falha na publicação automática: ${error.message}`,
        channel: 'google_maps',
        status: 'error'
      };
      await addDoc(collection(db, 'automation_logs'), newLog);
    } catch (logErr) {
      console.error('Erro ao registrar log de falha:', logErr);
    }

    return res.status(500).json({ error: 'Erro interno no cron de auto-post.', details: error.message });
  }
}
