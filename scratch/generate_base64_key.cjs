const fs = require('fs');

try {
  const jsonPath = 'C:/Users/jonat/Downloads/extreme-cable-425610-j1-e387bfebdf02.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const privateKey = data.private_key;

  if (!privateKey) {
    console.error('Chave privada não encontrada no arquivo JSON.');
    process.exit(1);
  }

  const base64Key = Buffer.from(privateKey).toString('base64');
  console.log('--- COPIE A LINHA ABAIXO INTEIRA ---');
  console.log(base64Key);
  console.log('------------------------------------');
} catch (error) {
  console.error('Erro ao ler ou processar o arquivo JSON:', error);
}
