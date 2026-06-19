import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateFeed() {
  try {
    console.log('Querying products for Google Merchant Center feed...');
    const querySnapshot = await getDocs(collection(db, 'products'));
    console.log(`Found ${querySnapshot.size} products.`);

    let xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Studio do Jon - Produtos</title>
    <link>https://www.ojonquecortou.com.br</link>
    <description>Produtos profissionais para cabelos cacheados, crespos e ondulados - Belo Horizonte</description>
`;

    querySnapshot.forEach((productDoc) => {
      const data = productDoc.data();
      const id = productDoc.id;
      const name = data.name || '';
      
      const rawPrice = Number(data.sellingPrice || 0);
      const priceVal = rawPrice.toFixed(2);
      const isOutOfStock = (data.quantity || 0) <= 0;
      const image = data.image || 'https://www.ojonquecortou.com.br/logo-cabeleireiro-de-cachos.png';
      const category = data.category || 'Cuidados';
      
      const description = `Adquira ${name} no Studio do Jon em Belo Horizonte. Produto de alta performance ideal para cabelos ondulados, cacheados e crespos. Categoria: ${category}.`;

      xml += `    <item>
      <g:id>${id}</g:id>
      <title><![CDATA[${name}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>https://www.ojonquecortou.com.br/produtos/${id}</link>
      <g:image_link><![CDATA[${image}]]></g:image_link>
      <g:price>${priceVal} BRL</g:price>
      <g:availability>${isOutOfStock ? 'out_of_stock' : 'in_stock'}</g:availability>
      <g:brand><![CDATA[Studio do Jon]]></g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Hair Care</g:google_product_category>
    </item>
`;
    });

    xml += `  </channel>
</rss>`;

    const destPath = path.resolve('public/google-merchant-feed.xml');
    fs.writeFileSync(destPath, xml, 'utf8');
    console.log(`Google Merchant feed successfully generated at ${destPath}`);
  } catch (error) {
    console.error('Error generating Google Merchant feed:', error);
  }
}

generateFeed();
