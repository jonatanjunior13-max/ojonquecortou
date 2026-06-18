import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

async function syncProductsToGoogle() {
  try {
    console.log('Obtendo token de acesso do Google...');
    const { token } = await oauth2Client.getAccessToken();
    if (!token) {
      throw new Error('Falha ao gerar o Token de Acesso.');
    }
    console.log('Autenticação com Google bem-sucedida! Token gerado.');

    // We can interact with Google Business Profile localProducts API
    // Let's print out the payloads we will sync.
    const locationId = process.env.GOOGLE_LOCATION_ID;
    console.log(`Pronto para sincronizar produtos com a API do Perfil da Empresa (Location ID: ${locationId})!`);
  } catch (error) {
    console.error('Erro na sincronização:', error.message || error);
  }
}

syncProductsToGoogle();
