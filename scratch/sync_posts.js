import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { posts } from '../src/data/posts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env variables
const envPath = path.join(__dirname, '../.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.trim().split('=');
    if (parts.length >= 2) {
      envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
}

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to convert date format from PT-BR "03 de Junho, 2026" to ISO "2026-06-03T12:00:00.000Z"
function parseDateToISO(dateStr) {
  if (!dateStr) return new Date().toISOString();
  try {
    const cleanStr = dateStr.replace(/de/g, '').replace(/,/g, '').replace(/\s+/g, ' ').trim();
    const parts = cleanStr.split(' ');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const monthName = parts[1].toLowerCase();
      const year = parts[2];
      const months = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
        'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
      };
      const month = months[monthName] || '05';
      return `${year}-${month}-${day}T12:00:00.000Z`;
    }
  } catch (e) {
    console.warn('Failed parsing date:', dateStr, e);
  }
  return new Date().toISOString();
}

async function run() {
  console.log('Fetching current blog posts from Firestore...');
  const snap = await getDocs(collection(db, 'blog_posts'));
  const existingSlugs = new Set();
  snap.forEach(doc => {
    const data = doc.data();
    if (data.slug) {
      existingSlugs.add(data.slug);
    }
  });

  console.log(`Firestore has ${existingSlugs.size} posts.`);
  console.log(`Local static posts count: ${posts.length}`);

  let addedCount = 0;
  for (const post of posts) {
    if (post.status === 'draft') {
      console.log(`Skipping draft post: ${post.slug}`);
      continue;
    }

    if (!existingSlugs.has(post.slug)) {
      console.log(`Syncing post: ${post.slug}...`);
      const postDocRef = doc(collection(db, 'blog_posts'), `static_${post.slug}`);
      
      const docData = {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || '',
        metaDescription: post.metaDescription || post.excerpt || '',
        category: post.category || 'Geral',
        image: post.image || '/logo-cabeleireiro-de-cachos.png',
        date: post.date || '',
        content: post.content || '',
        author: post.author || 'Jon',
        keywords: post.keywords || '',
        createdAt: parseDateToISO(post.date)
      };

      if (post.faqSchema) {
        docData.faqSchema = post.faqSchema;
      }

      await setDoc(postDocRef, docData);
      console.log(`Successfully synced: ${post.slug}`);
      addedCount++;
    }
  }

  console.log(`Sync complete. Added ${addedCount} posts to Firestore.`);
}

run().catch(console.error);
