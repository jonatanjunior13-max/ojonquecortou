export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { eventName, eventData, pixelId } = req.body;
  const token = process.env.META_CAPI_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Token da API não configurado no servidor' });
  }

  const targetPixel = pixelId || '1152310907009255';
  
  // Facebook Conversions API endpoint
  const url = `https://graph.facebook.com/v19.0/${targetPixel}/events?access_token=${token}`;

  const payload = {
    data: [
      {
        event_name: eventName || 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: req.headers.referer || 'https://www.ojonquecortou.com.br/',
        user_data: {
          client_user_agent: req.headers['user-agent'],
          client_ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        },
        custom_data: eventData || {}
      }
    ]
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
