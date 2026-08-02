import fs from 'fs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

// 1. Read MAILERSEND_API_KEY
let apiKey = process.env.MAILERSEND_API_KEY;
if (!apiKey) {
  try {
    const envContent = fs.readFileSync('.env.vercel.prod', 'utf8');
    const match = envContent.match(/MAILERSEND_API_KEY=["']?([^"'\r\n]+)["']?/);
    if (match) apiKey = match[1];
  } catch (e) {
    console.error('Erro ao ler .env.vercel.prod:', e.message);
  }
}

if (!apiKey) {
  console.error('❌ MAILERSEND_API_KEY não encontrada!');
  process.exit(1);
}

// 2. Firebase Init
const firebaseConfig = {
  apiKey: "AIzaSyBkmKUQs0Nf_oer1Mvwtg_QumzXANX7m0Y",
  authDomain: "ojonque.firebaseapp.com",
  projectId: "ojonque",
  storageBucket: "ojonque.firebasestorage.app",
  messagingSenderId: "108299544531",
  appId: "1:108299544531:web:b0fa221ca26901aae77126"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Load HTML Template
const rawHtml = fs.readFileSync('email_newsletter_finalizacao.html', 'utf8');
const subject = "O erro na finalização que tá roubando a definição do seu cacho";

async function runMassCampaign() {
  console.log("=== INICIANDO CAMPANHA DE NEWSLETTER MAILERSEND ===");
  console.log(`Assunto: ${subject}`);
  console.log("Buscando contatos válidos no Firestore (client_profiles)...");

  const snapshot = await getDocs(collection(db, 'client_profiles'));
  const recipientsMap = new Map();

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    if (d.email && typeof d.email === 'string') {
      const emailClean = d.email.trim().toLowerCase();
      const isValidEmail = emailClean.includes('@') && emailClean.includes('.') && emailClean.length > 5;
      const isSubscribed = d.newsletter !== false && !d.emailInvalid && !d.unsubscribed;

      if (isValidEmail && isSubscribed && !recipientsMap.has(emailClean)) {
        let firstName = (d.name || 'Cliente').trim().split(' ')[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        recipientsMap.set(emailClean, {
          email: emailClean,
          name: firstName
        });
      }
    }
  });

  const recipients = Array.from(recipientsMap.values());
  console.log(`Total de clientes cadastrados analisados: ${snapshot.size}`);
  console.log(`Total de destinatários válidos e elegíveis: ${recipients.length}`);

  if (recipients.length === 0) {
    console.log("Nenhum destinatário elegível encontrado.");
    process.exit(0);
  }

  // MailerSend bulk API supports max 500 emails per request
  const CHUNK_SIZE = 250;
  let totalSent = 0;
  let totalErrors = 0;
  const bulkIds = [];

  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE);
    console.log(`Enviando Lote ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} destinatários)...`);

    const bulkEmails = chunk.map(r => {
      const personalizedHtml = rawHtml.replace(/\{\$name\|default:'tudo bem'\}/g, r.name);
      return {
        from: {
          email: 'contato@ojonquecortou.com.br',
          name: 'O Jon Que Cortou'
        },
        to: [
          {
            email: r.email,
            name: r.name
          }
        ],
        subject: subject,
        html: personalizedHtml
      };
    });

    try {
      const res = await fetch('https://api.mailersend.com/v1/bulk-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkEmails)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Erro HTTP MailerSend no Lote ${Math.floor(i / CHUNK_SIZE) + 1}: ${res.status} ${errText}`);
        totalErrors += chunk.length;
      } else {
        const resData = await res.json();
        const bulkId = resData.bulk_email_id || 'ok';
        bulkIds.push(bulkId);
        totalSent += chunk.length;
        console.log(`✅ Lote ${Math.floor(i / CHUNK_SIZE) + 1} enviado com SUCESSO! ID: ${bulkId}`);
      }
    } catch (err) {
      console.error(`❌ Exceção ao enviar lote:`, err.message);
      totalErrors += chunk.length;
    }

    // Small delay between chunks to respect rate limits
    if (i + CHUNK_SIZE < recipients.length) {
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  console.log("\n==========================================");
  console.log(`RESUMO DO DISPARO EM MASSA:`);
  console.log(`- Sucessos: ${totalSent} e-mails enviados`);
  console.log(`- Falhas: ${totalErrors}`);
  console.log(`- IDs do MailerSend: ${bulkIds.join(', ')}`);
  console.log("==========================================");

  // Log campaign to Firestore
  try {
    await addDoc(collection(db, 'newsletter_sends'), {
      newsletterId: 'newsletter_finalizacao_2026_07',
      subject: subject,
      sentAt: new Date().toISOString(),
      sentCount: totalSent,
      errorsCount: totalErrors,
      bulkIds: bulkIds
    });
    console.log("Registro da campanha salvo com sucesso no Firestore (newsletter_sends).");
  } catch (e) {
    console.warn("Aviso ao salvar log no Firestore:", e.message);
  }

  process.exit(0);
}

runMassCampaign().catch(err => {
  console.error("Erro fatal na execução da campanha:", err);
  process.exit(1);
});
