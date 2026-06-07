const fs = require('fs');
const crypto = require('crypto');

try {
  const jsonPath = 'C:/Users/jonat/Downloads/extreme-cable-425610-j1-e387bfebdf02.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const privateKeyRaw = data.private_key;

  if (!privateKeyRaw) {
    console.error('Chave privada não encontrada no arquivo JSON.');
    process.exit(1);
  }

  // Importa a chave no formato padrão
  const pKey = crypto.createPrivateKey({
    key: privateKeyRaw.trim().replace(/\\n/g, '\n'),
    format: 'pem',
    type: 'pkcs8'
  });

  // Exporta a chave no formato PKCS#1 (que o Node.js lê nativamente de forma muito mais compatível)
  const pkcs1Key = pKey.export({
    format: 'pem',
    type: 'pkcs1'
  });

  const base64Key = Buffer.from(pkcs1Key).toString('base64');
  
  console.log('--- COPIE A LINHA ABAIXO (FORMATO RSA PKCS#1) ---');
  console.log(base64Key);
  console.log('--------------------------------------------------');
} catch (error) {
  console.error('Erro ao converter chave:', error);
}
