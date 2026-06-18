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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
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
