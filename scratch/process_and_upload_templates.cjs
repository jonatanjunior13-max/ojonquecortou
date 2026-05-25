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

const whitelist = new Set([
  'background', 'background-color', 'color', 
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'width', 'height', 'max-width', 'min-width', 'max-height', 'min-height',
  'border', 'border-radius', 'border-color', 'border-width', 'border-style', 
  'border-top', 'border-bottom', 'border-left', 'border-right',
  'display', 'flex-direction', 'align-items', 'justify-content', 'flex', 'flex-wrap',
  'box-sizing', 'text-align', 'text-decoration',
  'position', 'top', 'left', 'right', 'bottom',
  'opacity', 'vertical-align', 'list-style', 'line-break', 'white-space',
  'text-transform', 'flex-grow', 'flex-shrink', 'flex-basis', 'border-collapse',
  'box-shadow', 'cursor', 'word-break', 'overflow', 'text-overflow'
]);

function replaceLink(html, textSubstring, newUrl) {
  const regex = new RegExp(`(<a\\s+[^>]*href=")[^"]*("[^>]*>[\\s\\S]*?${textSubstring}[\\s\\S]*?<\\/a>)`, 'gi');
  return html.replace(regex, `$1${newUrl}$2`);
}

function processTemplate(filePath, title, typeKey) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }
  
  let html = fs.readFileSync(filePath, 'utf8');
  
  // 1. Extract mail-stage tag and inner mail-body
  const mailStageStart = html.indexOf('<div class="mail-stage');
  if (mailStageStart === -1) {
    throw new Error(`No mail-stage found in ${filePath}`);
  }
  const mailStageTagEnd = html.indexOf('>', mailStageStart) + 1;
  const mailStageTag = html.substring(mailStageStart, mailStageTagEnd);
  
  const mailBodyStart = html.indexOf('class="mail-body');
  if (mailBodyStart === -1) {
    throw new Error(`No mail-body found in ${filePath}`);
  }
  const divStart = html.lastIndexOf('<div', mailBodyStart);
  const bodyEnd = html.indexOf('</body>');
  if (bodyEnd === -1) {
    throw new Error(`No </body> tag found in ${filePath}`);
  }
  
  let bodyContent = html.substring(divStart, bodyEnd).trim();
  // Close the two divs (mail-body and mail-stage) at the end
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*$/, '</div></div>');
  
  // 2. Clean element attributes
  // Strip data-om attributes
  bodyContent = bodyContent.replace(/\s*data-om-text="[^"]*"/g, '');
  bodyContent = bodyContent.replace(/\s*data-om-id="[^"]*"/g, '');
  
  // Whitelist styles
  const styleRegex = /style="([^"]*)"/gi;
  bodyContent = bodyContent.replace(styleRegex, (match, styleContent) => {
    const normalized = styleContent.replace(/&quot;/g, "'");
    const props = normalized.split(';');
    const cleaned = props.filter(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return false;
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return false;
      const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
      return whitelist.has(key);
    });
    return `style="${cleaned.join('; ')}"`;
  });
  
  // Clean style on mailStageTag too
  const cleanMailStageTag = mailStageTag.replace(styleRegex, (match, styleContent) => {
    const normalized = styleContent.replace(/&quot;/g, "'");
    const props = normalized.split(';');
    const cleaned = props.filter(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return false;
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return false;
      const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
      return whitelist.has(key);
    });
    return `style="${cleaned.join('; ')}"`;
  });

  // Assemble HTML
  const fontsImport = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Manrope:wght@300;400;500;600;700;800&display=swap');`;
  
  let finalHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${fontsImport}</style>
</head>
<body style="margin:0">
${cleanMailStageTag}
${bodyContent}
</body>
</html>`;

  // 3. Clean any remaining data-om attributes
  finalHtml = finalHtml.replace(/\s*data-om-text="[^"]*"/g, '');
  finalHtml = finalHtml.replace(/\s*data-om-id="[^"]*"/g, '');

  // 4. Personalization & replacements
  // Name replacements
  if (typeKey === 'solicitacao_recebida') {
    // Replace Name: split tags
    const nameRegex = /\{\s*<\/span>\s*<span[^>]*>\s*Nome\s*<\/span>\s*<span[^>]*>\s*\}/gi;
    finalHtml = finalHtml.replace(nameRegex, '{nome}');
  } else if (typeKey === 'horario_confirmado') {
    // Replace "Te espero, Marina." with "Te espero, {nome}."
    finalHtml = finalHtml.replace(/Te espero, Marina\./gi, 'Te espero, {nome}.');
    // Just in case, replace any lone "Marina" text in specific content blocks
    finalHtml = finalHtml.replace(/Marina/gi, '{nome}');
  } else if (typeKey === 'reativacao_5_meses') {
    // Replace "Marina, seu último corte aqui foi em Janeiro." with "{nome}, seu último corte aqui já faz cerca de 5 meses."
    finalHtml = finalHtml.replace(/Marina, seu último corte aqui foi em Janeiro/gi, '{nome}, seu último corte aqui já faz cerca de 5 meses');
    finalHtml = finalHtml.replace(/Marina/gi, '{nome}');
  }

  // Address replacements
  finalHtml = finalHtml.replace(/Rua dos Cacheados, 218 · Caiçara · Belo Horizonte/gi, 'Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte');
  finalHtml = finalHtml.replace(/Rua dos Cacheados, 218 · Caiçara/gi, 'Rua Francisco Ovídio, 184 · Caiçara');
  finalHtml = finalHtml.replace(/Rua dos Cacheados, 218/gi, 'Rua Francisco Ovídio, 184');

  // Dates & Times & Services
  finalHtml = finalHtml.replace(/Terça, 18 de Junho/g, '{data}');
  finalHtml = finalHtml.replace(/14h00/g, '{horario}');
  
  if (typeKey === 'lembrete_24h') {
    finalHtml = finalHtml.replace(/Amanhã às 14h/g, 'Amanhã às {horario}');
    finalHtml = finalHtml.replace(/às 14h\./g, 'às {horario}.');
  }
  
  finalHtml = finalHtml.replace(/Corte \+ leitura de fio/g, '{servico}');

  // Links replacements
  finalHtml = replaceLink(finalHtml, "Falar com o Jon no WhatsApp", "https://wa.me/553135866673");
  finalHtml = replaceLink(finalHtml, "Marcar pelo WhatsApp", "https://wa.me/553135866673");
  finalHtml = replaceLink(finalHtml, "Chamar no WhatsApp", "https://wa.me/553135866673");
  finalHtml = replaceLink(finalHtml, "Sugerir outro horário", "https://www.ojonquecortou.com.br/agendar");
  finalHtml = replaceLink(finalHtml, "Ver agenda completa", "https://www.ojonquecortou.com.br/agendar");
  finalHtml = replaceLink(finalHtml, "Preciso reagendar", "https://www.ojonquecortou.com.br/agendar");
  finalHtml = replaceLink(finalHtml, "Adicionar à agenda", "https://www.ojonquecortou.com.br");
  finalHtml = replaceLink(finalHtml, "Ver localização", "https://maps.google.com/?q=Rua+Francisco+Ovídio,+184,+Caiçara,+Belo+Horizonte");
  finalHtml = replaceLink(finalHtml, "Instagram ↗", "https://instagram.com/ojonquecortou");
  finalHtml = replaceLink(finalHtml, "WhatsApp ↗", "https://wa.me/553135866673");
  finalHtml = replaceLink(finalHtml, "Google Maps ↗", "https://maps.google.com/?q=Rua+Francisco+Ovídio,+184,+Caiçara,+Belo+Horizonte");
  finalHtml = replaceLink(finalHtml, "Blog ↗", "https://www.ojonquecortou.com.br/blog");
  finalHtml = replaceLink(finalHtml, "Descadastrar", "https://ojonquecortou.com.br/api/unsubscribe?email={email}");
  finalHtml = replaceLink(finalHtml, "Preferências", "https://www.ojonquecortou.com.br");

  console.log(`Successfully processed "${title}" (${typeKey}). Output size: ${finalHtml.length} bytes.`);
  return finalHtml;
}

async function run() {
  console.log("Processing and uploading templates to Firestore settings/studio...");
  
  const mappings = [
    {
      filePath: 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html',
      title: 'Pedido Recebido',
      typeKey: 'solicitacao_recebida'
    },
    {
      filePath: 'C:/Users/jonat/Downloads/01 _ Confirma_o (1).html',
      title: 'Horário Confirmado',
      typeKey: 'horario_confirmado'
    },
    {
      filePath: 'C:/Users/jonat/Downloads/02 _ Lembrete 24h _ dark (1).html',
      title: 'Lembrete 24h',
      typeKey: 'lembrete_24h'
    },
    {
      filePath: 'C:/Users/jonat/Downloads/06 _ Reativa_o (1).html',
      title: 'Reativação 5 Meses',
      typeKey: 'reativacao_5_meses'
    }
  ];

  const updates = {};
  for (const m of mappings) {
    const cleanedHtml = processTemplate(m.filePath, m.title, m.typeKey);
    if (cleanedHtml) {
      updates[`custom_automations.${m.typeKey}`] = cleanedHtml;
      
      // Save local backup file for safety
      const backupPath = path.join(__dirname, `../email_${m.typeKey}_clean.html`);
      fs.writeFileSync(backupPath, cleanedHtml);
      console.log(`Saved local clean backup: ${backupPath}`);
    }
  }

  if (Object.keys(updates).length > 0) {
    try {
      console.log("Updating document settings/studio in Firestore...");
      await updateDoc(doc(db, 'settings', 'studio'), updates);
      console.log("Firestore settings/studio updated successfully!");
    } catch (err) {
      console.error("Error updating Firestore settings/studio document:", err);
      process.exit(1);
    }
  } else {
    console.log("No templates to upload.");
  }
}

run().then(() => {
  console.log("All done!");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
