import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Category-based premium images database
const imagesDb = {
  oleo: [
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1615396899839-c99c121888b0?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80'
  ],
  shampoo: [
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519735000599-4d47340c3c67?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'
  ],
  condicionador: [
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80'
  ],
  mascara: [
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1629732047847-50b7ecf0cbf1?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=600&auto=format&fit=crop&q=80'
  ],
  finalizador: [
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80'
  ],
  escova: [
    'https://images.unsplash.com/photo-1590156546746-c58a8d162410?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1593114183097-f7b59c61bdef?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80'
  ]
};

function formatGoogleImageUrl(image) {
  if (!image) return '';
  let imageUrl = image;
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    const match = imageUrl.match(/o\/gallery%2F([^?]+)/);
    if (match && match[1]) {
      const filename = decodeURIComponent(match[1]);
      let cleanFilename = filename;
      if (filename.toLowerCase().endsWith('.webp')) {
        cleanFilename = filename + '.jpg';
      }
      imageUrl = `https://www.ojonquecortou.com.br/api/media/${cleanFilename}`;
    }
  } else if (!imageUrl.startsWith('http')) {
    const filename = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    let cleanFilename = filename;
    if (filename.toLowerCase().endsWith('.webp')) {
      cleanFilename = filename + '.jpg';
    }
    imageUrl = `https://www.ojonquecortou.com.br/api/media/${cleanFilename}`;
  } else {
    if (imageUrl.toLowerCase().endsWith('.webp')) {
      imageUrl = `https://www.ojonquecortou.com.br/api/media/external_${Buffer.from(imageUrl).toString('base64')}.jpg`;
    }
  }
  return imageUrl;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Unified Handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  const { action, query } = req.query;

  // 1. Google Merchant Center RSS Feed Action
  if (action === 'feed') {
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });

      let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
      xml += '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n';
      xml += '  <channel>\n';
      xml += '    <title>Studio do Jon - Produtos</title>\n';
      xml += '    <link>https://www.ojonquecortou.com.br</link>\n';
      xml += '    <description>Produtos profissionais para cabelo cacheado e crespo em Belo Horizonte.</description>\n';

      for (const product of products) {
        if (!product.name || !product.sellingPrice) continue;

        const priceVal = Number(product.sellingPrice).toFixed(2);
        const imageUrl = formatGoogleImageUrl(product.image) || 'https://www.ojonquecortou.com.br/logo-cabeleireiro-de-cachos.png';
        const availability = product.quantity > 0 ? 'in stock' : 'out of stock';
        
        xml += '    <item>\n';
        xml += `      <g:id>${escapeXml(product.id)}</g:id>\n`;
        xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`;
        xml += `      <g:description>${escapeXml(`Adquira ${product.name} no Studio do Jon. Especialista em cabelos cacheados e crespos em Belo Horizonte.`)}</g:description>\n`;
        xml += `      <g:link>https://www.ojonquecortou.com.br/produtos/${escapeXml(product.id)}</g:link>\n`;
        xml += `      <g:image_link>${escapeXml(imageUrl)}</g:image_link>\n`;
        xml += `      <g:price>${priceVal} BRL</g:price>\n`;
        xml += `      <g:availability>${availability}</g:availability>\n`;
        xml += `      <g:condition>new</g:condition>\n`;
        xml += `      <g:brand>Studio do Jon</g:brand>\n`;
        xml += '    </item>\n';
      }

      xml += '  </channel>\n';
      xml += '</rss>';

      return res.status(200).send(xml);
    } catch (error) {
      console.error('Erro ao gerar feed de produtos:', error);
      return res.status(500).send('<?xml version="1.0"?><error>Erro interno ao gerar feed</error>');
    }
  }

  // 2. Unsplash Category Stock Images Search Action
  res.setHeader('Content-Type', 'application/json');
  const searchQuery = query || req.query.query;
  if (!searchQuery) {
    return res.status(400).json({ error: 'Parâmetro query ou action=feed é obrigatório' });
  }

  const normalized = searchQuery.toLowerCase();
  let category = 'default';

  if (normalized.includes('oleo') || normalized.includes('óleo') || normalized.includes('argan') || normalized.includes('pinga')) {
    category = 'oleo';
  } else if (normalized.includes('shampoo') || normalized.includes('co-wash')) {
    category = 'shampoo';
  } else if (normalized.includes('condicionador')) {
    category = 'condicionador';
  } else if (normalized.includes('mascara') || normalized.includes('máscara') || normalized.includes('cream') || normalized.includes('morte')) {
    category = 'mascara';
  } else if (normalized.includes('escova') || normalized.includes('pente') || normalized.includes('fitagem') || normalized.includes('acessorio') || normalized.includes('acessório')) {
    category = 'escova';
  } else if (normalized.includes('finalizador') || normalized.includes('gelatina') || normalized.includes('gel') || normalized.includes('mousse') || normalized.includes('juba') || normalized.includes('crespos') || normalized.includes('ondas') || normalized.includes('spray')) {
    category = 'finalizador';
  }

  const urls = imagesDb[category];
  return res.status(200).json({ urls });
}
