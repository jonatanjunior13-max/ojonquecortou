const fs = require('fs');
const { execSync } = require('child_process');

try {
  const jsonPath = 'C:/Users/jonat/Downloads/extreme-cable-425610-j1-e387bfebdf02.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const privateKey = data.private_key;

  if (!privateKey) {
    console.error('Chave privada não encontrada no JSON.');
    process.exit(1);
  }

  console.log('Removendo variável antiga da Vercel de forma forçada...');
  try {
    execSync('vercel env rm GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY production --yes', { stdio: 'inherit' });
  } catch (e) {
    console.log('Não foi possível remover da produção (pode não existir):', e.message);
  }
  try {
    execSync('vercel env rm GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY preview --yes', { stdio: 'inherit' });
  } catch (e) {
    console.log('Não foi possível remover da preview (pode não existir):', e.message);
  }
  try {
    execSync('vercel env rm GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY development --yes', { stdio: 'inherit' });
  } catch (e) {
    console.log('Não foi possível remover do desenvolvimento (pode não existir):', e.message);
  }

  console.log('Adicionando a chave privada correta com quebras de linha na Vercel...');
  execSync('vercel env add GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY production', {
    input: privateKey,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  console.log('Variável GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY cadastrada com sucesso!');
} catch (error) {
  console.error('Erro ao cadastrar variável na Vercel:', error);
}
