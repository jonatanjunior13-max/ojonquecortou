export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !igAccountId) {
    return res.status(500).json({
      error: 'Variáveis INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_BUSINESS_ACCOUNT_ID não configuradas.'
    });
  }

  try {
    // 1. GET: Listar posts recentes e métricas do perfil @ojonquecortou
    if (req.method === 'GET') {
      const limit = req.query.limit || 12;
      const mediaUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;
      
      const response = await fetch(mediaUrl);
      const data = await response.json();

      if (data.error) {
        return res.status(400).json({ error: data.error.message, details: data.error });
      }

      return res.status(200).json(data);
    }

    // 2. POST: Publicar Foto Única ou Carrossel
    if (req.method === 'POST') {
      const { action, imageUrl, imageUrls, caption } = req.body;

      // Publicar Imagem Única
      if (action === 'publish-image' || (imageUrl && !imageUrls)) {
        if (!imageUrl) {
          return res.status(400).json({ error: 'A URL da imagem é obrigatória.' });
        }

        // Criar Container de Mídia
        const createMediaUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media`;
        const containerResp = await fetch(createMediaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption || '',
            access_token: accessToken
          })
        });
        const containerData = await containerResp.json();

        if (containerData.error) {
          return res.status(400).json({ error: containerData.error.message, details: containerData.error });
        }

        const creationId = containerData.id;

        // Publicar Container
        const publishUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media_publish`;
        const pubResp = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: accessToken
          })
        });
        const pubData = await pubResp.json();

        if (pubData.error) {
          return res.status(400).json({ error: pubData.error.message, details: pubData.error });
        }

        return res.status(200).json({ success: true, id: pubData.id, message: 'Publicado no Instagram com sucesso!' });
      }

      // Publicar Carrossel (Múltiplas Imagens)
      if (action === 'publish-carousel' || (imageUrls && Array.isArray(imageUrls))) {
        if (!imageUrls || imageUrls.length < 2) {
          return res.status(400).json({ error: 'Um carrossel precisa de no mínimo 2 imagens.' });
        }

        // Criar containers individuais para cada imagem do carrossel
        const itemIds = [];
        for (const imgUrl of imageUrls) {
          const createItemUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media`;
          const itemResp = await fetch(createItemUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: imgUrl,
              is_carousel_item: true,
              access_token: accessToken
            })
          });
          const itemData = await itemResp.json();
          if (itemData.error) {
            return res.status(400).json({ error: `Erro ao criar slide (${imgUrl}): ${itemData.error.message}` });
          }
          itemIds.push(itemData.id);
        }

        // Criar Container Principal do Carrossel
        const createCarouselUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media`;
        const carouselResp = await fetch(createCarouselUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'CAROUSEL',
            children: itemIds,
            caption: caption || '',
            access_token: accessToken
          })
        });
        const carouselData = await carouselResp.json();

        if (carouselData.error) {
          return res.status(400).json({ error: carouselData.error.message, details: carouselData.error });
        }

        const creationId = carouselData.id;

        // Publicar Container do Carrossel
        const publishUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media_publish`;
        const pubResp = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: accessToken
          })
        });
        const pubData = await pubResp.json();

        if (pubData.error) {
          return res.status(400).json({ error: pubData.error.message, details: pubData.error });
        }

        return res.status(200).json({ success: true, id: pubData.id, message: 'Carrossel publicado no Instagram com sucesso!' });
      }

      return res.status(400).json({ error: 'Ação de publicação não reconhecida.' });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (err) {
    console.error('Erro na API do Instagram:', err);
    return res.status(500).json({ error: 'Erro interno ao comunicar com o Instagram.', details: err.message });
  }
}
