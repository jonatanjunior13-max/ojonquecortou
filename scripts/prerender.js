import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { posts } from '../src/data/posts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('Error: dist/index.html template not found! Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf-8');

// Helper to replace or add a meta tag in the HTML head
function replaceOrAddMeta(html, nameOrProperty, content, isProperty = false) {
  if (!content) return html;
  const attrName = isProperty ? 'property' : 'name';
  const cleanContent = content.replace(/"/g, '&quot;').replace(/\n/g, ' ').trim();
  const regex = new RegExp(`<meta\\s+${attrName}=["']${nameOrProperty}["']\\s+content=["'].*?["']\\s*\\/?>`, 'i');
  const newTag = `<meta ${attrName}="${nameOrProperty}" content="${cleanContent}" />`;
  if (regex.test(html)) {
    return html.replace(regex, newTag);
  } else {
    // Inject before </head>
    return html.replace('</head>', `    ${newTag}\n  </head>`);
  }
}

// Helper to replace the title tag
function replaceTitle(html, title) {
  if (!title) return html;
  const cleanTitle = title.replace(/"/g, '&quot;').trim();
  const regex = /<title>.*?<\/title>/i;
  if (regex.test(html)) {
    return html.replace(regex, `<title>${cleanTitle}</title>`);
  }
  return html.replace('</head>', `    <title>${cleanTitle}</title>\n  </head>`);
}

// Helper to convert date format from PT-BR "02 de Junho, 2026" to ISO "2026-06-02"
function parseDateToISO(dateStr) {
  if (!dateStr) return "2026-05-14";
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
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.warn('Failed parsing date:', dateStr, e);
  }
  return "2026-05-14";
}

// Definition of static pages with their specific metadata
const pages = [
  {
    route: '/servicos',
    title: 'Serviços e Valores | Especialista em Cabelo Cacheado BH | Studio do Jon',
    description: 'Veja nossos serviços de corte de cabelo cacheado a seco, visagismo, tratamentos e coloração. Agende seu horário online no Studio do Jon em BH.'
  },
  {
    route: '/sobre',
    title: 'Sobre o Jonatan Junior | Especialista em Cachos BH | Studio do Jon',
    description: 'Conheça a história de Jonatan Junior, cabeleireiro especialista em cachos em Belo Horizonte. Criador do Método Leitura de Fio para cabelos naturais.'
  },
  {
    route: '/blog',
    title: 'Blog do Jon | Dicas e Cuidados para Cabelo Cacheado e Crespo',
    description: 'Dicas práticas, guias de produtos, técnicas de finalização e tudo o que você precisa saber sobre cabelos cacheados, crespos e ondulados.'
  },
  {
    route: '/depoimentos',
    title: 'Depoimentos e Avaliações de Clientes | Studio do Jon BH',
    description: 'Veja o que nossas clientes dizem sobre suas experiências de corte e tratamento de cachos com o Jon em Belo Horizonte. Avaliações reais de quem ama seus cachos.'
  },
  {
    route: '/galeria',
    title: 'Galeria de Resultados | Cortes de Cabelo Cacheado BH | Studio do Jon',
    description: 'Fotos reais de antes e depois de cortes, mechas e tratamentos em cabelos cacheados, crespos e ondulados feitos pelo Jon.'
  }
];

// Add blog posts dynamically
posts.forEach(post => {
  const postDesc = post.metaDescription || `${post.excerpt || post.title}. Conquiste definição, brilho e volume ideal. Especialista em cachos em Belo Horizonte explica.`;
  const isoDate = parseDateToISO(post.date);
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": postDesc,
    "image": post.image.startsWith('http') ? post.image : `https://www.ojonquecortou.com.br${post.image}`,
    "author": {
      "@type": "Person",
      "name": "Jonatan Junior",
      "url": "https://www.ojonquecortou.com.br/sobre"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Studio do Jon",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.ojonquecortou.com.br/logo-cabeleireiro-de-cachos.png"
      }
    },
    "datePublished": post.datePublished || isoDate,
    "dateModified": post.dateModified || isoDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.ojonquecortou.com.br/blog/${post.slug}`
    }
  };

  const noscriptContent = `
    <noscript>
      <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h1>${post.title}</h1>
        <p style="font-weight: bold; color: #555;">${post.excerpt || ''}</p>
        <hr />
        <div>${post.content}</div>
      </article>
    </noscript>
  `;

  pages.push({
    route: `/blog/${post.slug}`,
    title: post.title,
    description: postDesc,
    image: post.image,
    schema: articleSchema,
    bodyInsert: noscriptContent
  });
});

console.log(`Starting Node SEO pre-rendering for ${pages.length} pages...`);

pages.forEach(page => {
  let html = template;
  
  // 1. Replace title
  html = replaceTitle(html, page.title);
  
  // 2. Replace description
  html = replaceOrAddMeta(html, 'description', page.description, false);
  html = replaceOrAddMeta(html, 'og:description', page.description, true);
  html = replaceOrAddMeta(html, 'twitter:description', page.description, false);
  
  // 3. Replace OG URL
  html = replaceOrAddMeta(html, 'og:url', `https://www.ojonquecortou.com.br${page.route}`, true);
  
  // 4. Replace OG/Twitter titles
  html = replaceOrAddMeta(html, 'og:title', page.title, true);
  html = replaceOrAddMeta(html, 'twitter:title', page.title, false);
  
  // 5. Replace image tags
  if (page.image) {
    const fullImageUrl = page.image.startsWith('http') ? page.image : `https://www.ojonquecortou.com.br${page.image}`;
    html = replaceOrAddMeta(html, 'og:image', fullImageUrl, true);
    html = replaceOrAddMeta(html, 'twitter:image', fullImageUrl, false);
    html = replaceOrAddMeta(html, 'twitter:card', 'summary_large_image', false);
  }
  
  // 6. Inject LD+JSON Schema
  if (page.schema) {
    const schemaScript = `\n    <script type="application/ld+json" id="dynamic-page-schema">\n    ${JSON.stringify(page.schema, null, 2).replace(/\n/g, '\n    ')}\n    </script>`;
    html = html.replace('</head>', `${schemaScript}\n  </head>`);
  }
  
  // 7. Inject Noscript Body Content for Crawlers
  if (page.bodyInsert) {
    html = html.replace('<div id="root">', `<div id="root">\n      ${page.bodyInsert.trim()}`);
  }
  
  // Write index.html inside the route directory
  const relativeRoute = page.route.startsWith('/') ? page.route.substring(1) : page.route;
  const routeDir = path.join(distDir, relativeRoute);
  
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
});

console.log('Static pre-rendering completed successfully!');
