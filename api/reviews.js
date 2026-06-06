import { google } from 'googleapis';

// Função para validar se o agente de chamadas tem acesso
function validateAuth(req) {
  const authHeader = req.headers.authorization;
  // Usamos o mesmo token de proteção das demais crons do site
  const cronToken = process.env.CRON_SECRET || process.env.VERCEL_CRON_JWT;
  if (cronToken && authHeader !== `Bearer ${cronToken}`) {
    return false;
  }
  return true;
}

// Inicializa a autenticação do Google via Conta de Serviço
function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('Chaves da Conta de Serviço do Google não configuradas nas variáveis de ambiente.');
  }

  return new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/business.manage']
  );
}

export default async function handler(req, res) {
  // CORS Headers básicos
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validação simples de segurança
  if (!validateAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  try {
    const auth = getGoogleAuth();
    const mybusiness = google.mybusinessbusinessinformation({
      version: 'v1',
      auth,
    });
    
    // As APIs de reviews necessitam do escopo do My Business do Google
    // Opcionalmente podemos usar fetch direto com o token obtido pelo JWT da googleapis
    const tokenInfo = await auth.authorize();
    const accessToken = tokenInfo.access_token;

    const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID; // ex: 10674996025577230390
    const locationId = process.env.GOOGLE_LOCATION_ID;        // ex: 1234567890

    if (!accountId || !locationId) {
      return res.status(400).json({ error: 'GOOGLE_BUSINESS_ACCOUNT_ID ou GOOGLE_LOCATION_ID não configurados.' });
    }

    const reviewsEndpoint = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;

    // 1. LISTAR AVALIAÇÕES (GET)
    if (req.method === 'GET') {
      const response = await fetch(reviewsEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: 'Erro ao buscar no Google API', details: errText });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // 2. ENVIAR RESPOSTA (POST)
    if (req.method === 'POST') {
      const { reviewId, replyComment } = req.body;

      if (!reviewId || !replyComment) {
        return res.status(400).json({ error: 'Parâmetros reviewId e replyComment são obrigatórios.' });
      }

      const replyEndpoint = `${reviewsEndpoint}/${reviewId}/reply`;
      const response = await fetch(replyEndpoint, {
        method: 'PUT', // A API do Google usa PUT para criar/editar resposta de review
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: replyComment
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: 'Erro ao responder no Google API', details: errText });
      }

      const data = await response.json();
      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (error) {
    console.error('Erro no handler de reviews:', error);
    return res.status(500).json({ error: 'Erro interno no servidor', message: error.message });
  }
}
