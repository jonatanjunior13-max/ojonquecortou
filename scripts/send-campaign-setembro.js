/**
 * Script de Disparo da Campanha de Novo Endereço & Ação de Setembro
 * Studio do Jon — Especialista em Cachos & Visagismo
 * 
 * Uso: node scripts/send-campaign-setembro.js [--dry-run]
 */

import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('=== DISPARO DE E-MAILS: CAMPANHA NOVO ENDEREÇO & BRINDE DE SETEMBRO ===');
  if (isDryRun) console.log('🔍 MODO DRY-RUN: Simulação ativa. Nenhum e-mail real será enviado.');

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'contato@ojonquecortou.com.br';
  const adminPass = process.env.ADMIN_PASSWORD || '7956#Jon';
  
  console.log('1. Autenticando com Firebase...');
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    console.log('✅ Autenticado com sucesso no Firebase.');
  } catch (authErr) {
    console.warn('⚠️ Autenticação anônima ou padrão:', authErr.message);
  }

  // Configuração SMTP
  const smtpHost = process.env.SMTP_HOST || 'smtp.titan.email';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER || 'contato@ojonquecortou.com.br';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || 'contato@ojonquecortou.com.br';

  let transporter = null;
  if (!isDryRun) {
    console.log('2. Conectando ao servidor SMTP...');
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      pool: true,
      maxConnections: 3,
      maxMessages: 50
    });
    try {
      await transporter.verify();
      console.log('✅ Conexão SMTP verificada com sucesso.');
    } catch (smtpErr) {
      console.error('❌ Falha ao verificar SMTP:', smtpErr.message);
      process.exit(1);
    }
  }

  console.log('3. Carregando clientes do Firestore (client_profiles + bookings)...');
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
    console.warn('client_profiles snap err:', e.message);
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
    console.warn('bookings snap err:', e.message);
  }

  const allClients = Array.from(clientsMap.values());
  console.log(`Total de clientes únicos encontrados: ${allClients.length}`);

  console.log('4. Verificando envios anteriores da campanha...');
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
    console.warn('logs snap err:', e.message);
  }

  const targets = allClients.filter(c => {
    if (!c.email || c.email === 'Não informado' || !c.email.includes('@')) return false;
    if (c.unsubscribed === true) return false;
    const cleanEmail = c.email.trim().toLowerCase();
    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    if (sentEmails.has(cleanEmail) || (cleanPhone && sentPhones.has(cleanPhone))) return false;
    return true;
  });

  console.log(`Clientes elegíveis para envio: ${targets.length}`);
  if (targets.length === 0) {
    console.log('Todos os clientes já receberam o e-mail da campanha!');
    process.exit(0);
  }

  const BATCH_SIZE = 10;
  const BATCH_DELAY = 1500;
  const INDIVIDUAL_DELAY = 100;
  const template = HTML_TEMPLATES['novo_endereco_setembro'];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const client = targets[i];
    const firstName = (client.name || 'Cliente').split(' ')[0];
    const subject = `O Studio do Jon tá de casa nova (+ um brinde pra você em setembro)`;
    
    let htmlContent = template.replace(/{nome}/g, firstName);
    
    const unsubLink = `<div style="text-align: center; padding: 40px 20px 20px; font-size: 11px; color: #666; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Se não deseja mais receber nossos emails, <a href="https://ojonquecortou.com.br/api/unsubscribe?email=${encodeURIComponent(client.email)}" style="color: #888; text-decoration: underline;">clique aqui para descadastrar</a>.
    </div>`;

    if (!htmlContent.includes('/api/unsubscribe')) {
      htmlContent += unsubLink;
    }

    console.log(`[${i + 1}/${targets.length}] Enviando para ${client.name} <${client.email}>...`);

    if (isDryRun) {
      successCount++;
    } else {
      try {
        const mailOptions = {
          from: `"Studio do Jon" <${smtpFrom}>`,
          to: client.email.trim(),
          subject,
          html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        successCount++;

        try {
          await addDoc(collection(db, 'automation_logs'), {
            clientName: client.name || 'Cliente',
            clientPhone: (client.phone || '').replace(/\D/g, ''),
            clientEmail: client.email.trim().toLowerCase(),
            stage: 'novo_endereco_setembro',
            channel: 'email',
            timestamp: serverTimestamp()
          });
        } catch (logErr) {}
      } catch (err) {
        failCount++;
        console.error(`❌ Erro no envio para ${client.email}:`, err.message);
      }
    }

    if (i < targets.length - 1) {
      if ((i + 1) % BATCH_SIZE === 0) {
        console.log(`⏳ Pausa de segurança de ${BATCH_DELAY / 1000}s entre lotes... (Progresso: ${i + 1}/${targets.length})`);
        await sleep(BATCH_DELAY);
      } else {
        await sleep(INDIVIDUAL_DELAY);
      }
    }
  }

  console.log('\n======================================');
  console.log('RESUMO DO DISPARO DE E-MAILS:');
  console.log(`Sucesso: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
  console.log('======================================\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
