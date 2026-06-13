export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { gateway, phone, message, config, extraData } = req.body;

  if (!gateway || !phone || !message) {
    return res.status(400).json({ error: 'Parâmetros gateway, phone e message são obrigatórios.' });
  }

  try {
    let url = '';
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    if (gateway === 'zapi') {
      const { zApiInstanceId, zApiToken } = config || {};
      if (!zApiInstanceId || !zApiToken) {
        return res.status(400).json({ error: 'Z-API não configurada corretamente' });
      }
      url = `https://api.z-api.io/instances/${zApiInstanceId}/token/${zApiToken}/send-text`;
      body = { phone, message };
    } else if (gateway === 'evolution') {
      const { evolutionApiUrl, evolutionApiKey, evolutionInstanceName } = config || {};
      if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
        return res.status(400).json({ error: 'Evolution API não configurada corretamente' });
      }
      url = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${evolutionInstanceName}`;
      headers['apikey'] = evolutionApiKey;
      body = { number: phone, text: message };
    } else if (gateway === 'custom') {
      const { customWebhookUrl } = config || {};
      if (!customWebhookUrl) {
        return res.status(400).json({ error: 'Webhook customizado não configurado' });
      }
      url = customWebhookUrl;
      body = {
        phone,
        message,
        ...extraData
      };
    } else {
      return res.status(400).json({ error: 'Gateway inválido ou não suportado' });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const resText = await response.text();
    let resJson = {};
    try {
      resJson = JSON.parse(resText);
    } catch (e) {
      resJson = { text: resText };
    }

    if (response.ok) {
      return res.status(200).json({ success: true, data: resJson });
    } else {
      return res.status(response.status).json({ error: 'Erro no gateway de WhatsApp', details: resJson });
    }
  } catch (error) {
    console.error('Erro no proxy de whatsapp:', error);
    return res.status(500).json({ error: 'Erro interno no servidor de envio', message: error.message });
  }
}
