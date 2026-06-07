async function testReviews() {
  const url = 'https://www.ojonquecortou.com.br/api/reviews';
  // Se houver CRON_SECRET cadastrado na Vercel, use ele. Caso contrário, envia em branco.
  const token = process.env.CRON_SECRET || ''; 

  console.log('Testando endpoint de reviews na produção com fetch nativo...');
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status HTTP: ${response.status}`);
    const data = await response.json();
    console.log('Retorno do servidor:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao conectar na API:', error);
  }
}

testReviews();
