export default async function handler(req, res) {
  const SITE_URL = 'https://www.ojonquecortou.com.br';
  const key = 'ad570ba1c6ba4630b664a7f571d247d0';

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

    console.log(`Enviando ${urls.length} URLs para o Bing...`);

    // 3. Envia para o IndexNow
    // Usando o endpoint em minúsculas conforme padrão da documentação
    const response = await fetch('https://www.bing.com/indexnow', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        host: 'www.ojonquecortou.com.br',
        key: key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: urls
      })
    });

    const responseText = await response.text();

    if (response.ok) {
      res.status(200).send(`Bing avisado com sucesso! ${urls.length} URLs indexadas. Resposta: ${responseText}`);
    } else {
      console.error(`Erro do Bing: ${response.status}`, responseText);
      res.status(response.status).send(`Erro ao falar com o Bing (${response.status}): ${responseText}`);
    }
  } catch (error) {
    console.error('Erro interno na função:', error);
    res.status(500).send(`Erro interno: ${error.message}`);
  }
}
