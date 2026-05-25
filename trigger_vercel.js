import { HTML_TEMPLATES } from './src/utils/emailTemplates.js';

async function sendLiveTest() {
  const tests = [
    { key: 'd1', title: 'Teste Visual - D+1' },
    { key: 'd90', title: 'Teste Visual - D+90 (Nova Copy)' },
    { key: 'aniversario', title: 'Teste Visual - Aniversário' }
  ];

  for (let t of tests) {
    let content = HTML_TEMPLATES[t.key]
      .replace(/{nome}/g, 'Jonatan')
      .replace(/{serviceName}/g, 'Corte e Secagem');
      
    console.log(`Disparando ${t.title} via Vercel...`);
    try {
      const response = await fetch('https://ojonquecortou.com.br/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'campanha',
          clientEmail: 'contato@ojonquecortou.com.br',
          clientName: 'Jonatan',
          subject: t.title,
          htmlBody: content
        })
      });
      console.log(`Resposta: ${response.status} ${response.statusText}`);
    } catch (e) {
      console.error('Erro ao disparar:', e);
    }
  }
}

sendLiveTest();
