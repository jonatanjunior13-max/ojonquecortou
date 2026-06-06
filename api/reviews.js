export default async function handler(req, res) {
  // CORS configuration
  const allowedOrigins = [
    'https://www.ojonquecortou.com.br',
    'https://ojonquecortou.com.br',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;

  res.setHeader('Access-Control-Allow-Credentials', true);
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.ojonquecortou.com.br');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Cache na Vercel Edge Network por 15 minutos (900 segundos) para ser dinâmico
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');

  try {
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const PLACE_ID = process.env.GOOGLE_PLACE_ID; 

    if (!API_KEY || !PLACE_ID) {
      return res.status(500).json({ error: 'Configuração da API ausente (GOOGLE_PLACES_API_KEY ou GOOGLE_PLACE_ID)' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&language=pt-BR&reviews_sort=newest&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result.reviews) {
      // Filtrar apenas avaliações com 4 ou 5 estrelas e que tenham texto
      const goodReviews = data.result.reviews
        .filter(review => review.rating >= 4 && review.text && review.text.length > 10)
        .sort((a, b) => b.time - a.time); // mais recentes primeiro

      return res.status(200).json({
        reviews: goodReviews.slice(0, 6), // Retornar as melhores
        rating: data.result.rating,
        total: data.result.user_ratings_total
      });
    } else {
      return res.status(500).json({ error: 'Falha ao buscar avaliações', details: data });
    }
  } catch (error) {
    console.error('Erro na API de Reviews:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
