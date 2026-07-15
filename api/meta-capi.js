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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { eventName, eventData, pixelId, eventId, fbc, fbp, email, phone } = req.body;
  const token = process.env.META_CAPI_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Token da API não configurado no servidor' });
  }

  const targetPixel = pixelId || '1152310907009255';

  // Facebook Conversions API endpoint
  const url = `https://graph.facebook.com/v19.0/${targetPixel}/events?access_token=${token}`;

  // fbc/fbp let Meta tie this server-side event back to the ad click that started the session;
  // em/ph (hashed) improve match quality when fbc/fbp are missing (e.g. in-app browser cookie loss).
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

  const payload = {
    data: [
      {
        event_name: eventName || 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        // Matches the browser pixel's eventID so Meta deduplicates instead of double-counting
        event_id: eventId || undefined,
        action_source: 'website',
        event_source_url: req.headers.referer || 'https://www.ojonquecortou.com.br/',
        user_data: userData,
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
