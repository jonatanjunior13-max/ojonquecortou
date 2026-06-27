export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { action, payload } = req.body;
  if (!action || !payload) {
    return res.status(400).json({ error: 'Missing action or payload' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.includes('placeholder')) {
    return res.status(503).json({ error: 'Gemini API key not configured' });
  }

  try {
    let url = '';
    if (action === 'generateContent') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    } else if (action === 'generateImage') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      const text = await response.text();
      return res.status(response.status).json({ error: 'Gemini API error', details: text });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
