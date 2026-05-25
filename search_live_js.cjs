const http = require('https');

http.get('https://www.ojonquecortou.com.br/assets/index-BHKGrtWI.js', (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('JS file size:', data.length);
    console.log('Contains "Alterar Horário (Remarcar)":', data.includes('Alterar Horário (Remarcar)'));
    console.log('Contains "Sim, Confirmar Cancelamento":', data.includes('Sim, Confirmar Cancelamento'));
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});
