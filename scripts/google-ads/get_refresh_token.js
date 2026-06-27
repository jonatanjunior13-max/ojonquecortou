import readline from 'readline';
import http from 'http';
import { exec } from 'child_process';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET';
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/adwords';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent`;

console.log('=== GERADOR DE REFRESH TOKEN DO GOOGLE ADS ===\n');
console.log('Iniciando servidor local na porta 3000...');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get('code');

  if (code) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Autorizado com sucesso!</h1><p>Pode fechar esta janela e voltar ao terminal.</p>');
    
    console.log('\nTrocando código pelo Refresh Token...');
    server.close();

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code: code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('\nErro ao obter token:', data.error_description || data.error);
      } else {
        console.log('\n\x1b[32m=== SUCESSO! TOKEN GERADO ===\x1b[0m');
        console.log('Refresh Token: \x1b[33m%s\x1b[0m', data.refresh_token);
        console.log('\nGuarde este token de forma segura.');
      }
    } catch (error) {
      console.error('\nErro na requisição:', error);
    }
    process.exit(0);
  } else {
    res.writeHead(400);
    res.end('Codigo nao encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor ouvindo em ${REDIRECT_URI}`);
  console.log('\n1. Abra o link abaixo no seu navegador para dar permissão:');
  console.log('\x1b[36m%s\x1b[0m', authUrl);
  console.log('\nAguardando autorização no navegador...');
});

