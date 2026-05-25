const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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
  appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mock Notification</title>
</head>
<body style="font-family: sans-serif; background-color: #EFE5D2; color: #1A1310; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #FAF5E8; border: 1px solid rgba(26,19,16,0.1); border-radius: 8px; padding: 20px;">
    <h2 style="color: #C97B49;">Novo Agendamento Confirmado!</h2>
    <p>Olá Jon, um novo agendamento foi confirmado no sistema:</p>
    <div style="background: #F5EDDB; border: 1px solid rgba(26,19,16,0.12); padding: 15px; border-radius: 6px;">
      <strong>Cliente:</strong> Maria Silva<br>
      <strong>Serviço:</strong> Corte + leitura de fio<br>
      <strong>Data/Hora:</strong> 25/05/2026 às 15h00<br>
      <strong>Telefone:</strong> (31) 98765-4321
    </div>
  </div>
</body>
</html>
`;

async function run() {
  console.log("Inserting mock admin notification into Firestore...");
  await addDoc(collection(db, 'admin_notifications'), {
    timestamp: new Date().toISOString(),
    type: 'horario_confirmado',
    subject: '[AGENDAMENTO CONFIRMADO] Horário marcado para Maria Silva',
    clientName: 'Maria Silva',
    clientEmail: 'maria@exemplo.com',
    clientPhone: '5531987654321',
    serviceName: 'Corte + leitura de fio',
    date: '25/05/2026',
    time: '15h00',
    htmlBody: sampleHtml
  });
  console.log("Mock notification inserted successfully!");
}

run().then(() => process.exit(0)).catch(console.error);
