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
  console.log("Fixing and cleaning email_01.html (Confirmation)...");
  
  const rawPath = path.join(__dirname, '../email_01.html');
  const cleanPath = path.join(__dirname, '../email_01_clean.html');
  
  if (!fs.existsSync(rawPath)) {
    console.error("email_01.html not found!");
    process.exit(1);
  }
  
  let content = fs.readFileSync(rawPath, 'utf8');
  
  // 1. Replace hardcoded name and values
  content = content.replace(/Marina/g, '{nome}');
  content = content.replace(/Terça, 18 de Junho/g, '{data}');
  content = content.replace(/14h00/g, '{horario}');
  content = content.replace(/terça, 18\/Jun às 14h/g, '{data} às {horario}');
  content = content.replace(/Corte \+ leitura de fio/g, '{servico}');
  content = content.replace(/Rua dos Cacheados, 218 · Caiçara · Belo Horizonte/g, 'Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte');
  content = content.replace(/Rua dos Cacheados, 218 · Caiçara/g, 'Rua Francisco Ovídio, 184 · Caiçara');
  
  // 2. Replace links
  content = replaceLink(content, "Adicionar à agenda", "https://www.ojonquecortou.com.br");
  content = replaceLink(content, "Ver localização", "https://maps.google.com/?q=Rua+Francisco+Ovídio,+184,+Caiçara,+Belo+Horizonte");
  content = replaceLink(content, "Instagram ↗", "https://instagram.com/ojonquecortou");
  content = replaceLink(content, "WhatsApp ↗", "https://wa.me/553135866673");
  content = replaceLink(content, "Google Maps ↗", "https://maps.google.com/?q=Rua+Francisco+Ovídio,+184,+Caiçara,+Belo+Horizonte");
  content = replaceLink(content, "Blog ↗", "https://www.ojonquecortou.com.br/blog");
  content = replaceLink(content, "Descadastrar", "https://ojonquecortou.com.br/api/unsubscribe?email={email}");
  content = replaceLink(content, "Preferências", "https://www.ojonquecortou.com.br");
  
  // 3. Strip data-om-text and data-om-id attributes
  content = content.replace(/\s*data-om-text="[^"]*"/g, '');
  content = content.replace(/\s*data-om-id="[^"]*"/g, '');
  
  // 4. Clean style="..." attributes, resolving mismatched quotes
  const styleRegex = /style="([^"]*)"/g;
  content = content.replace(styleRegex, (match, styleContent) => {
    const safeStyle = styleContent.replace(/&quot;/g, 'BAD_QUOTE');
    const props = safeStyle.split(';');
    const cleanedProps = props.filter(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith('--')) return false;
      if (trimmed.includes('BAD_QUOTE')) return false;
      return true;
    });
    return `style="${cleanedProps.join('; ')}"`;
  });
  
  // Write to email_01_clean.html
  fs.writeFileSync(cleanPath, content);
  console.log("-> email_01_clean.html created and cleaned.");
  
  // 5. Upload to Firestore settings/studio custom_automations.horario_confirmado
  try {
    const updates = {};
    updates['custom_automations.horario_confirmado'] = content;
    await updateDoc(doc(db, 'settings', 'studio'), updates);
    console.log("-> Firestore settings/studio custom_automations.horario_confirmado updated successfully!");
  } catch (err) {
    console.error("-> Error updating Firestore:", err);
  }
}

run().then(() => {
  console.log("Done!");
  process.exit(0);
});
