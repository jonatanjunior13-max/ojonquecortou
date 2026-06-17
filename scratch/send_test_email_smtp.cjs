const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
  console.log('🧪 Calling production API with type: horario_confirmado...');
  
  const res = await fetch('https://ojonquecortou.com.br/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'horario_confirmado',
      clientEmail: 'jonatanjunior13@gmail.com',
      clientName: 'Jonatan Teste SMTP',
      date: '05/06/2026',
      time: '14:00',
      serviceName: 'Corte de Cabelo (Teste SMTP)',
      duration: '60'
    })
  });
  
  const text = await res.text();
  console.log('HTTP Status:', res.status);
  console.log('Response:', text);
  process.exit(res.ok ? 0 : 1);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
