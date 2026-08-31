import crypto from 'crypto';

// Meta requires PII match keys as lowercase-trimmed SHA-256 hashes, never raw values.
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const hashEmail = (email) => {
  const normalized = (email || '').trim().toLowerCase();
  return normalized ? hashValue(normalized) : null;
};

const hashPhone = (phone) => {
  let digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  // Meta expects E.164 digits (country code, no leading +); local numbers are stored without it.
  if (!digits.startsWith('55')) digits = `55${digits}`;
  return hashValue(digits);
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // -------------------------------------------------------------
  // INSTAGRAM GRAPH API ROUTING (action=instagram or GET/Publish actions)
  // -------------------------------------------------------------
  if (req.query.action === 'instagram' || req.body?.action?.startsWith('publish') || req.method === 'GET') {
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
    } catch (err) {
      console.error('Erro na API do Instagram:', err);
      return res.status(500).json({ error: 'Erro interno ao comunicar com o Instagram.', details: err.message });
    }
  }

  // -------------------------------------------------------------
  // META CONVERSIONS API (CAPI) ROUTING
  // -------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { eventName, eventData, events, pixelId, eventId, fbc, fbp, email, phone } = req.body;
  
  // Resolve Meta Access Token with resilient fallbacks
  let token = process.env.META_CAPI_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    for (const [k, v] of Object.entries(process.env)) {
      if (typeof k === 'string' && k.startsWith('EAATD')) {
        token = k;
        break;
      }
      if (typeof v === 'string' && v.startsWith('EAATD')) {
        token = v;
        break;
      }
    }
  }
  if (!token) {
    token = 'EAATDmMM4FykBRX78Qdqa8pBNuvqKhHZAHFYQ2pZCW4FqSiWFT5ZBTIEgovK8mTEYyEniUYAT8p8NwQXrEfNB62zZAkmzbTqX1el108z1vLfHQW7g1QZAHhrUB2UwOIkZCwnqCw4UmAjZBCQF1a9XZBYsPEyrmDUr1S0W2WdZCRSVYoa13E4YTkc789rAuIupg8QZDZD';
  }

  const targetPixel = pixelId || '1152310907009255';
  const url = `https://graph.facebook.com/v19.0/${targetPixel}/events?access_token=${token}`;

  const userData = {
    client_user_agent: req.headers['user-agent'],
    client_ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };
  if (fbc) userData.fbc = fbc;
  if (fbp) userData.fbp = fbp;
  const hashedEmail = hashEmail(email);
  if (hashedEmail) userData.em = [hashedEmail];
  const hashedPhone = hashPhone(phone);
  if (hashedPhone) userData.ph = [hashedPhone];

  let eventItems = [];
  if (Array.isArray(events) && events.length > 0) {
    eventItems = events.map(evt => ({
      event_name: evt.eventName || 'Schedule',
      event_time: Math.floor(Date.now() / 1000),
      event_id: evt.eventId || undefined,
      action_source: 'website',
      event_source_url: req.headers.referer || 'https://www.ojonquecortou.com.br/',
      user_data: userData,
      custom_data: evt.eventData || eventData || {}
    }));
  } else {
    eventItems = [
      {
        event_name: eventName || 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || undefined,
        action_source: 'website',
        event_source_url: req.headers.referer || 'https://www.ojonquecortou.com.br/',
        user_data: userData,
        custom_data: eventData || {}
      }
    ];
  }

  const payload = {
    data: eventItems
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erro na Meta Conversions API:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

