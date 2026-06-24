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

function optimizeTitleForSEO(rawTitle) {
  if (!rawTitle) return '';
  if (rawTitle.includes('| Studio do Jon')) return rawTitle;
  return `${rawTitle} | Studio do Jon`;
}

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
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
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
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
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
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Perguntas Frequentes — Studio do Jon</h1>
      <p>Respostas diretas sobre o Método Leitura de Fio, diagnóstico capilar e cuidados com cabelos ondulados, cacheados e crespos.</p>
      <dl>
`;
fullFaqList.forEach(faq => {
  faqBody += `
        <dt style="font-weight: bold; margin-top: 16px; font-size: 1.1rem;">${faq.q}</dt>
        <dd style="margin-left: 0; margin-top: 8px; color: #1a1310;">${faq.a}</dd>
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
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
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

const metodoBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Método Leitura de Fio — Studio do Jon</h1>
      <p>O Método Leitura de Fio não é meramente uma técnica de corte de cabelo, mas sim um protocolo clínico-estético e científico de análise capilar que precede qualquer intervenção com a tesoura. Desenvolvido para atender às complexidades biológicas, mecânicas e estruturais dos cabelos com curvatura (ondulados, cacheados, crespos e crespíssimos), este método visa decifrar o comportamento individual de cada fibra capilar. Para compreender a necessidade deste diagnóstico, é indispensável analisar a física, a biologia e a química do cabelo natural em Belo Horizonte.</p>
      
      <h2>A Física e a Mecânica do Cabelo com Curvatura</h2>
      <p>O comportamento tridimensional de um cacho é regido por leis físicas de tensão, elasticidade, gravidade e o que chamamos de "fator de encolhimento". Enquanto o cabelo liso cresce de forma cilíndrica e uniforme, exercendo uma força de tração linear e descendente orientada pela gravidade, o cabelo com curvatura se comporta como um sistema de molas helicoidais de diâmetros variáveis.</p>
      <p>Cada curva no fio de cabelo representa um ponto de concentração de tensão mecânica e de distribuição desigual de forças. Quando o cabelo está molhado, o peso da água rompe temporariamente as ligações de hidrogênio da fibra capilar, esticando a mola natural e mascarando o comprimento e o volume reais. Ao secar, as ligações de hidrogênio se reformam, e o fio encolhe. Esse encolhimento pode variar de 10% em cabelos ondulados até mais de 75% em cabelos crespos tipo 4C. Cortar o cabelo molhado sem compreender a física da sua mola individual resulta em assimetrias severas e na perda indesejada de comprimento, o famoso "efeito pirâmide" ou cortes excessivamente curtos. O Método Leitura de Fio mapeia essa força elástica antes da tesoura encostar no cabelo, prevendo com exatidão como cada mecha se comportará após a secagem e a finalização.</p>

      <h2>A Biologia Celular do Folículo Piloso e a Queratinização</h2>
      <p>A diferença fundamental entre os tipos de cabelo começa abaixo da pele, no folículo piloso. O folículo que dá origem ao cabelo liso é circular e perpendicular à superfície do couro cabeludo. Já o folículo de cabelos cacheados e crespos possui formato elíptico, achatado e curvo, assemelhando-se a um gancho ou uma letra "S".</p>
      <p>Esse formato elíptico força as células germinativas na matriz do bulbo capilar a se dividirem de maneira assimétrica. À medida que o fio é empurrado para cima através do canal folicular curvo, as células sofrem um processo de queratinização desigual. A queratina (proteína estrutural rica em cisteína) é depositada de forma irregular ao longo do diâmetro do fio. Há uma concentração maior de ortocórtex (células corticais com queratina mais flexível e ligações mais distendidas) na parte externa da curvatura, e de paracórtex (células com queratina mais rígida e ligações densas) na parte interna. Essa distribuição assimétrica cria uma curvatura intrínseca na fibra. Além disso, a seção transversal do fio não é perfeitamente redonda: nos cabelos ondulados ela é ovalada, nos cacheados é elíptica e nos crespos é achatada e irregular. Essa variação geométrica torna o fio de cabelo inerentemente suscetível a pontos de fragilidade mecânica em cada dobra da espiral, onde a cutícula é naturalmente mais fina e exposta.</p>

      <h2>O Diagnóstico Técnico de Porosidade e Elasticidade</h2>
      <p>Para estruturar um cronograma capilar eficiente e executar um corte seguro, o Método Leitura de Fio realiza um mapeamento detalhado da integridade da fibra capilar em duas frentes fundamentais: porosidade e elasticidade.</p>
      <ul>
        <li><strong>Porosidade Capilar:</strong> Refere-se à capacidade da cutícula (a camada externa de escamas sobrepostas do fio) de absorver e reter umidade e nutrientes.
          <ul>
            <li><strong>Baixa Porosidade:</strong> As cutículas estão extremamente compactadas e fechadas, dificultando a penetração da água ou de agentes hidratantes, mas retendo-os por muito tempo uma vez que conseguem entrar. Exige técnicas de calor ameno ou produtos de base aquosa com baixo peso molecular.</li>
            <li><strong>Média Porosidade:</strong> As cutículas estão levemente abertas, permitindo uma absorção equilibrada e retenção ideal de tratamentos. É o estado de saúde ideal do fio natural.</li>
            <li><strong>Alta Porosidade:</strong> As cutículas estão abertas, danificadas ou ausentes devido a agressões químicas (como descolorações ou relaxamentos) ou físicas (exposição solar, calor excessivo). O fio absorve água instantaneamente, mas a perde com a mesma velocidade, tornando-se seco, áspero e opaco. Necessita de reposição lipídica profunda e selamento cuticular ácido para reter a hidratação.</li>
          </ul>
        </li>
        <li><strong>Elasticidade Capilar:</strong> É a capacidade do fio de se alongar sob tensão mecânica e retornar ao seu estado original sem se romper. Em nossa análise, realizamos testes mecânicos suaves no fio úmido. Se o fio estica e não volta, ou se parte com facilidade ao menor esforço, há uma deficiência severa de proteínas estruturais (queratina). Nesses casos, procedimentos químicos como descolorações são expressamente contraindicados, priorizando-se a reconstrução ácida imediata. Se o fio está rígido, duro e quebra sem apresentar qualquer flexibilidade, há um excesso de queratina ou falta de hidratação lipídica, exigindo tratamentos amaciantes e nutritivos.</li>
      </ul>

      <h2>O Mapeamento de Curvaturas (Sistemas de Classificação)</h2>
      <p>Embora as tabelas de classificação (2A a 4C) sirvam como ponto de partida acadêmico, o Método Leitura de Fio vai além ao identificar que uma única cabeça frequentemente abriga múltiplos padrões de curvatura.</p>
      <ul>
        <li><strong>Cabelos Ondulados (Tipo 2):</strong> Possuem padrão em formato de "S" suave. São caracterizados por uma raiz mais lisa e ondas que começam no comprimento. Exigem cortes que tragam leveza e retirem o peso excessivo das pontas sem criar frizz, pois o excesso de peso estica a onda, fazendo com que o cabelo perca definição e pareça sem forma.</li>
        <li><strong>Cabelos Cacheados (Tipo 3):</strong> Apresentam espirais bem definidas desde a raiz ou do meio do fio. O fator de encolhimento é moderado a alto. O maior desafio é a distribuição natural da oleosidade produzida pelas glândulas sebáceas do couro cabeludo, que não consegue percorrer a extensão em espiral do fio, tornando o comprimento e as pontas naturalmente secos. Exigem corte híbrido com graduações precisas para distribuir o volume harmonicamente.</li>
        <li><strong>Cabelos Crespos e Crespíssimos (Tipo 4):</strong> Possuem curvatura extremamente estreita, em formato de "Z" ou pequenas molas muito compactas. O fator de encolhimento é altíssimo e a fibra é extremamente fina e delicada, apesar da aparência volumosa. O corte para cabelos crespos exige precisão milimétrica e escultura geométrica que valorize o volume imponente, respeitando a fragilidade estrutural do fio.</li>
      </ul>

      <h2>O Visagismo Integrado ao Cabelo Natural</h2>
      <p>Cortar cachos não é apenas uma questão de engenharia capilar; é uma arte de comunicação visual. O visagismo aplicado no Método Leitura de Fio analisa as proporções áureas do rosto, as linhas de força (horizontais, verticais e diagonais) e a linguagem não-verbal que o corte transmite.</p>
      <ul>
        <li><strong>Linhas Verticais e Diagonais Longas:</strong> Transmitem força, dinamismo e alongam a silhueta facial. Indicadas para suavizar rostos redondos ou mandíbulas proeminentes.</li>
        <li><strong>Linhas Horizontais:</strong> Criam estabilidade, peso e alargam visualmente o rosto. Excelentes para equilibrar rostos longos ou testas proeminentes.</li>
        <li><strong>Volume Superior:</strong> Eleva o olhar, transmite autoridade e alongam o perfil.</li>
        <li><strong>Volume Lateral:</strong> Suaviza traços angulares e traz suavidade e acolhimento à imagem pessoal.</li>
      </ul>
      <p>Ao unir a biologia do folículo, a física da mola capilar, a química dos tratamentos e as proporções do visagismo, o Studio do Jon garante que seu cabelo seja cortado de forma personalizada, funcional e livre de fórmulas genéricas. O Método Leitura de Fio devolve a liberdade e a saúde natural dos seus cachos no bairro Caiçara em Belo Horizonte.</p>
    </article>
  </noscript>
`;


// Global organization / local business schema graphs
const localBusinessSchema = {
  "@type": ["HairSalon", "LocalBusiness"],
  "@id": "https://www.ojonquecortou.com.br/#localbusiness",
  "name": "O Jon que Cortou — Studio do Jon",
  "alternateName": "Studio do Jon",
  "url": "https://www.ojonquecortou.com.br",
  "logo": "https://www.ojonquecortou.com.br/logo.png",
  "image": "https://www.ojonquecortou.com.br/jon-perfil.webp",
  "telephone": "+55 31 3586-6673",
  "email": "contato@ojonquecortou.com.br",
  "priceRange": "$$",
  "hasMap": "https://www.google.com/maps?cid=16629671607593282841",
  "sameAs": [
    "https://www.instagram.com/ojonquecortou/",
    "https://www.facebook.com/ojonquecortou/",
    "https://linktr.ee/ojonquecortou",
    "https://www.google.com/maps?cid=16629671607593282841"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Francisco Ovídio, 184, Caiçara",
    "addressLocality": "Belo Horizonte",
    "addressRegion": "MG",
    "postalCode": "30770-040",
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
  ],
  "knowsAbout": [
    "Corte de cabelo cacheado",
    "Corte Híbrido",
    "Transição capilar",
    "Visagismo para cachos",
    "Coloração em cabelo cacheado",
    "Método Leitura de Fio"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "272",
    "bestRating": "5",
    "worstRating": "1"
  },
  "founder": {
    "@type": "Person",
    "@id": "https://www.ojonquecortou.com.br/#jonatan",
    "name": "Jonatan Junior",
    "alternateName": "Jon",
    "jobTitle": "Cabeleireiro especialista em cabelos cacheados, crespos e ondulados",
    "description": "Criador do Método Leitura de Fio, processo de diagnóstico capilar em 7 etapas realizado antes de qualquer corte. Especialista em corte com visagismo e descoloração para cabelos texturizados (curvaturas 2A a 4C).",
    "worksFor": { "@id": "https://www.ojonquecortou.com.br/#localbusiness" },
    "knowsAbout": [
      "corte para cabelo cacheado",
      "visagismo",
      "descoloração em cabelo texturizado",
      "transição capilar",
      "Método Leitura de Fio"
    ],
    "sameAs": [
      "https://www.instagram.com/ojonquecortou/",
      "https://www.facebook.com/ojonquecortou/",
      "https://linktr.ee/ojonquecortou",
      "https://www.google.com/maps?cid=16629671607593282841"
    ]
  },
  "areaServed": {
    "@type": "City",
    "name": "Belo Horizonte"
  }
};

const founderPersonSchema = {
  "@type": "Person",
  "@id": "https://www.ojonquecortou.com.br/#person",
  "name": "Jonatan Junior",
  "image": "https://www.ojonquecortou.com.br/jon-perfil.webp",
  "jobTitle": "Cabeleireiro Especialista em Cachos",
  "description": "Jonatan Junior (O Jon) é especialista em curvaturas e visagismo no bairro Caiçara, Belo Horizonte. Criador do Método Leitura de Fio.",
  "worksFor": {
    "@id": "https://www.ojonquecortou.com.br/#localbusiness"
  },
  "sameAs": [
    "https://www.instagram.com/ojonquecortou/",
    "https://www.facebook.com/ojonquecortou/",
    "https://linktr.ee/ojonquecortou",
    "https://www.google.com/maps?cid=16629671607593282841"
  ]
};

const fallbackReviews = [
  {
    author_name: "Claudia Dantas",
    text: "Fiquei encantada com o Jon. Nos meus quase 60 anos de vida, nunca ninguém cortou tão bem meu cabelo! E finalmente entendi como meus cachos funcionam. Ele é ESPETACULAR!!!!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Crespo · BH"
  },
  {
    author_name: "Maria Isabel",
    text: "Olha, eu tinha expectativas mas elas foram superadas. Indico muito corte com tratamento porque faz muita diferença. Meu cabelo chegou xoxo e anêmico e saiu lindíssimo.",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cacheado · BH"
  },
  {
    author_name: "Fernanda Baiao",
    text: "O Jon é fantástico! Super educado, atencioso, tem uma escuta super ativa, me entendeu, entendeu meu cabelo e me ensinou a finalizar de uma forma muito mais simples do que eu jamais imaginei! Amei o corte, valorizou demais meus cachos!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Ondulado · BH"
  },
  {
    author_name: "Ana Beatriz",
    text: "Eu amei o resultado, o Jon foi super gentil do início ao fim, ele é uma pessoa muito legal de conversar. Além disso, foi explicando o que estava fazendo e a técnica que usava. Me senti muito segura e super recomendo!!!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cacheado · Caiçara"
  },
  {
    author_name: "Bernardo Pereira",
    text: "Atendimento ótimo! Entendeu minhas necessidades e me ajudou no cuidado do meu cabelo, super leve e descontraído.",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cabelo masculino · BH"
  },
  {
    author_name: "Cristinna da Silva",
    text: "Incrível! Excelente profissional, atencioso! Fiz corte e coloração, e o resultado foi melhor que o esperado! Jon é muuuito talentoso! Recomendo, com toda certeza!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Coloração · BH"
  },
  {
    author_name: "Thaisa Macedo",
    text: "Profissional maravilhoso, muito agradável e cuidadoso. Gostei muito!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cacheado · BH"
  }
];

let reviewsBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Experiências de Clientes no Studio do Jon</h1>
      <p>Depoimentos e avaliações reais de clientes com cabelos cacheados, crespos e ondulados em Belo Horizonte.</p>
      <div style="display: grid; gap: 20px; margin-top: 20px;">
`;
fallbackReviews.forEach(r => {
  reviewsBody += `
        <div style="border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 8px;">
          <h3>${r.author_name} — <small>${r.curl_type}</small></h3>
          <p style="color: #c8852a;">Nota: ${"★".repeat(r.rating)} (${r.rating}/5)</p>
          <p style="font-style: italic;">"${r.text}"</p>
        </div>
  `;
});
reviewsBody += `
      </div>
    </article>
  </noscript>
`;

const reviewsSchema = {
  "@context": "https://schema.org",
  "@graph": [
    localBusinessSchema,
    ...fallbackReviews.map(r => ({
      "@type": "Review",
      "itemReviewed": {
        "@type": "HairSalon",
        "name": "Studio do Jon",
        "image": "https://www.ojonquecortou.com.br/jon-perfil.webp",
        "telephone": "+553135866673",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Rua Francisco Ovídio, 184",
          "addressLocality": "Belo Horizonte",
          "addressRegion": "MG",
          "postalCode": "30770-040",
          "addressCountry": "BR"
        }
      },
      "author": {
        "@type": "Person",
        "name": r.author_name
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating.toString(),
        "bestRating": "5"
      },
      "reviewBody": r.text
    }))
  ]
};


const homeBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Especialista em Cabelo Cacheado, Crespo e Ondulado em Belo Horizonte</h1>
      <p>Jonatan Junior, o Jon, é cabeleireiro especialista em cabelos ondulados, cacheados e crespos no bairro Caiçara, Belo Horizonte (MG). Criador do Método Leitura de Fio — diagnóstico capilar em 7 etapas realizado antes de qualquer corte. Atende todas as curvaturas, do tipo 2A ao 4C. Não realiza alisamento, relaxamento ou qualquer procedimento de modificação da curvatura.</p>
      <h2>Serviços Principais</h2>
      <ul>
        <li><strong>Corte com o Jon</strong> — R$ 190. Inclui Leitura de Fio completa, corte e finalização educativa.</li>
        <li><strong>Leitura de Fio</strong> — R$ 80 (revertido em crédito se fechar serviço). Diagnóstico exclusivo de 7 etapas.</li>
        <li><strong>Combo Corte + Tratamento</strong> — R$ 320. Corte especializado com tratamento de alta performance.</li>
        <li><strong>Descoloração em Cabelo Cacheado</strong> — A partir de R$ 699. Com diagnóstico de porosidade e histórico químico.</li>
        <li><strong>Tratamento Personalizado</strong> — R$ 130. Hidratação, nutrição ou reconstrução conforme diagnóstico.</li>
      </ul>
      <h2>O Método Leitura de Fio</h2>
      <p>Antes de qualquer tesoura, o Studio do Jon realiza 7 etapas de análise: escuta, análise a seco, diagnóstico do couro cabeludo, histórico químico, análise molhada, definição de técnica e finalização como validação. Esse diagnóstico é incluso em todo atendimento, sem custo extra.</p>
      <h2>Localização e Agendamento</h2>
      <p>Studio do Jon · Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte, MG · CEP 30770-040. Telefone: (31) 3586-6673. Agendamento online: ojonquecortou.com.br/agendar. Instagram: @ojonquecortou.</p>
      <p>Avaliação média: 4.9 estrelas com base em 272 avaliações no Google.</p>
    </article>
  </noscript>
`;


// Definition of static pages with their specific metadata
const pages = [
  {
    route: '/',
    title: 'Especialista em Cabelo Cacheado BH | Studio do Jon',
    description: 'Salão especialista em cabelos ondulados, cacheados e crespos em Belo Horizonte (Caiçara). Corte a seco, visagismo e transição capilar.',
    bodyInsert: homeBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        localBusinessSchema,
        founderPersonSchema,
        {
          "@type": "WebSite",
          "@id": "https://www.ojonquecortou.com.br/#website",
          "name": "Studio do Jon",
          "url": "https://www.ojonquecortou.com.br",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.ojonquecortou.com.br/blog?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }
      ]
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
      "@type": "Person",
      "name": "Jonatan Junior",
      "image": "https://www.ojonquecortou.com.br/jon-perfil.webp",
      "alternateName": "Jon",
      "jobTitle": "Especialista em cabelos ondulados, cacheados e crespos",
      "description": "Cabeleireiro especialista em cabelos cacheados, crespos e ondulados em Belo Horizonte. Criador do Método Leitura de Fio — diagnóstico capilar em 7 etapas antes de qualquer corte.",
      "worksFor": {
        "@type": "HairSalon",
        "name": "Studio do Jon",
        "url": "https://www.ojonquecortou.com.br"
      },
      "url": "https://www.ojonquecortou.com.br/sobre",
      "image": "https://www.ojonquecortou.com.br/jon-perfil.webp",
      "sameAs": [
        "https://www.instagram.com/ojonquecortou/",
        "https://www.facebook.com/ojonquecortou/",
        "https://linktr.ee/ojonquecortou",
        "https://www.google.com/maps?cid=16629671607593282841"
      ],
      "knowsAbout": [
        "Método Leitura de Fio",
        "Corte a seco para cabelos cacheados",
        "Visagismo capilar",
        "Transição capilar",
        "Descoloração em cabelos cacheados",
        "Porosidade capilar",
        "Curvatura capilar tipos 2A ao 4C"
      ]
    }
  },
  {
    route: '/blog',
    title: 'Blog do Jon | Dicas e Cuidados para Cabelo Cacheado e Crespo',
    description: 'Dicas práticas, guias de produtos, técnicas de finalização e tudo o que você precisa saber sobre cabelos cacheados, crespos e ondulados.',
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Blog — Studio do Jon",
      "description": "Dicas e guias sobre cabelos ondulados, cacheados e crespos por Jonatan Junior, especialista em curvaturas em Belo Horizonte.",
      "url": "https://www.ojonquecortou.com.br/blog",
      "author": { "@id": "https://www.ojonquecortou.com.br/#jonatan" }
    }
  },
  {
    route: '/depoimentos',
    title: 'Depoimentos e Avaliações de Clientes | Studio do Jon BH',
    description: 'Depoimentos e avaliações de clientes do Studio do Jon em Belo Horizonte. Veja fotos e relatos reais sobre cortes, tratamentos e resultados.',
    bodyInsert: reviewsBody,
    schema: reviewsSchema
  },
  {
    route: '/faq',
    title: 'Perguntas Frequentes — Studio do Jon | Especialista em Cachos BH',
    description: 'Tire suas dúvidas sobre o Método Leitura de Fio, diagnóstico capilar, agendamento e cuidados com cabelo cacheado no Studio do Jon em Belo Horizonte.',
    bodyInsert: faqBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "name": "Perguntas Frequentes — Studio do Jon",
          "url": "https://www.ojonquecortou.com.br/faq",
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "dt", "dd"]
          }
        },
        {
          "@type": "FAQPage",
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", "dt"]
          },
          "mainEntity": fullFaqList.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        }
      ]
    }
  },
  {
    route: '/metodo',
    title: 'Método Leitura de Fio | Studio do Jon',
    description: 'O método exclusivo do Studio do Jon — 7 etapas de diagnóstico do fio antes de qualquer corte. Incluso em todo atendimento, sem custo extra.',
    bodyInsert: metodoBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "headline": "Método Leitura de Fio — Studio do Jon",
          "author": { "@id": "https://www.ojonquecortou.com.br/#jonatan" },
          "publisher": { "@id": "https://www.ojonquecortou.com.br/#localbusiness" },
          "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.ojonquecortou.com.br/metodo" },
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", ".howto-step-name"]
          }
        },
        {
          "@type": "HowTo",
          "name": "Método Leitura de Fio — 7 Etapas de Diagnóstico Capilar",
          "description": "Protocolo clínico-estético de análise capilar realizado antes de qualquer corte no Studio do Jon.",
          "totalTime": "PT30M",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Escuta", "text": "Ouvimos a história do cabelo, rotina de cuidados, histórico de procedimentos e objetivo do cliente." },
            { "@type": "HowToStep", "position": 2, "name": "Análise a seco", "text": "Mapeamos volume, caimento e distribuição real da curvatura com o cabelo seco e finalizado do cliente." },
            { "@type": "HowToStep", "position": 3, "name": "Diagnóstico do couro cabeludo", "text": "Avaliamos oleosidade, sensibilidade e saúde do couro para definir protocolos de limpeza adequados." },
            { "@type": "HowToStep", "position": 4, "name": "Histórico químico", "text": "Levantamos todo processo químico anterior: colorações, descolorações, relaxamentos e alisamentos." },
            { "@type": "HowToStep", "position": 5, "name": "Análise molhada", "text": "Testamos porosidade e elasticidade do fio úmido para identificar o estado real da fibra capilar." },
            { "@type": "HowToStep", "position": 6, "name": "Definição de técnica", "text": "Com base nas 5 etapas anteriores, definimos a técnica exata de corte: molhado, seco ou híbrido." },
            { "@type": "HowToStep", "position": 7, "name": "Finalização como validação", "text": "Finalizamos o cabelo para validar o corte na textura real do cliente e ensinar a rotina de casa." }
          ]
        }
      ]
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
    description: 'Fotos reais de antes e depois de cortes, mechas e tratamentos em cabelos cacheados, crespos and ondulados feitos pelo Jon.',
    bodyInsert: `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Galeria de Resultados — Studio do Jon</h1>
      <p>Veja fotos reais de antes e depois de cortes, mechas e tratamentos personalizados realizados em cabelos ondulados, cacheados e crespos. Todos os resultados apresentados são de clientes reais atendidos no Studio do Jon no bairro Caiçara, Belo Horizonte. Para agendar: <a href="/agendar">ojonquecortou.com.br/agendar</a></p>
    </article>
  </noscript>
`,
    schema: {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "name": "Galeria de Resultados — Studio do Jon",
      "description": "Fotos reais de antes e depois de cortes, mechas e tratamentos em cabelos cacheados e crespos atendidos pelo Jon em Belo Horizonte.",
      "author": { "@id": "https://www.ojonquecortou.com.br/#jonatan" },
      "url": "https://www.ojonquecortou.com.br/galeria"
    }
  },
  {
    route: '/servicos/descoloracao-cabelo-cacheado',
    title: 'Descoloração em Cabelo Cacheado em BH | Studio do Jon',
    description: 'Descoloração em cabelo cacheado em BH. Protocolo com avaliação de porosidade, histórico químico e textura para manter a saúde do cacho. Agende.'
  },
  {
    route: '/servicos/visagismo-cacheado',
    title: 'Visagismo para Cabelos Cacheados em BH | Studio do Jon',
    description: 'Visagismo para cabelos cacheados em Belo Horizonte. Analisamos seu formato de rosto, textura e rotina para planejar o corte ideal. Agende online.'
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
  }
];

// Add services dynamically
SEED_SERVICES.forEach(service => {
  const serviceDesc = service.description || `${service.name} no Studio do Jon em Belo Horizonte. Agende o seu atendimento online.`;
  const serviceSchema = {
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

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      serviceSchema,
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.ojonquecortou.com.br" },
          { "@type": "ListItem", "position": 2, "name": "Serviços", "item": "https://www.ojonquecortou.com.br/servicos" },
          { "@type": "ListItem", "position": 3, "name": service.name, "item": `https://www.ojonquecortou.com.br/servicos/${service.id}` }
        ]
      }
    ]
  };

  const serviceBody = `
    <noscript>
      <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
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
  
  const wordCount = post.content
    ? post.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
    : 0;


  const articleSchema = {
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
    "wordCount": wordCount,
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

  let pageSchema;
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.ojonquecortou.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.ojonquecortou.com.br/blog" },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://www.ojonquecortou.com.br/blog/${post.slug}` }
    ]
  };

  if (post.faqSchema) {
    pageSchema = {
      "@context": "https://schema.org",
      "@graph": [
        articleSchema,
        {
          "@type": "FAQPage",
          "mainEntity": post.faqSchema.mainEntity
        },
        breadcrumb
      ]
    };
  } else {
    pageSchema = {
      "@context": "https://schema.org",
      "@graph": [
        articleSchema,
        breadcrumb
      ]
    };
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
  const seoTitle = optimizeTitleForSEO(page.title);
  
  // 1. Replace title
  html = replaceTitle(html, seoTitle);
  
  // 2. Replace description
  html = replaceOrAddMeta(html, 'description', page.description, false);
  html = replaceOrAddMeta(html, 'og:description', page.description, true);
  html = replaceOrAddMeta(html, 'twitter:description', page.description, false);
  
  // 3. Replace OG URL
  html = replaceOrAddMeta(html, 'og:url', `https://www.ojonquecortou.com.br${page.route}`, true);
  
  // Fix og:type and add article meta for blog posts
  if (page.route.startsWith('/blog/')) {
    html = html.replace(
      '<meta property="og:type" content="website" />',
      '<meta property="og:type" content="article" />'
    );
    html = replaceOrAddMeta(html, 'article:author', 'Jonatan Junior', true);
    if (page.schema) {
      const datePublished = page.schema.datePublished || 
                            (page.schema['@graph'] && page.schema['@graph'][0] && page.schema['@graph'][0].datePublished) ||
                            '';
      if (datePublished) {
        html = replaceOrAddMeta(html, 'article:published_time', datePublished, true);
        html = replaceOrAddMeta(html, 'article:modified_time', new Date().toISOString().split('T')[0], true);
      }
    }
    html = replaceOrAddMeta(html, 'article:section', 'Cuidados Capilares', true);
  }
  
  // 3b. Replace/Add Canonical Link
  html = replaceOrAddCanonical(html, `https://www.ojonquecortou.com.br${page.route}`);

  // 4. Replace OG/Twitter titles
  html = replaceOrAddMeta(html, 'og:title', seoTitle, true);
  html = replaceOrAddMeta(html, 'twitter:title', seoTitle, false);
  
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

// Helper to generate the sitemap.txt dynamically (one URL per line)
function generateSitemapTxt(pagesList) {
  return pagesList.map(page => {
    return `https://www.ojonquecortou.com.br${page.route === '/' ? '' : page.route}`;
  }).join('\n');
}

console.log('Generating dynamic sitemap.xml...');
const sitemapXml = generateSitemap(pages);
fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemapXml);
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml);
console.log('Sitemap.xml generated and updated successfully in public/ and dist/!');

console.log('Generating dynamic sitemap.txt...');
const sitemapTxt = generateSitemapTxt(pages);
fs.writeFileSync(path.join(__dirname, '../public/sitemap.txt'), sitemapTxt);
fs.writeFileSync(path.join(distDir, 'sitemap.txt'), sitemapTxt);
console.log('Sitemap.txt generated and updated successfully in public/ and dist/!');
