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
  'opacity', 'vertical-align', 'list-style', 'line-break', 'white-space'
]);

function superCleanStyleAndData(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return null;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  
  // 1. Strip data-om-text and data-om-id attributes
  html = html.replace(/\s*data-om-text="[^"]*"/g, '');
  html = html.replace(/\s*data-om-id="[^"]*"/g, '');
  
  // 2. Clean style="..." attributes using whitelist and resolving mismatched quotes
  const styleRegex = /style="([^"]*)"/g;
  
  html = html.replace(styleRegex, (match, styleContent) => {
    const safeStyle = styleContent.replace(/&quot;/g, 'BAD_QUOTE');
    const props = safeStyle.split(';');
    const cleanedProps = props.filter(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return false;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return false;
      
      const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
      if (!whitelist.has(key)) return false;
      
      if (trimmed.includes('BAD_QUOTE')) return false;
      return true;
    });
    
    return `style="${cleanedProps.join('; ')}"`;
  });
  
  // Write back to the same file
  fs.writeFileSync(filePath, html);
  console.log(`Super cleaned & whitelisted: ${filePath}. Size: ${html.length} bytes.`);
  return html;
}

async function run() {
  console.log("Starting advanced super clean process with whitelist for templates...");
  
  const file00Path = path.join(__dirname, '../email_00_clean.html');
  const file02Path = path.join(__dirname, '../email_02_clean.html');
  const file06Path = path.join(__dirname, '../email_06_clean.html');
  
  const content00 = superCleanStyleAndData(file00Path);
  const content02 = superCleanStyleAndData(file02Path);
  const content06 = superCleanStyleAndData(file06Path);
  
  // Update Firestore settings/studio
  try {
    const updates = {};
    if (content00) {
      updates['custom_automations.solicitacao_recebida'] = content00;
    }
    if (content02) {
      updates['custom_automations.lembrete_24h'] = content02;
    }
    if (content06) {
      updates['custom_automations.reativacao_5_meses'] = content06;
    }
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'settings', 'studio'), updates);
      console.log("-> Firestore settings/studio document successfully updated with super-cleaned whitelisted templates!");
    } else {
      console.log("-> No updates to perform.");
    }
  } catch (err) {
    console.error("-> Error updating Firestore:", err);
  }
}

run().then(() => {
  console.log("Done!");
  process.exit(0);
});
