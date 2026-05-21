  // scripts/prerender.js
// Gera HTML estático com meta tags únicos para cada rota
// Roda automaticamente após `vite build` via postbuild

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// =====================
// PÁGINAS ESTÁTICAS
// =====================
const staticRoutes = [
  {
    path: 'servicos',
    title: 'Corte Cacheado em BH | Serviços | Studio do Jon',
    description: 'Corte técnico para cabelo cacheado, crespo e ondulado em BH. Leitura de Fio antes de tocar. Deva Cut, Wolf Cut, corte a seco. Studio do Jon, Caiçara.',
    canonical: 'https://www.ojonquecortou.com.br/servicos',
  },
  {
    path: 'sobre',
    title: 'Jon | Cabeleireiro Especialista em Cachos em BH | O Jon que Cortou',
    description: 'Jon é especialista em cachos e crespos em BH. Lê o padrão de fio antes de cortar. Método Leitura de Fio: 7 etapas de diagnóstico. Studio do Jon, Caiçara.',
    canonical: 'https://www.ojonquecortou.com.br/sobre',
  },
  {
    path: 'blog',
    title: 'Blog de Cabelo Cacheado | Dicas do Jon que Cortou',
    description: 'Dicas de cabelo cacheado, crespo e ondulado direto do especialista. Jon explica cortes, químicas e cuidados sem enrolação. O Jon que Cortou, BH.',
    canonical: 'https://www.ojonquecortou.com.br/blog',
  },
  {
    path: 'depoimentos',
    title: 'Resultados Reais em Cachos e Crespos | Studio do Jon BH',
    description: 'Veja os resultados reais de clientes do Studio do Jon em BH. Cachos, crespos e ondulados transformados com Leitura de Fio. Agende já.',
    canonical: 'https://www.ojonquecortou.com.br/depoimentos',
  },
  {
    path: 'galeria',
    title: 'Galeria de Transformações | Cachos e Crespos | Studio do Jon BH',
    description: 'Antes e depois de cortes para cabelos cacheados, crespos e ondulados no Studio do Jon, BH. Técnica Leitura de Fio em ação.',
    canonical: 'https://www.ojonquecortou.com.br/galeria',
  },
  {
    path: 'agendar',
    title: 'Agendamento Online | O Jon que Cortou - Especialista em Cachos',
    description: 'Reserve seu horário online no Studio do Jon no Caiçara em BH. Especialista em corte a seco, visagismo e saúde para cabelos ondulados, cacheados e crespos.',
    canonical: 'https://www.ojonquecortou.com.br/agendar',
  },
];

// =====================
// EXTRAIR POSTS VIA REGEX
// =====================
const postsContent = fs.readFileSync(
  path.join(__dirname, '../src/data/posts.js'),
  'utf-8'
);

function extractField(content, fieldName) {
  const results = [];
  const regex = new RegExp(`${fieldName}:\\s*[\`'"]([^\`'"\\n]+)[\`'"]`, 'g');
  let match;
  while ((match = regex.exec(content)) !== null) {
    results.push(match[1]);
  }
  return results;
}

const slugs    = extractField(postsContent, 'slug');
const titles   = extractField(postsContent, 'title');
const metas    = extractField(postsContent, 'metaDescription');
const excerpts = extractField(postsContent, 'excerpt');

// =====================
// INJETOR DE META TAGS
// =====================

function injectMeta(html, { title, description, canonical }) {
  let r = html;
  const esc = (s) => s.replace(/\$/g, '$$$$');
  r = r.replace(/<title>[^<]*<\/title>/, '<title>' + esc(title) + '</title>');
  r = r.replace(/(<meta name="description" content=")[^"]*/,  '$1' + esc(description));
  r = r.replace(/(<meta property="og:title" content=")[^"]*/,  '$1' + esc(title));
  r = r.replace(/(<meta property="og:description" content=")[^"]*/,  '$1' + esc(description));
  r = r.replace(/(<meta property="og:url" content=")[^"]*/,  '$1' + esc(canonical));
  if (r.includes('rel="canonical"')) {
    r = r.replace(/(<link rel="canonical" href=")[^"]*/,  '$1' + esc(canonical));
  } else {
    r = r.replace('</head>', '  <link rel="canonical" href="' + canonical + '" />\n  </head>');
  }
  return r;
}

// GERAR HTMLs ESTÁTICOS
let count = 0;

for (const route of staticRoutes) {
  const html = injectMeta(indexHtml, { title: route.title, description: route.description, canonical: route.canonical });
  const dir = path.join(distDir, route.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('✓ /' + route.path);
  count++;
}

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  if (!slug) continue;
  const title       = titles[i] + ' | Studio do Jon';
  const description = metas[i] || excerpts[i] || '';
  const canonical   = 'https://www.ojonquecortou.com.br/blog/' + slug;
  const html = injectMeta(indexHtml, { title, description, canonical });
  const dir  = path.join(distDir, 'blog/' + slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('✓ /blog/' + slug);
  count++;
}

console.log('\n✅ Prerendering concluído: ' + count + ' páginas com meta tags únicos');
