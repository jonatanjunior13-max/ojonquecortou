/**
 * Disparo da Campanha de Setembro via MailerSend Bulk API
 * Studio do Jon — Especialista em Cachos & Visagismo
 */

import dotenv from 'dotenv';
dotenv.config();

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { HTML_TEMPLATES } from '../src/utils/emailTemplates.js';

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

const apiKey = process.env.MAILERSEND_API_KEY;
if (!apiKey) {
  console.error('❌ MAILERSEND_API_KEY não encontrada no .env!');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('=== DISPARO EM MASSA: CAMPANHA DE SETEMBRO VIA MAILERSEND ===');
  if (isDryRun) console.log('🔍 MODO DRY-RUN: Simulação ativa.\n');

  console.log('1. Autenticando com Firebase...');
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'contato@ojonquecortou.com.br';
  const adminPass = process.env.ADMIN_PASSWORD;
  if (adminPass) {
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      console.log('✅ Firebase autenticado.');
    } catch (e) {
      console.warn('⚠️ Firebase auth:', e.message);
    }
  } else {
    console.warn('⚠️ ADMIN_PASSWORD não configurada no .env.');
  }

  console.log('2. Carregando base de clientes...');
  const clientsMap = new Map();

  try {
    const profilesSnap = await getDocs(collection(db, 'client_profiles'));
    profilesSnap.forEach(d => {
      const data = d.data();
      const phone = (data.phone || d.id || '').replace(/\D/g, '');
      if (phone) {
        clientsMap.set(phone, { id: d.id, ...data, phone });
      }
    });
  } catch (e) {
    console.warn('client_profiles err:', e.message);
  }

  try {
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    bookingsSnap.forEach(d => {
      const b = d.data();
      const phone = (b.clientPhone || '').replace(/\D/g, '');
      if (phone) {
        const existing = clientsMap.get(phone) || {};
        clientsMap.set(phone, {
          ...existing,
          phone,
          name: existing.name || b.clientName || 'Cliente',
          email: existing.email || b.clientEmail || ''
        });
      }
    });
  } catch (e) {
    console.warn('bookings err:', e.message);
  }

  const allClients = Array.from(clientsMap.values());
  console.log(`Total de clientes únicos encontrados: ${allClients.length}`);

  console.log('3. Verificando destinatários que já receberam...');
  const sentEmails = new Set();
  const sentPhones = new Set();
  try {
    const logsSnap = await getDocs(collection(db, 'automation_logs'));
    logsSnap.forEach(d => {
      const data = d.data();
      if (data.stage === 'novo_endereco_setembro') {
        if (data.clientEmail) sentEmails.add(data.clientEmail.toLowerCase().trim());
        if (data.clientPhone) sentPhones.add(data.clientPhone.replace(/\D/g, ''));
      }
    });
  } catch (e) {
    console.warn('logs err:', e.message);
  }

  console.log(`Clientes que já receberam anteriormente: ${sentEmails.size}`);

  const targets = allClients.filter(c => {
    if (!c.email || c.email === 'Não informado' || !c.email.includes('@')) return false;
    if (c.unsubscribed === true) return false;
    const cleanEmail = c.email.trim().toLowerCase();
    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    if (sentEmails.has(cleanEmail) || (cleanPhone && sentPhones.has(cleanPhone))) return false;
    return true;
  });

  console.log(`Destinatários pendentes a enviar agora: ${targets.length}`);
  if (targets.length === 0) {
    console.log('Todos os clientes elegíveis já receberam o e-mail!');
    process.exit(0);
  }

  const template = HTML_TEMPLATES['novo_endereco_setembro'];
  const subject = `O Studio do Jon tá de casa nova (+ um brinde pra você em setembro)`;
  const BATCH_SIZE = 50; // MailerSend bulk chunks
  let totalSent = 0;
  let totalErrors = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(targets.length / BATCH_SIZE);

    console.log(`\nEnviando Lote ${batchNum}/${totalBatches} (${batch.length} destinatários)...`);

    const bulkPayload = batch.map(client => {
      const firstName = (client.name || 'Cliente').split(' ')[0];
      let htmlContent = template.replace(/{nome}/g, firstName);

      const unsubLink = `<div style="text-align: center; padding: 40px 20px 20px; font-size: 11px; color: #666; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Se não deseja mais receber nossos emails, <a href="https://ojonquecortou.com.br/api/unsubscribe?email=${encodeURIComponent(client.email)}" style="color: #888; text-decoration: underline;">clique aqui para descadastrar</a>.
      </div>`;

      if (!htmlContent.includes('/api/unsubscribe')) {
        htmlContent += unsubLink;
      }

      return {
        from: {
          email: 'contato@ojonquecortou.com.br',
          name: 'Studio do Jon'
        },
        to: [
          {
            email: client.email.trim().toLowerCase(),
            name: client.name || firstName
          }
        ],
        subject,
        html: htmlContent
      };
    });

    if (isDryRun) {
      totalSent += batch.length;
      console.log(`  [DRY-RUN] Lote ${batchNum} simulado com sucesso.`);
    } else {
      try {
        const res = await fetch('https://api.mailersend.com/v1/bulk-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bulkPayload)
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          const bulkId = resData.bulk_email_id || 'ok';
          console.log(`  ✅ Lote ${batchNum} aceito pela MailerSend! Bulk ID: ${bulkId}`);
          totalSent += batch.length;

          // Registrar cada envio individualmente no Firestore para controle de duplicação
          for (const c of batch) {
            try {
              await addDoc(collection(db, 'automation_logs'), {
                clientName: c.name || 'Cliente',
                clientPhone: (c.phone || '').replace(/\D/g, ''),
                clientEmail: c.email.trim().toLowerCase(),
                stage: 'novo_endereco_setembro',
                channel: 'mailersend',
                timestamp: serverTimestamp()
              });
            } catch (logErr) {}
          }
        } else {
          totalErrors += batch.length;
          const errText = await res.text();
          console.error(`  ❌ Erro MailerSend Lote ${batchNum} (${res.status}):`, errText);
        }
      } catch (err) {
        totalErrors += batch.length;
        console.error(`  ❌ Erro de rede Lote ${batchNum}:`, err.message);
      }
    }

    if (i + BATCH_SIZE < targets.length) {
      await sleep(1000); // 1s entre lotes
    }
  }

  console.log('\n======================================');
  console.log('RESUMO FINAL DO DISPARO MAILERSEND:');
  console.log(`Total de e-mails enviados: ${totalSent}`);
  console.log(`Falhas: ${totalErrors}`);
  console.log('======================================\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
