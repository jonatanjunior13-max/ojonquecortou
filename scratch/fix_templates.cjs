const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

// Load environment variables manually from .env file
const envPath = path.join(__dirname, '../.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.trim().split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      envConfig[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function replaceLink(html, textSubstring, newUrl) {
  const regex = new RegExp(`(<a\\s+[^>]*href=")#("[^>]*>[\\s\\S]*?${textSubstring}[\\s\\S]*?<\\/a>)`, 'gi');
  return html.replace(regex, `$1${newUrl}$2`);
}

async function run() {
  console.log("Fixing templates...");

  // 1. Fix email_00_clean.html (Waiting pre-booking email)
  const file00Path = path.join(__dirname, '../email_00_clean.html');
  if (fs.existsSync(file00Path)) {
    let content = fs.readFileSync(file00Path, 'utf8');
    
    // Fix split {Nome} tags
    const splitRegex = /\{<\/span>(<span[^>]+>)Nome(<\/span>)(<span[^>]+>)\}/g;
    content = content.replace(splitRegex, '</span>$1{nome}$2$3');
    
    // Fix hardcoded date, time and service
    content = content.replace(/Terça, 18 de Junho/g, '{data}');
    content = content.replace(/14h00/g, '{horario}');
    content = content.replace(/Corte \+ leitura de fio/g, '{servico}');

    // Fix links
    content = replaceLink(content, "Falar com o Jon no WhatsApp", "https://wa.me/553135866673");
    content = replaceLink(content, "Sugerir outro horário", "https://www.ojonquecortou.com.br/agendar");
    content = replaceLink(content, "Instagram ↗", "https://instagram.com/ojonquecortou");
    content = replaceLink(content, "WhatsApp ↗", "https://wa.me/553135866673");
    content = replaceLink(content, "Google Maps ↗", "https://maps.google.com/?q=Rua+Francisco+Ovídio,+184,+Caiçara,+Belo+Horizonte");
    content = replaceLink(content, "Blog ↗", "https://www.ojonquecortou.com.br/blog");
    content = replaceLink(content, "Descadastrar", "https://ojonquecortou.com.br/api/unsubscribe?email={email}");
    content = replaceLink(content, "Preferências", "https://www.ojonquecortou.com.br");

    fs.writeFileSync(file00Path, content);
    console.log("-> email_00_clean.html fixed.");
  }

  // 2. Fix email_02_clean.html (Lembrete 24h)
  const file02Path = path.join(__dirname, '../email_02_clean.html');
  if (fs.existsSync(file02Path)) {
    let content = fs.readFileSync(file02Path, 'utf8');

    // Fix hardcoded time
    content = content.replace(/Amanhã às 14h/g, 'Amanhã às {horario}');
    content = content.replace(/às 14h\./g, 'às {horario}.');

    // Fix links
    content = replaceLink(content, "Chamar no WhatsApp", "https://wa.me/553135866673");
    content = replaceLink(content, "Preciso reagendar", "https://www.ojonquecortou.com.br/agendar");
    content = replaceLink(content, "Preferências", "https://www.ojonquecortou.com.br");

    fs.writeFileSync(file02Path, content);
    console.log("-> email_02_clean.html fixed.");
  }

  // 3. Fix email_06_clean.html (Reativação)
  const file06Path = path.join(__dirname, '../email_06_clean.html');
  if (fs.existsSync(file06Path)) {
    let content = fs.readFileSync(file06Path, 'utf8');

    // Fix hardcoded name and month
    content = content.replace(/Marina, seu último corte aqui foi em Janeiro/g, '{nome}, seu último corte aqui já faz cerca de 5 meses');

    // Fix links
    content = replaceLink(content, "Marcar pelo WhatsApp", "https://wa.me/553135866673");
    content = replaceLink(content, "Ver agenda completa", "https://www.ojonquecortou.com.br/agendar");
    content = replaceLink(content, "Preferências", "https://www.ojonquecortou.com.br");

    fs.writeFileSync(file06Path, content);
    console.log("-> email_06_clean.html fixed.");
  }

  // 4. Update Firestore settings/studio custom_automations
  try {
    const updates = {};
    if (fs.existsSync(file00Path)) {
      updates['custom_automations.solicitacao_recebida'] = fs.readFileSync(file00Path, 'utf8');
    }
    if (fs.existsSync(file02Path)) {
      updates['custom_automations.lembrete_24h'] = fs.readFileSync(file02Path, 'utf8');
    }
    if (fs.existsSync(file06Path)) {
      updates['custom_automations.reativacao_5_meses'] = fs.readFileSync(file06Path, 'utf8');
    }

    await updateDoc(doc(db, 'settings', 'studio'), updates);
    console.log("-> Firestore settings/studio document updated successfully with fixed templates!");
  } catch (err) {
    console.error("-> Error updating Firestore:", err);
  }
}

run().then(() => {
  console.log("Done!");
  process.exit(0);
});
