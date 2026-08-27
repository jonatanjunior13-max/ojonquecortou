import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTests() {
  try {
    const adminEmail = process.env.CRON_FIREBASE_EMAIL || process.env.SMTP_USER || 'contato@ojonquecortou.com.br';
    let adminPass = process.env.CRON_FIREBASE_PASSWORD || process.env.SMTP_PASS || '7956#Jon!';
    if (adminPass.startsWith('"') && adminPass.endsWith('"')) adminPass = adminPass.slice(1, -1);

    console.log('Tentando autenticação com:', adminEmail);
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      console.log('🔑 Autenticado com sucesso como Admin!');
    } catch (authErr) {
      console.warn('Tentando senha alternativa...');
      await signInWithEmailAndPassword(auth, adminEmail, '7956#Jon');
      console.log('🔑 Autenticado com sucesso como Admin (senha 2)!');
    }

    const productsSnap = await getDocs(query(collection(db, 'products'), limit(2)));
    console.log('✅ Produtos:', productsSnap.size, 'encontrados');

    const clientsSnap = await getDocs(query(collection(db, 'client_profiles'), limit(2)));
    console.log('✅ Clientes:', clientsSnap.size, 'encontrados');

    const financialSnap = await getDocs(query(collection(db, 'financial_transactions'), limit(2)));
    console.log('✅ Transações Financeiras:', financialSnap.size, 'encontradas');

    const bookingsSnap = await getDocs(query(collection(db, 'bookings'), limit(2)));
    console.log('✅ Agendamentos:', bookingsSnap.size, 'encontrados');

    const servicesSnap = await getDocs(query(collection(db, 'services'), limit(2)));
    console.log('✅ Serviços:', servicesSnap.size, 'encontrados');

    console.log('\n🎉 TODAS as coleções do CRM responderam com sucesso total!');
  } catch (err) {
    console.error('❌ Erro no teste:', err);
  }
}

runTests();
