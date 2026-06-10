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

const buildVersion = `build_${new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 12)}`;
console.log(`Prerender: Replacing BUILD_TIMESTAMP with ${buildVersion}`);
const template = fs.readFileSync(templatePath, 'utf-8').replace('BUILD_TIMESTAMP', buildVersion);

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

// Define complete structured FAQ questions and answers
const fullFaqList = [
  { q: "Com que frequência devo cortar cabelo cacheado?", a: "Para cabelos saudáveis, de 3 em 3 ou de 4 em 4 meses para manter o design. Se está em transição capilar ou tratando pontas muito danificadas, a cada 2 meses é o ideal para eliminar a quebra." },
  { q: "Corte a seco é melhor para cachos? Por quê?", a: "O corte depende de como o seu cabelo se comporta. Eu trabalho com o Corte Híbrido (feito molhado de precisão e lapidado a seco após a finalização). Cortar apenas seco ou molhado ignora a individualidade física de cada cacho. A decisão técnica do que fazer é tomada durante a Leitura de Fio." },
  { q: "O que é o Método Leitura de Fio?", a: "Minha metodologia exclusiva de 7 etapas de análise antes de a tesoura tocar no cabelo. Mapeamos porosidade, curvaturas, histórico químico e caimento real para definir a técnica exata do seu atendimento." },
  { q: "Atende cabelos 4C?", a: "Atendo todas as curvaturas. Cabelos crespos (tipo 4A, 4B, 4C) têm particularidades de volume e caimento que exigem técnicas específicas de precisão, seja no corte molhado ou seco. Sem alisamento disfarçado aqui." },
  { q: "Quanto tempo dura o atendimento?", a: "O corte completo integrado com o diagnóstico da Leitura de Fio leva por volta de 1h. Atendimento individual, focado em precisão técnica e sem pressa." },
  { q: "Faz transição capilar?", a: "Sim. Desenvolvemos cortes de transição progressiva que ajudam a equilibrar a raiz natural e as pontas com química, permitindo que você mude de forma confortável sem precisar recorrer ao Big Chop radical imediato, a menos que seja seu desejo." },
  { q: "Preciso lavar o cabelo antes de ir?", a: "Venha com o cabelo seco, lavado no dia anterior ou no dia da visita, desembaraçado e finalizado do seu jeito comum. Não use coques, tranças ou presilhas que marquem o caimento natural do cacho." },
  { q: "Atende homens?", a: "Sim. Temos serviço especializado em cortes masculinos focados em curvaturas e visagismo." },
  { q: "Como agendar?", a: "Agendamento direto e seguro pelo link /agendar. Selecione o serviço, o dia e a hora. Confirmação instantânea sem enrolação." },
  { q: "O que é visagismo para cachos?", a: "Técnica de planejar o corte e a distribuição de volumes baseada nas proporções faciais e na imagem que você quer transmitir, respeitando a física do cacho." },
  { q: "Faz química (progressiva, relaxamento)?", a: "Não. O Studio do Jon é focado em cabelos naturais e na sua saúde real. Não realizamos nenhum tipo de alisamento, relaxamento ou procedimento de modificação química da curvatura." },
  { q: "Qual a diferença de atendimento do Studio do Jon para outros salões?", a: "Não trabalhamos com fórmulas prontas ou cortes padronizados de revista. Cada corte é precedido pela Leitura de Fio, o que significa que ouvimos, analisamos e diagnosticamos o cabelo antes de decidir a técnica de corte. O foco é a sua identidade e a facilidade de cuidar do seu cabelo no dia a dia." }
];

// Content blocks for noscript body injection
const aboutBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #fff; background: #0a0a0a;">
      <h1>Muito Prazer, O Jon.</h1>
      <p>Especialista em curvaturas e visagismo no coração do bairro Caiçara, BH.</p>
      <h2>O Cabelo não mente. O corte errado, sim.</h2>
      <p>Se você procura um especialista em cachos em Belo Horizonte que realmente entenda a ciência por trás das curvaturas, prazer. Meu Studio é um refúgio para quem cansou de cortes genéricos e busca um atendimento personalizado para cabelos ondulados, cacheados e crespos.</p>
      <p>Não sou apenas um cabeleireiro. Sou um leitor de fios. No Caiçara (BH), construí um espaço focado na liberdade do seu fio natural, utilizando técnicas que respeitam o fator de encolhimento e a identidade de cada cliente.</p>
      <h2>Método & Técnica</h2>
      <ul>
        <li><strong>Leitura de Fio:</strong> Análise clínica de porosidade, espessura e saúde antes de qualquer tesoura.</li>
        <li><strong>Corte com Técnica:</strong> Escultura do volume real, garantindo que o visual funcione no seu dia a dia.</li>
        <li><strong>Visagismo:</strong> Harmonização do corte com o formato do seu rosto e sua personalidade.</li>
      </ul>
      <h2>Localização e Endereço</h2>
      <p>Studio do Jon · Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte, MG. Próximo ao metrô Gameleira e Avenida Pedro II. Telefone: (31) 3586-6673.</p>
    </article>
  </noscript>
`;

const investmentBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #fff; background: #0a0a0a;">
      <h1>Investimento — Studio do Jon</h1>
      <p>Antes de qualquer tesoura, vem o diagnóstico. O Método Leitura de Fio está incluído em todo atendimento — sem cobrança extra. O que você paga é pelo resultado que foi planejado desde o início.</p>
      <h2>Nossos Valores e Serviços</h2>
      <ul>
        <li><strong>Corte especializado:</strong> R$ 190 a R$ 230. Inclui Leitura de Fio completa (7 etapas), corte, finalização como validação.</li>
        <li><strong>Descoloração em cabelo cacheado:</strong> Sob consulta. Inclui diagnóstico de porosidade, análise de histórico químico, processo e finalização. Valor varia conforme comprimento e estado do fio.</li>
        <li><strong>Consultoria Leitura de Fio:</strong> Sob consulta. Para quem quer só o diagnóstico, sem corte. Inclui análise completa do fio e orientações de cuidado personalizadas.</li>
      </ul>
    </article>
  </noscript>
`;

// Build dynamically the FAQ body insert
let faqBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #fff; background: #0a0a0a;">
      <h1>Perguntas Frequentes — Studio do Jon</h1>
      <p>Respostas diretas sobre o Método Leitura de Fio, diagnóstico capilar e cuidados com cabelos ondulados, cacheados e crespos.</p>
      <dl>
`;
fullFaqList.forEach(faq => {
  faqBody += `
        <dt style="font-weight: bold; margin-top: 16px; font-size: 1.1rem;">${faq.q}</dt>
        <dd style="margin-left: 0; margin-top: 8px; color: #ccc;">${faq.a}</dd>
  `;
});
faqBody += `
      </dl>
    </article>
  </noscript>
`;

// Build dynamically the Services page body insert
let servicesBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #fff; background: #0a0a0a;">
      <h1>Nossos Serviços — Studio do Jon</h1>
      <p>Processos técnicos focados na saúde e na definição real do seu cacho. Especialidade em cabelos ondulados, cacheados e crespos em Belo Horizonte.</p>
      <div style="display: grid; gap: 24px; margin-top: 24px;">
`;
SEED_SERVICES.forEach(s => {
  servicesBody += `
        <div style="border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 8px;">
          <h2>${s.emoji || '✨'} ${s.name}</h2>
          <p style="color: #c8852a; font-weight: bold;">Preço: R$ ${s.price}</p>
          <p>${s.tagline || ''}</p>
          <p>${s.description}</p>
          ${s.includes && s.includes.length > 0 ? `<p><strong>O que inclui:</strong> ${s.includes.join(', ')}</p>` : ''}
        </div>
  `;
});
servicesBody += `
      </div>
    </article>
  </noscript>
`;

// Global organization / local business schema graphs
const localBusinessSchema = {
  "@type": ["HairSalon", "LocalBusiness"],
  "@id": "https://www.ojonquecortou.com.br/#localbusiness",
  "name": "O Jon que Cortou — Studio do Jon",
  "url": "https://www.ojonquecortou.com.br",
  "logo": "https://www.ojonquecortou.com.br/logo.png",
  "image": "https://www.ojonquecortou.com.br/jon-perfil.webp",
  "telephone": "+553135866673",
  "email": "contato@ojonquecortou.com.br",
  "priceRange": "$$",
  "hasMap": "https://www.google.com/maps?cid=16629671607593282841",
  "sameAs": [
    "https://www.instagram.com/ojonquecortou/",
    "https://www.facebook.com/ojonquecortou/",
    "https://linktr.ee/ojonquecortou"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Francisco Ovídio, 184",
    "addressLocality": "Belo Horizonte",
    "addressRegion": "MG",
    "postalCode": "30720-320",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -19.908634,
    "longitude": -43.967875
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "19:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "09:00",
      "closes": "17:00"
    }
  ]
};

const founderPersonSchema = {
  "@type": "Person",
  "@id": "https://www.ojonquecortou.com.br/#person",
  "name": "Jonatan Junior",
  "jobTitle": "Cabeleireiro Especialista em Cachos",
  "worksFor": {
    "@id": "https://www.ojonquecortou.com.br/#localbusiness"
  },
  "sameAs": [
    "https://www.instagram.com/ojonquecortou/"
  ]
};

// Definition of static pages with their specific metadata
const pages = [
  {
    route: '/',
    title: 'Especialista em Cabelo Cacheado BH | Studio do Jon',
    description: 'Salão especialista em cabelos ondulados, cacheados e crespos em Belo Horizonte (bairro Caiçara). Visagismo, corte a seco, transição capilar e tratamento personalizado.',
    schema: {
      "@context": "https://schema.org",
      "@graph": [localBusinessSchema, founderPersonSchema]
    }
  },
  {
    route: '/servicos',
    title: 'Serviços e Valores | Especialista em Cabelo Cacheado BH | Studio do Jon',
    description: 'Veja nossos serviços de corte de cabelo cacheado a seco, visagismo, tratamentos e coloração. Agende seu horário online no Studio do Jon em BH.',
    bodyInsert: servicesBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        localBusinessSchema,
        {
          "@type": "ItemList",
          "name": "Lista de Serviços do Studio do Jon",
          "numberOfItems": SEED_SERVICES.length,
          "itemListElement": SEED_SERVICES.map((s, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": {
              "@type": "Service",
              "name": s.name,
              "description": s.description,
              "offers": {
                "@type": "Offer",
                "price": s.price,
                "priceCurrency": "BRL"
              }
            }
          }))
        }
      ]
    }
  },
  {
    route: '/sobre',
    title: 'Sobre o Jonatan Junior | Especialista em Cachos BH | Studio do Jon',
    description: 'Conheça a história de Jonatan Junior, cabeleireiro especialista em cachos em Belo Horizonte. Criador do Método Leitura de Fio para cabelos naturais.',
    bodyInsert: aboutBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [localBusinessSchema, founderPersonSchema]
    }
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
    bodyInsert: faqBody,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": fullFaqList.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
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
      "provider": localBusinessSchema,
      "description": "O método exclusivo do Studio do Jon — 7 etapas de diagnóstico do fio antes de qualquer corte. Incluso em todo atendimento, sem custo extra.",
      "url": "https://www.ojonquecortou.com.br/metodo"
    }
  },
  {
    route: '/investimento',
    title: 'Investimento | Studio do Jon — Especialista em Cachos BH',
    description: 'Corte especializado com Método Leitura de Fio a partir de R$ 200. Descoloração e consultoria mediante consulta. Studio do Jon, Caiçaras, BH.',
    bodyInsert: investmentBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        localBusinessSchema,
        {
          "@type": "PriceSpecification",
          "name": "Corte especializado cabelo cacheado",
          "minPrice": "190",
          "maxPrice": "230",
          "priceCurrency": "BRL",
          "url": "https://www.ojonquecortou.com.br/investimento"
        }
      ]
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
  },
  {
    route: '/servicos/corte-hibrido',
    title: 'Corte Híbrido Cabelo Cacheado BH | Studio do Jon',
    description: 'Especialista em corte de cabelo cacheado em Belo Horizonte. Conheça o Corte Híbrido: molhado para precisão e seco para caimento. Agende já.'
  },
  {
    route: '/servicos/transicao-capilar',
    title: 'Transição Capilar BH | Studio do Jon — Especialista em Cachos',
    description: 'Passando pela transição capilar em BH? O Studio do Jon oferece cortes progressivos e suporte técnico para recuperar seus cachos com segurança. Agende.'
  },
  {
    route: '/servicos/visagismo-cachos',
    title: 'Visagismo Cabelo Cacheado Belo Horizonte | Studio do Jon',
    description: 'Valorize sua imagem através do visagismo para cabelos cacheados em Belo Horizonte. Cortes planejados para sua estrutura facial e rotina. Agende.'
  },
  {
    route: '/servicos/masculino',
    title: 'Corte Cabelo Cacheado Masculino BH | Studio do Jon',
    description: 'Especialista em corte masculino para cabelos cacheados e crespos em BH. Definição, praticidade e visagismo sem degradê genérico. Agende.'
  },
  {
    route: '/metodologia',
    title: 'Método Leitura de Fio | Studio do Jon — Cachos BH',
    description: 'Conheça a Leitura de Fio. Metodologia exclusiva do Jon em Belo Horizonte. Análise técnica de curvatura e porosidade antes de qualquer corte de cacho.'
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
    "provider": localBusinessSchema,
    "offers": {
      "@type": "Offer",
      "price": service.promoPrice || service.price,
      "priceCurrency": "BRL",
      "valueAddedTaxIncluded": "true"
    }
  };

  const serviceBody = `
    <noscript>
      <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #fff; background: #0a0a0a;">
        <h1>${service.name} em Belo Horizonte</h1>
        <p style="font-weight: bold; color: #ccc;">${service.tagline || ''}</p>
        <hr />
        <p>${service.description}</p>
        ${service.includes && service.includes.length > 0 ? `<p><strong>O que está incluso:</strong> ${service.includes.join(', ')}</p>` : ''}
      </article>
    </noscript>
  `;

  pages.push({
    route: `/servicos/${service.id}`,
    title: `${service.name} em BH | Studio do Jon`,
    description: serviceDesc.substring(0, 160),
    bodyInsert: serviceBody,
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
    "author": founderPersonSchema,
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

  let pageSchema = articleSchema;
  if (post.faqSchema) {
    pageSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          ...articleSchema,
          "@context": undefined // remove context for sub-items in @graph
        },
        {
          "@type": "FAQPage",
          "mainEntity": post.faqSchema.mainEntity
        }
      ]
    };
    // Clean up the undefined context property
    delete pageSchema["@graph"][0]["@context"];
  }

  pages.push({
    route: `/blog/${post.slug}`,
    title: post.title,
    description: postDesc,
    image: post.image,
    schema: pageSchema,
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
