import fs from 'fs';
import https from 'https';

const SITE_URL = 'https://www.ojonquecortou.com.br';
const KEY = 'ad570ba1c6ba4630b664a7f571d247d0';
const SITEMAP_PATH = './public/sitemap.xml';

try {
  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const urls = sitemap.match(/<loc>(.*?)<\/loc>/g).map(val => val.replace(/<\/?loc>/g, ''));

  console.log(`Encontradas ${urls.length} URLs no sitemap.`);

  const data = JSON.stringify({
    host: 'www.ojonquecortou.com.br',
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList: urls
  });

  const engines = [
    { name: 'Bing', hostname: 'www.bing.com' },
    { name: 'Yandex', hostname: 'yandex.com' }
  ];

  engines.forEach(engine => {
    const options = {
      hostname: engine.hostname,
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`[${engine.name}] Status de resposta: ${res.statusCode}`);
      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log(`[${engine.name}] URLs aceitas com sucesso pelo IndexNow!`);
      } else {
        console.error(`[${engine.name}] Erro ao enviar URLs. Código: ${res.statusCode}`);
      }
    });

    req.on('error', (error) => {
      console.error(`[${engine.name}] Erro na requisição:`, error);
    });

    req.write(data);
    req.end();
  });
} catch (error) {
  console.error('Falha ao ler o sitemap:', error);
}
