/**
 * Script de Envio de Notificação via WhatsApp para Clientes Agendados
 * Studio do Jon — Mudança de Endereço a partir de 02/09/2026
 * 
 * Uso: node scripts/notificar-agendamentos-whatsapp.js [--dry-run]
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const isDryRun = process.argv.includes('--dry-run');

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BASE_WA_MSG = `Oi {nome}! Passando pra te dar um aviso importante sobre o seu agendamento no Studio do Jon:

A partir do dia 02/09, nossos atendimentos estão de casa nova!

📍 Novo endereço: Rua Belmiro Braga, 544 · Caiçaras, BH
(Fica pertinho do endereço anterior, com mais conforto e a mesma leitura de sempre).

🗺️ Como chegar pelo Google Maps:
https://www.google.com/maps/search/?api=1&query=O+Jon+que+Cortou+Rua+Belmiro+Braga+544+Cai%C3%A7aras+Belo+Horizonte

Seu dia e horário continuam exatamente os mesmos combinados. Se tiver qualquer dúvida sobre como chegar, é só me chamar por aqui.

Te espero na casa nova! TMJ e aquele abraço,
Jon`;

async function run() {
  console.log('=== DISPARO DE WHATSAPP: CLIENTES AGENDADOS (SETEMBRO/2026) ===');
  if (isDryRun) console.log('🔍 MODO DRY-RUN ATIVO: Nenhuma mensagem real será enviada.\n');

  console.log('1. Autenticando com Firebase...');
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'contato@ojonquecortou.com.br';
  const adminPass = process.env.ADMIN_PASSWORD || '7956#Jon';
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    console.log('✅ Autenticado no Firebase.');
  } catch (e) {
    console.warn('⚠️ Autenticação anônima/padrão:', e.message);
  }

  console.log('2. Obtendo configurações da Evolution API...');
  const studioSnap = await getDoc(doc(db, 'settings', 'studio'));
  const studioData = studioSnap.data() || {};

  const evolutionApiUrl = studioData.evolutionApiUrl || 'https://evolution-api-production-1e65.up.railway.app';
  const evolutionApiKey = studioData.evolutionApiKey || '';
  const evolutionInstanceName = studioData.evolutionInstanceName || 'JonStudio';

  const sendTextUrl = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${evolutionInstanceName}`;

  console.log('3. Buscando agendamentos a partir de 02/09/2026...');
  const bookingsSnap = await getDocs(collection(db, 'bookings'));
  const allBookings = [];
  bookingsSnap.forEach(d => allBookings.push({ id: d.id, ...d.data() }));

  const cutoff = '2026-09-02';
  const upcoming = allBookings.filter(b => {
    if (!b.date || b.date < cutoff) return false;
    if (b.status === 'cancelled' || b.status === 'canceled' || b.status === 'blocked' || b.isBlock) return false;
    if (!b.clientPhone || b.clientPhone.replace(/\D/g, '').length < 8) return false;
    return true;
  }).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));

  console.log(`Total de agendamentos futuros encontrados: ${upcoming.length}`);

  console.log('4. Verificando notificações anteriores de WhatsApp...');
  const sentBookings = new Set();
  try {
    const logsSnap = await getDocs(collection(db, 'automation_logs'));
    logsSnap.forEach(d => {
      const l = d.data();
      if (l.stage === 'novo_endereco_whatsapp' && (l.bookingId || l.clientPhone)) {
        if (l.bookingId) sentBookings.add(l.bookingId);
        if (l.clientPhone) sentBookings.add(l.clientPhone);
      }
    });
  } catch (e) {
    console.warn('Erro ao carregar logs:', e.message);
  }

  const targets = upcoming.filter(b => !sentBookings.has(b.id) && !sentBookings.has(b.clientPhone.replace(/\D/g, '')));
  console.log(`Agendamentos pendentes de notificação: ${targets.length}\n`);

  if (targets.length === 0) {
    console.log('Todos os clientes agendados já foram notificados anteriormente!');
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const b = targets[i];
    const firstName = (b.clientName || 'Cliente').split(' ')[0];
    const cleanPhone = b.clientPhone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const msg = BASE_WA_MSG.replace(/{nome}/g, firstName);

    console.log(`[${i + 1}/${targets.length}] Notificando ${b.clientName} (${b.date} às ${b.time}) - Tel: ${waNumber}...`);

    if (isDryRun) {
      successCount++;
    } else {
      try {
        const res = await fetch(sendTextUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            number: waNumber,
            text: msg
          })
        });

        if (res.ok) {
          successCount++;
          console.log(`   ✅ Enviado com sucesso via WhatsApp!`);
          try {
            await addDoc(collection(db, 'automation_logs'), {
              bookingId: b.id,
              clientName: b.clientName || 'Cliente',
              clientPhone: cleanPhone,
              stage: 'novo_endereco_whatsapp',
              channel: 'whatsapp',
              timestamp: serverTimestamp()
            });
          } catch (logErr) {}
        } else {
          failCount++;
          const errBody = await res.text();
          console.error(`   ❌ Falha no envio (${res.status}): ${errBody}`);
        }
      } catch (err) {
        failCount++;
        console.error(`   ❌ Erro de rede: ${err.message}`);
      }
    }

    if (i < targets.length - 1) {
      await sleep(1500); // Pausa de 1.5s entre mensagens para segurança anti-spam
    }
  }

  console.log('\n======================================');
  console.log(`RESUMO DO ENVIO DE WHATSAPP:`);
  console.log(`Sucesso: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
  console.log('======================================\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
