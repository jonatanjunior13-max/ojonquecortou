export default async function handler(req, res) {
  const SITE_URL = 'https://www.ojonquecortou.com.br';
  const key = '2778862fb97f435e968549a6ef8f4f05';

  try {
    console.log('Iniciando submissão IndexNow...');
    
    // 1. Busca o sitemap
    const sitemapRes = await fetch(`${SITE_URL}/sitemap.xml`, { cache: 'no-store' });
    if (!sitemapRes.ok) {
      return res.status(500).send(`Erro ao carregar sitemap: ${sitemapRes.status} ${sitemapRes.statusText}`);
    }
    
    const sitemapText = await sitemapRes.text();
    
    // 2. Extrai as URLs
    const locRegex = /<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/g;
    const urls = [];
    let match;
    while ((match = locRegex.exec(sitemapText)) !== null) {
      urls.push(match[1].trim());
    }

    if (urls.length === 0) {
      return res.status(400).send('Nenhuma URL válida encontrada no sitemap.');
    }

    console.log(`Enviando ${urls.length} URLs para o IndexNow (api.indexnow.org e bing.com)...`);

    const payload = JSON.stringify({
      host: 'www.ojonquecortou.com.br',
      key: key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList: urls
    });

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };

    const [resCentral, resBing] = await Promise.allSettled([
      fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers, body: payload }),
      fetch('https://www.bing.com/indexnow', { method: 'POST', headers, body: payload })
    ]);

    const centralOk = resCentral.status === 'fulfilled' && resCentral.value.ok;
    const bingOk = resBing.status === 'fulfilled' && resBing.value.ok;

    if (centralOk || bingOk) {
      res.status(200).send(`IndexNow avisado com sucesso! (Central: ${centralOk ? 'OK' : 'Falha'}, Bing: ${bingOk ? 'OK' : 'Falha'}) - ${urls.length} URLs enviadas.`);
    } else {
      res.status(502).send('Falha ao comunicar com os endpoints do IndexNow.');
    }
  } catch (error) {
    console.error('Erro interno na função:', error);
    res.status(500).send(`Erro interno: ${error.message}`);
  }
}
