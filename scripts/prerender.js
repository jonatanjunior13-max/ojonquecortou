import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { posts } from '../src/data/posts.js';
import { SEED_SERVICES } from '../src/data/seedServices.js';

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

// Helper to replace or add a canonical link tag in the HTML head
function replaceOrAddCanonical(html, url) {
  if (!url) return html;
  const regex = /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i;
  const newTag = `<link rel="canonical" href="${url}" />`;
  if (regex.test(html)) {
    return html.replace(regex, newTag);
  } else {
    return html.replace('</head>', `    ${newTag}\n  </head>`);
  }
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
    route: '/',
    title: 'Especialista em Cabelo Cacheado BH | Studio do Jon',
    description: 'Salão especialista em cabelos ondulados, cacheados e crespos em Belo Horizonte (bairro Caiçara). Visagismo, corte a seco, transição capilar e tratamento personalizado.'
  },
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
    route: '/faq',
    title: 'Perguntas Frequentes — Studio do Jon | Especialista em Cachos BH',
    description: 'Tire suas dúvidas sobre o Método Leitura de Fio, diagnóstico capilar, agendamento e cuidados com cabelo cacheado no Studio do Jon em Belo Horizonte.',
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Leitura de Fio é um serviço pago?", "acceptedAnswer": { "@type": "Answer", "text": "Não. É parte do atendimento padrão do Studio do Jon. Todo corte começa com as 7 etapas, sempre." } },
        { "@type": "Question", "name": "Quanto tempo leva a Leitura de Fio?", "acceptedAnswer": { "@type": "Answer", "text": "Em média de 15 a 30 minutos antes do corte começar. Pode ser mais longa se o histórico for complexo." } },
        { "@type": "Question", "name": "Posso agendar só a Leitura de Fio sem marcar corte?", "acceptedAnswer": { "@type": "Answer", "text": "Sim. É possível agendar uma consulta de diagnóstico separada para entender o seu fio antes de decidir qualquer coisa." } },
        { "@type": "Question", "name": "A Leitura de Fio funciona para cabelo liso também?", "acceptedAnswer": { "@type": "Answer", "text": "O método foi desenvolvido especificamente para cabelos ondulados, cacheados e crespos, onde a variação de textura e histórico químico é mais complexa." } },
        { "@type": "Question", "name": "Posso usar condicionador em vez de máscara?", "acceptedAnswer": { "@type": "Answer", "text": "Pode, mas o condicionador apenas sela a cutícula. A máscara entrega tratamento. Se tiver que escolher um pro minimalismo, fique com a máscara e use uma quantidade menor." } },
        { "@type": "Question", "name": "E o óleo capilar?", "acceptedAnswer": { "@type": "Answer", "text": "Ele entra como o 'plus'. Se o seu cabelo é muito seco (comum em curvaturas 4), ele é o quarto elemento indispensável. Se não, a máscara já resolve." } }
      ]
    }
  },
  {
    route: '/metodo',
    title: 'Método Leitura de Fio | Studio do Jon',
    description: 'O método exclusivo do Studio do Jon — 7 etapas de diagnóstico do fio antes de qualquer corte. Incluso em todo atendimento, sem custo extra.',
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Método Leitura de Fio",
      "provider": {
        "@type": "LocalBusiness",
        "name": "Studio do Jon",
        "url": "https://www.ojonquecortou.com.br"
      },
      "description": "O método exclusivo do Studio do Jon — 7 etapas de diagnóstico do fio antes de qualquer corte. Incluso em todo atendimento, sem custo extra.",
      "url": "https://www.ojonquecortou.com.br/metodo"
    }
  },
  {
    route: '/investimento',
    title: 'Investimento | Studio do Jon — Especialista em Cachos BH',
    description: 'Corte especializado com Método Leitura de Fio a partir de R$ 200. Descoloração e consultoria mediante consulta. Studio do Jon, Caiçaras, BH.',
    schema: {
      "@context": "https://schema.org",
      "@type": "PriceSpecification",
      "name": "Corte especializado cabelo cacheado",
      "price": "190",
      "priceCurrency": "BRL",
      "url": "https://www.ojonquecortou.com.br/investimento"
    }
  },
  {
    route: '/galeria',
    title: 'Galeria de Resultados | Cortes de Cabelo Cacheado BH | Studio do Jon',
    description: 'Fotos reais de antes e depois de cortes, mechas e tratamentos em cabelos cacheados, crespos and ondulados feitos pelo Jon.'
  },
  {
    route: '/servicos/descoloracao-cabelo-cacheado',
    title: 'Descoloração em Cabelo Cacheado em BH | Studio do Jon',
    description: 'Descoloração em cabelo cacheado feita com protocolo especializado em BH. O Studio do Jon avalia porosidade, histórico químico e textura antes de qualquer processo. Agende.'
  },
  {
    route: '/servicos/visagismo-cacheado',
    title: 'Visagismo para Cabelos Cacheados em BH | Studio do Jon',
    description: 'Visagismo especializado em cabelos cacheados em Belo Horizonte. O Studio do Jon analisa formato do rosto, textura e estilo de vida antes de definir o corte ideal para você.'
  }
];

// Add services dynamically
SEED_SERVICES.forEach(service => {
  const serviceDesc = service.description || `${service.name} no Studio do Jon em Belo Horizonte. Agende o seu atendimento online.`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "HairSalon",
      "name": "Studio do Jon",
      "url": "https://www.ojonquecortou.com.br"
    },
    "offers": {
      "@type": "Offer",
      "price": service.promoPrice || service.price,
      "priceCurrency": "BRL",
      "valueAddedTaxIncluded": "true"
    }
  };

  pages.push({
    route: `/servicos/${service.id}`,
    title: `${service.name} em BH | Studio do Jon`,
    description: serviceDesc.substring(0, 160),
    schema: schema
  });
});

// Add blog posts dynamically
posts.forEach(post => {
  const postDesc = post.metaDescription || `${post.excerpt || post.title}. Conquiste definição, brilho e volume ideal. Especialista em cachos em Belo Horizonte explica.`;
  const isoDate = parseDateToISO(post.date);
  const currentDate = new Date().toISOString().split('T')[0];
  
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
    "dateModified": currentDate,
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
  
  // 3b. Replace/Add Canonical Link
  html = replaceOrAddCanonical(html, `https://www.ojonquecortou.com.br${page.route}`);

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
    html = html.replace('<!-- Google Fonts -->', `${schemaScript}\n\n    <!-- Google Fonts -->`);
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

// Helper to generate the sitemap.xml dynamically
function generateSitemap(pagesList) {
  const currentDate = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  pagesList.forEach(page => {
    const loc = `https://www.ojonquecortou.com.br${page.route === '/' ? '' : page.route}`;
    let changefreq = 'monthly';
    let priority = '0.8';
    let lastmod = currentDate;
    
    if (page.route === '/') {
      changefreq = 'weekly';
      priority = '1.0';
    } else if (page.route === '/blog') {
      changefreq = 'daily';
      priority = '0.9';
    } else if (page.route === '/servicos' || page.route === '/sobre' || page.route === '/galeria' || page.route === '/depoimentos') {
      changefreq = 'weekly';
      priority = '0.9';
    } else if (page.route.startsWith('/blog/')) {
      changefreq = 'monthly';
      priority = '0.8';
      if (page.schema && page.schema.datePublished) {
        lastmod = page.schema.datePublished;
      }
    }
    
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>\n';
  return xml;
}

console.log('Generating dynamic sitemap.xml...');
const sitemapXml = generateSitemap(pages);
fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemapXml);
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml);
console.log('Sitemap.xml generated and updated successfully in public/ and dist/!');
