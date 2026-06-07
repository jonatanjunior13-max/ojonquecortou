const fs = require('fs');

try {
  const jsonPath = 'C:/Users/jonat/Downloads/extreme-cable-425610-j1-e387bfebdf02.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let privateKey = data.private_key;

  if (!privateKey) {
    console.error('Chave privada não encontrada.');
    process.exit(1);
  }

  // Sanitiza a chave: remove quebras textuais extras e normaliza os enters reais do PEM
  privateKey = privateKey.trim().replace(/\\n/g, '\n');

  // Codifica a chave já limpa em Base64
  const base64Key = Buffer.from(privateKey).toString('base64');
  console.log('--- COPIE ESTA NOVA LINHA ---');
  console.log(base64Key);
  console.log('-----------------------------');
} catch (error) {
  console.error('Erro:', error);
}
