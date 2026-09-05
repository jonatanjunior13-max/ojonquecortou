import fs from 'fs';
import https from 'https';

const SITE_URL = 'https://www.ojonquecortou.com.br';
const KEY = '2778862fb97f435e968549a6ef8f4f05';
const KEY_LOCATION = `${SITE_URL}/2778862fb97f435e968549a6ef8f4f05.txt`;
const SITEMAP_PATH = './public/sitemap.xml';

try {
  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const urls = sitemap.match(/<loc>(.*?)<\/loc>/g).map(val => val.replace(/<\/?loc>/g, ''));

  console.log(`Encontradas ${urls.length} URLs no sitemap.`);

  const data = JSON.stringify({
    host: 'www.ojonquecortou.com.br',
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  });

  const engines = [
    { name: 'Bing', hostname: 'www.bing.com' },
    { name: 'Yandex', hostname: 'yandex.com' }
  ];

  const promises = engines.map(engine => {
    return new Promise((resolve) => {
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
        res.on('data', () => {});
        res.on('end', () => {
          console.log(`[${engine.name}] Status de resposta: ${res.statusCode}`);
          if (res.statusCode === 200 || res.statusCode === 202) {
            console.log(`[${engine.name}] URLs aceitas com sucesso pelo IndexNow!`);
          } else {
            console.error(`[${engine.name}] Erro ao enviar URLs. Código: ${res.statusCode}`);
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        console.error(`[${engine.name}] Erro na requisição:`, error);
        resolve();
      });

      req.write(data);
      req.end();
    });
  });

  await Promise.all(promises);
} catch (error) {
  console.error('Falha ao ler o sitemap:', error);
}

