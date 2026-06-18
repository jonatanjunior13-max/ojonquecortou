import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

// Standard redirection URI for web servers or local testing
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('------------------------------------------------------------');
console.log('1. Abra este link no seu navegador e faça login com a conta do salão:');
console.log('\x1b[36m%s\x1b[0m', authUrl);
console.log('------------------------------------------------------------');
console.log('NOTA: Quando você for redirecionado, a página dará erro de conexão ou ficará em branco.');
console.log('Copie toda a URL da barra de endereços (que começa com http://localhost:3000...)');
console.log('e cole abaixo.');
console.log('------------------------------------------------------------');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('2. Cole a URL de redirecionamento completa aqui: ', async (urlInput) => {
  try {
    const urlObj = new URL(urlInput.trim());
    const code = urlObj.searchParams.get('code');
    if (!code) {
      throw new Error('Código "code" não encontrado na URL.');
    }
    
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n------------------------------------------------------------');
    console.log('Sucesso! Refresh Token permanente obtido:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('Adicione essa linha no seu arquivo .env');
    console.log('------------------------------------------------------------');
  } catch (error) {
    console.error('Erro ao ler a URL ou obter token:', error.message || error);
  } finally {
    rl.close();
  }
});
