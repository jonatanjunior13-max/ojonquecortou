import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { posts } from '../src/data/posts.js';
import { SEED_SERVICES } from '../src/data/seedServices.js';
import { EXPANDED_SERVICE_BODIES, SEED_SERVICE_EXPANDED_BODIES } from '../src/data/expandedServiceBodies.js';

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

// Helper to build noscript bodyInsert + Service schema for manually-defined /servicos/* pages
// (distinct from the SEED_SERVICES.forEach-generated pages, which build their own serviceBody/schema)
function manualServiceBody({ name, text, route }) {
  return `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>${name} em Belo Horizonte</h1>
      <p>${text}</p>
      <h2>Entenda melhor o processo</h2>
      <ul>
        <li><a href="/metodo">Método Leitura de Fio</a> — diagnóstico técnico em 7 etapas antes de qualquer corte.</li>
        <li><a href="/blog">Blog do Jon</a> — artigos técnicos e guias sobre cuidados capilares.</li>
        <li><a href="/investimento">Investimento e Valores</a> — conheça nossos preços e pacotes.</li>
      </ul>
      <p><strong><a href="/agendar">Agende seu horário agora</a></strong></p>
    </article>
  </noscript>
`;
}

function manualServiceSchema({ name, description, route }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "name": name,
        "description": description,
        "provider": { "@id": "https://www.ojonquecortou.com.br/#localbusiness" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.ojonquecortou.com.br" },
          { "@type": "ListItem", "position": 2, "name": "Serviços", "item": "https://www.ojonquecortou.com.br/servicos" },
          { "@type": "ListItem", "position": 3, "name": name, "item": `https://www.ojonquecortou.com.br${route}` }
        ]
      }
    ]
  };
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
  { q: "Qual a diferença de atendimento do Studio do Jon para outros salões?", a: "Não trabalhamos com fórmulas prontas ou cortes padronizados de revista. Cada corte é precedido pela Leitura de Fio, o que significa que ouvimos, analisamos e diagnosticamos o cabelo antes de decidir a técnica de corte. O foco é a sua identidade e a facilidade de cuidar do seu cabelo no dia a dia." },
  { q: "Cabelo cacheado precisa de escova para 'domar' o volume?", a: "Não. Volume não é defeito a ser corrigido — é resultado de curvatura, densidade e de um corte mal ajustado ao formato do fio. Um corte técnico, feito após a Leitura de Fio, distribui o peso e organiza o volume sem precisar recorrer à escova ou à química alisante." },
  { q: "Qual a diferença entre cabelo ondulado, cacheado e crespo?", a: "É uma questão de curvatura do fio: ondulado (tipo 2A a 2C) forma ondas suaves, cacheado (tipo 3A a 3C) forma cachos definidos em espiral, e crespo (tipo 4A a 4C) tem curvatura mais fechada e maior fator de encolhimento. Atendemos todo esse espectro, do 2A ao 4C, cada um com técnica de corte própria." },
  { q: "Corte a seco funciona em qualquer tamanho de cabelo?", a: "Sim. O Corte Híbrido se adapta a qualquer comprimento, do curto ao longo. A decisão de cortar mais a seco ou mais molhado depende do comportamento do fio identificado na Leitura de Fio, não do tamanho do cabelo." },
  { q: "Quanto custa um corte no Studio do Jon?", a: "O Corte com o Jon (Leitura de Fio completa + corte técnico + finalização educativa) custa R$ 190. Há também o Combo Corte + Tratamento por R$ 230, e a Leitura de Fio isolada, sem corte, por R$ 80 (valor revertido em crédito caso feche o serviço na sequência)." },
  { q: "Quais os horários de atendimento e onde fica o Studio do Jon?", a: "Atendemos de segunda a sábado, das 9h às 19h. Ficamos na Rua Francisco Ovídio, 184, bairro Caiçaras, Belo Horizonte (MG), próximo ao metrô Gameleira e à Avenida Pedro II. Telefone: (31) 3586-6673." },
  { q: "Posso fazer só a Leitura de Fio, sem cortar?", a: "Sim. A consultoria de Leitura de Fio isolada custa R$ 80 e inclui o diagnóstico completo de porosidade, curvatura, histórico químico e orientações de cuidado, sem compromisso de corte. Se você decidir fechar o corte na sequência, o valor é revertido em crédito." },
  { q: "Como cuidar do cabelo depois do corte?", a: "Siga a rotina de manutenção mostrada na finalização educativa do próprio atendimento, que é ensinada durante o corte. Em linhas gerais: hidrate com regularidade conforme a porosidade identificada na Leitura de Fio, evite manipulação excessiva do fio seco e retome o cronograma de tratamento (hidratação, nutrição ou reconstrução) conforme o diagnóstico." },
  { q: "Quando devo voltar para manutenção do corte?", a: "O ideal é retornar de 3 em 3 ou de 4 em 4 meses para manter o design do corte. Se cortou há até 90 dias e quer só um retoque, oferecemos a Manutenção de Corte (R$ 130), voltada para quem já passou pela Leitura de Fio recentemente." },
  { q: "O que fazer se o cabelo ressecar ou perder definição depois do tratamento?", a: "Isso costuma indicar desequilíbrio entre hidratação e nutrição para a porosidade do seu fio. Procure retomar o Tratamento Personalizado (R$ 130), que reavalia o diagnóstico e ajusta entre hidratação, nutrição ou reconstrução conforme o que o fio estiver pedindo naquele momento." },
  { q: "O que é porosidade capilar?", a: "Porosidade refere-se à capacidade da cutícula de absorver e reter umidade. Baixa porosidade = cutículas fechadas, absorve lentamente mas retém bem. Alta porosidade = cutículas abertas, absorve rápido mas perde umidade. Média porosidade (ideal) = equilíbrio perfeito." },
  { q: "Como faço o teste de porosidade em casa?", a: "Pegue um fio solto, coloque em água em temperatura ambiente e observe. Se flutua na superfície = baixa porosidade (cutículas fechadas). Se afunda devagar = média porosidade. Se afunda rápido = alta porosidade (cutículas abertas). Mas o teste real é análise de elasticidade com quem entende a física." },
  { q: "Qual a diferença entre baixa e alta porosidade?", a: "Baixa porosidade resiste à absorção de água e produtos; o fio fica ressecado mesmo após aplicação. Alta porosidade absorve tudo rapidamente mas não retém; o fio fica macio, mole e sem definição. A Leitura de Fio identifica qual é a sua de forma precisa." },
  { q: "Porosidade muda depois de uma química forte como descoloração?", a: "Sim. A descoloração abre as cutículas de forma permanente, aumentando a porosidade. O fio fica com capacidade muito maior de absorver água e produtos, mas também perde a retenção natural. Acidificação pós-química é essencial para manter a integridade estrutural." },
  { q: "Como medir a porosidade do meu cabelo de forma técnica?", a: "Através da análise de elasticidade no estado seco e molhado. No estado seco, o fio poroso estica mais; no molhado, perde rigidez rapidamente. Observar a velocidade de absorção de água e a retenção após enxágue também revela a porosidade real. Isso faz parte da Leitura de Fio." },
  { q: "O que é elasticidade capilar e como se relaciona com porosidade?", a: "Elasticidade é a capacidade do fio retornar ao comprimento original após esticar. Fios com baixa porosidade mantêm elasticidade natural; fios com alta porosidade perdem elasticidade porque as proteínas estão danificadas. Testar a elasticidade num fio úmido mostra se há dano estrutural real." },
  { q: "pH ácido fecha as cutículas? Como isso funciona?", a: "Sim. O pH ácido (entre 3 e 5) faz a cutícula encolher e se compactar, selando o fio. O pH alcalino (acima de 7) abre as cutículas para penetração. Por isso, após tratamento com pH alcalino (como shampoo sulfatado), é preciso fechar com enxágue ácido ou acidificante." },
  { q: "O que é acidificação capilar e quando devo fazer?", a: "É o enxágue final com solução ácida (pode ser limão diluído ou própolis) para fechar as cutículas após lavagem ou tratamento. Deve ser feito toda vez que você usar shampoo ou máscara porque a água e os produtos alcalinos abrem as cutículas. Mantém o fio selado e brilhante." },
  { q: "Como a porosidade se relaciona com frizz?", a: "Frizz é o fio poroso buscando umidade no ar porque as cutículas estão abertas. Sem conseguir absorver de verdade, o fio se afasta da raiz tentando respirar a umidade do ambiente. Controlar a porosidade acidificando e fornecendo lipídios elimina o frizz na raiz." },
  { q: "Cutícula aberta significa que o fio está danificado?", a: "Nem sempre. Cutículas naturalmente abertas são características de fios cacheados e crespos que nascem enroscados. Mas cutículas abertas por falta de pH correto ou dano químico sim, precisam de intervenção técnica para selar e reter nutrientes." },
  { q: "Qual é o tipo de cabelo mais comum em BH e qual sua porosidade?", a: "Em Belo Horizonte predomina cabelo ondulado a cacheado (tipos 2A-3C). A maioria tem porosidade média tendendo a alta por exposição solar e histórico químico. A porosidade média é ideal porque absorve tratamento bem e retém umidade naturalmente." },
  { q: "Qual é o cabelo 2A ao 4C?", a: "Classificação de curvatura capilar: 2A = ondulado leve, 3A = cacho solto, 3C = cacho cerrado, 4A = crespo solto, 4B = crespo, 4C = crespo muito fechado. Cada uma tem densidade, encolhimento e porosidade diferentes. O Studio do Jon trabalha com todo esse espectro." },
  { q: "Como identificar se tenho cacho 2A, 3A ou 3C?", a: "Deixe o cabelo secar naturalmente sem produtos pesados. 2A forma ondas leves e soltas. 3A forma cachos em espiral aberto, tipo mola frouxa. 3C forma cachos fechados como parafuso de ponta fina. A curvatura é medida a seco para ignorar a influência de peso e umidade." },
  { q: "Qual a diferença entre cacho e crespo?", a: "Cacho (3A-3C) forma espirais visíveis, com canela clara entre os fios. Crespo (4A-4C) forma ondulações muito fechadas, quase invisíveis, com padrão parafuso microscópico. Crespo é mais denso, menos definido visualmente e tem maior encolhimento quando seca." },
  { q: "Por que o cabelo encolhe mais se for crespo tipo 4C?", a: "Porque a curvatura é mais fechada. A haste da fibra se torce muitas vezes em poucos centímetros. Quando molhado, a água abre essas torções, esticando o fio. Ao secar e os fios voltarem a enroscar, o comprimento total reduz drasticamente — até 70% em alguns casos." },
  { q: "Tenho 2-3 texturas diferentes na minha cabeça. É normal?", a: "Extremamente normal. A nuca frequentemente é mais crespa enquanto o topo é mais ondulado. Isso é genética pura. O corte precisa considerar essas zonas diferentes de encolhimento para não gerar assimetria quando o cabelo seca. A Leitura de Fio mapeia cada zona." },
  { q: "Meu cabelo está com 4C no topo e 3B na nuca. Como faço um corte equilibrado?", a: "Através de um corte desconectado (sem camadas uniformes) que respeita os diferentes encolhimentos de cada zona. O topo que é 4C vai encolher 60-70%, enquanto a nuca 3B encolhe 40%. O corte a seco mapeia essas diferenças e compensa geometricamente." },
  { q: "O cabelo 4C é mais frágil que ondulado?", a: "Não é mais frágil por natureza. Mas a microestrutura muito fechada gera mais pontos de tensão onde atrito mecânico causa dano. Por isso, pentes de dentes finos e escovação viram vilões. Cuidado gentil com técnica adequada preserva a integridade." },
  { q: "Como meu tipo de cabelo define qual corte devo fazer?", a: "Cada curvatura encolhe diferente, o que determina a angulação e o comprimento planejado. 2A aceita comprimentos maiores com menos perda visual. 4C precisa planejamento maior de volume porque perde comprimento ao secar. O visagismo então adapta a geometria ao seu rosto." },
  { q: "Cabelo ondulado tipo 2A pode usar técnicas de 4C?", a: "Sim, mas com adaptações. As mesmas técnicas de cuidado com porosidade se aplicam, mas a sequência de corte e a compensação de encolhimento são menores. Um corte híbrido exigido para 4C pode ser excessivo para 2A que naturalmente já cai bem molhado." },
  { q: "Meu cacho é 3B mas a raiz nasce ondulada (2A). Como isso acontece?", a: "A curvatura pode variar por zona de nascimento no folículo. Isso é natural e acontece mais frequentemente do que as pessoas percebem. A Leitura de Fio mapeia essas diferenças de nascimento e define técnicas de corte que harmonizam as duas texturas no caimento final." },
  { q: "Se meu cabelo é 3C, vou encolher 50% quando secar?", a: "Depende. O encolhimento médio de 3C é 40-50%, mas varia com porosidade, hidratação e estrutura. Fios muito porosos podem encolher mais porque absorvem mais água ao molhar, provocando dilatação maior. Fios mal-cuidados encolhem menos porque a cutícula está danificada e não absorve bem." },
  { q: "Existe relação entre cor da pele e tipo de curvatura de cabelo?", a: "Não existe relação biológica direta. Mas há padrões populacionais. Em Belo Horizonte, populações de origem africana frequentemente têm texturas 3C-4C, enquanto descendentes europeus tendem a 2A-3A. Mas exceções existem em todas as etnias." },
  { q: "O tipo de cabelo muda com a idade?", a: "Sim. É comum que cabelos muito crespos (4C) suavizem com idade para 3C-4A. Também é comum onda se desenvolver com a puberdade. Hormônios, nutrição e saúde geral afetam a curvatura. Mas a mudança é lenta e gradual, não radical." },
  { q: "Posso ter ondulado em um lado da cabeça e cacheado do outro?", a: "Sim, é possível. A genética não é linear. Você herda padrões diferentes dos dois pais. Então um hemisfério pode manifestar herança paterna enquanto o outro manifesta herança materna. Isso exige corte completamente assimétrico ou com ajustes por zona." },
  { q: "Transição capilar é quando a raiz volta a nascer naturalmente sem alisamento?", a: "Exato. É o processo de deixar o cabelo natural crescer, removendo as pontas alisadas ou quimicamente modificadas gradualmente. Pode durar meses a anos dependendo do comprimento desejado e do histórico químico. O corte progressivo facilita manter estilo durante a transição." },
  { q: "Quanto tempo leva uma transição capilar completa até ter só cabelo natural?", a: "Entre 2 a 4 anos se você tiver cabelo comprido e quiser manter comprimento durante o crescimento. Se aceitar cortes progressivos, 1 a 2 anos. O crescimento médio é 12-15 cm ao ano, então mais comprimento = mais tempo em transição." },
  { q: "Preciso fazer o Big Chop (cortar tudo) ou posso deixar crescer a transição?", a: "Depende de você. Big Chop é cortar todo o cabelo alisado de uma vez, ficando apenas com o natural. Deixar crescer gradualmente mantém comprimento mas exige cortes frequentes para remover pontas alisadas. Ambas funcionam; é escolha pessoal e desejo de comprimento." },
  { q: "O que é ponto de junção na transição capilar?", a: "É o local onde o fio natural e o alisado se encontram. Essa região é crítica porque a diferença de textura, elasticidade e porosidade torna o fio frágil no ponto de transição. Muitas quebras acontecem ali. Cortes frequentes e baixos podem são necessários." },
  { q: "Devo manter o comprimento da parte alisada durante a transição?", a: "Não é recomendado. Conforme o cabelo natural cresce, ele tem curvatura diferente, peso diferente e necessidades de cuidado diferentes. Manter o comprimento do alisado criará assimetria e fragilidade no ponto de junção. Remover gradualmente é mais saudável." },
  { q: "Quantos centímetros devo cortar em cada manutenção durante a transição?", a: "Entre 2 a 4 cm por visita, a cada 6-8 semanas. Isso permite manter estilo enquanto a raiz cresce. Se o ponto de junção estiver muito danificado, pode ser necessário remover mais. A Leitura de Fio avalia esse dano e determina quanto cortar com segurança." },
  { q: "Quando começo a ver resultado visual da minha transição capilar?", a: "Aproximadamente entre 4 a 8 semanas após começar. Nesse período, a raiz cresceu o suficiente (aprox. 2-3 cm) para ser visível a diferença de textura e cor. Mas o resultado de cabelo realmente bonito leva 3-6 meses de cuidados consistentes com cronograma." },
  { q: "Tenho medo de começar a transição. Como a coragem ajuda?", a: "Transição exige coragem porque seu cabelo vai parecer 'estranho' nos primeiros meses com raiz natural e pontas alisadas. É temporário. Com cronograma de tratamento correto e cortes planejados, você vai ver seu natural emergir. A Leitura de Fio tranquiliza sobre a saúde do fio novo." },
  { q: "Posso usar alisante ou hidróxido durante a transição ou devo deixar totalmente natural?", a: "Depende do seu objetivo e saúde do fio. Se quer transição 100% natural, não use nada. Se quer suavizar o visual enquanto cresce (cropping), pode usar relaxante suave apenas na raiz com muito cuidado. O recomendado é deixar crescer natural e remover alisado gradualmente." },
  { q: "Qual o melhor produto para usar durante a transição capilar?", a: "Foque em cronograma equilibrado de hidratação-nutrição-reconstrução conforme a Leitura de Fio. A raiz natural vai exigir menos tratamento proteico; as pontas alisadas vão exigir mais reconstrução. Produtos light e com pH ácido são ideais para não danificar mais o ponto de junção frágil." },
  { q: "Qual é a melhor frequência para lavar cabelos cacheados?", a: "Entre 2 a 4 vezes por semana, dependendo da porosidade e do clima de Belo Horizonte. Alta porosidade aceita lavagens mais frequentes (3-4x). Baixa porosidade com lavagens a cada 4-5 dias. O importante é usar shampoo sem sulfato para não danificar a cutícula." },
  { q: "Qual a diferença entre máscara hidratante e condicionador?", a: "Condicionador é aplicação rápida (2-5 min) após shampoo para desembaraçar e lubrificar. Máscara hidratante é aplicação concentrada (10-20 min) que penetra a fibra profundamente. A máscara tem moléculas maiores e ingredientes mais ativos; o condicionador é manutenção básica." },
  { q: "Preciso fazer máscara toda semana ou posso espaçar mais?", a: "Depende da porosidade. Alta porosidade se beneficia de máscara semanal. Baixa porosidade com máscara a cada 2 semanas já basta. A Leitura de Fio determina sua frequência ideal. Fazer a mais do que o necessário causa fadiga hídrica; fazer menos deixa o fio ressecado." },
  { q: "Óleo capilar deve ser aplicado na raiz ou só no comprimento?", a: "Apenas no comprimento, nunca na raiz. Óleos na raiz causam abafamento do folículo, inflamação e queda. No comprimento, o óleo lubrifica a cutícula, seala o fio e combate o frizz. Aplique do meio do comprimento para as pontas, 10 minutos antes de lavar." },
  { q: "Qual óleo é melhor: de coco, argan, babaçu ou camellia?", a: "Nenhum é 'melhor' de forma universal. Depende da porosidade. Baixa porosidade se beneficia de óleos leves como camellia que penetram facilmente. Alta porosidade aprecia óleos mais ricos como argan que fecham a cutícula. A Leitura de Fio avalia qual seu fio absorve melhor." },
  { q: "Quando mudar de rotina capilar ou cronograma?", a: "Mude quando seu cabelo não responde bem ao cronograma atual por 4-6 semanas. Sinais: fio muito mole (excesso hidratação), fio muito rígido (excesso proteína), frizz resistente (pH desequilibrado). Refaça a Leitura de Fio para ajustar a composição ideal." },
  { q: "O que é leave-in e com que frequência devo usar?", a: "Leave-in é produto de tratamento que não enxaguamos, permanecendo no cabelo. Pode ser usado diariamente ou a cada 2-3 dias conforme o tipo (light vs denso). Em clima úmido de BH, leave-in ligth à base de água funciona bem; em clima seco, use versões com mais óleos." },
  { q: "Difusor ajuda a manter os cachos mais definidos?", a: "Sim, muito. O difusor distribui o ar quente de forma mais suave que a secadora comum, respeitando a curvatura do cacho sem danificar. Mantém a umidade dentro da fibra por mais tempo, evitando ressecamento. Use sempre em temperatura morna e velocidade média." },
  { q: "Qual a sequência correta de produtos na rotina de cabelo cacheado?", a: "1. Shampoo sem sulfato (lavar apenas raiz). 2. Condicionador (desembaraçar). 3. Máscara hidratante/nutritiva (conforme cronograma). 4. Acidificante (fechar cutícula). 5. Leave-in (opcional, aplicar úmido). 6. Sérum/óleo (nas pontas, antes de secar). 7. Secagem com difusor." },
  { q: "Diferença entre corte seco e corte molhado em cabelos cacheados?", a: "Corte seco mostra o caimento real e o encolhimento verdadeiro de cada fio. Molhado mascara a curvatura porque a água estica o fio. Corte molhado é mais rápido mas gera surpresas quando o cabelo seca. Corte a seco (ou híbrido) é mais preciso mas exige expertise técnica." },
  { q: "Por que o corte híbrido funciona melhor que corte só molhado?", a: "Porque combina a precisão geométrica a seco (respeita encolhimento real) com o refinamento molhado (limpa linhas e pontas). Corte só molhado ignora o encolhimento e gera comprimento perdido ao secar. Corte só seco de mestre é ideal, mas corte híbrido é mais acessível para preservar comprimento." },
  { q: "Como faço manutenção do corte entre visitas ao studio?", a: "Cortes em cabelo cacheado exigem retoque entre 8 a 12 semanas. Para manutenção caseira, evite pentes finos, faça cronograma consistente e proteja as pontas com óleos. Se o corte começar a ficar desigual, agende retoque. Não tente consertar em casa; o dano não compensa." },
  { q: "Como prevenir o efeito pirâmide (topo volumoso, embaixo fino)?", a: "O efeito pirâmide acontece com cortes em camadas mal-dimensionadas. A solução é usar cortes mais geométricos e desconectados, onde cada camada tem peso e suporte próprio. Visagismo equilibra o volume a partir do seu rosto, evitando essa forma desfavorável de forma inteligente." },
  { q: "Como controlar volume excessivo nos cachos?", a: "Volume é controlado pela angulação das camadas, pelo tipo de corte (blunt vs camadas) e pelo cronograma de secagem. Câmeras mais fechadas (curtas) geram volume; comprimentos maiores ajudam volume a cair. Difusor com movimento controlado também reduz volume final. Visagismo escolhe a melhor combinação." },
  { q: "Como desembaraçar cabelo cacheado sem danificar os cachos?", a: "Sempre molhado. Use condicionador copioso para lubrificar. Pente de dentes largos ou os dedos para desfazer nós. Nunca use pente fino ou escova, que quebram o fio. Escove do comprimento em direção à raiz, com muito cuidado no ponto de junção entre fios em alta porosidade." },
  { q: "Se eu cortar em outro salão que não o Studio, como peço um bom corte de cachos?", a: "Peça especificamente por corte a seco ou híbrido que respeite seu tipo de curvatura. Leve fotos referências de como VOCÊ quer, não cópias de influenciadoras. Explique seu encolhimento esperado e seu comprimento final desejado. Mas o ideal é vir para o Studio onde a Leitura de Fio garante certeza técnica." },
  { q: "Cabelo comprido ou curto se adapta melhor a cachos?", a: "Ambos funcionam. Cabelo curto (pixie, bob) exige visagismo muito preciso para equilibrar o volume na sua face. Cabelo comprido (ombro, cintura) facilita o caimento mas exige cronograma mais intenso. A escolha é estilo pessoal; o visagismo adapta a geometria ao seu desejo." },
  { q: "Como estilo pessoal influencia o tipo de corte que devo fazer?", a: "Muito. Se você ama estilo grunge, wolf cut funciona. Se ama minimalismo, corte geométrico blunt é perfeito. Se ama volume dramático, camadas amplas e radicais. O visagismo técnico valida essas escolhas contra seu formato de rosto, garantindo que o estilo também seja harmonioso." },
  { q: "Cabelo saudável faz diferença no resultado visual final?", a: "Absoluta diferença. Um corte perfeito em cabelo poroso e ressecado fica feio e dura pouco. Um corte perfeito em cabelo saudável brilha e dura meses. Por isso, a Leitura de Fio começa com diagnóstico de saúde antes do corte. Tratamento e diagnóstico vêm sempre primeiro." },
  { q: "Visagismo funciona para qualquer formato de rosto?", a: "Sim. Rosto redondo precisa de volume nos lados para afinar. Rosto quadrado precisa de movimento suave para suavizar ângulos. Rosto comprido precisa de volume na lateral para encurtar visualmente. Rosto coração (testa larga, queixo fino) precisa de cabelo que equilibre essas proporções." },
  { q: "Como o visagismo equilibra cabelo com rosto redondo?", a: "Rosto redondo perde proporção se o cabelo também é redondo (muito volume no topo e nada embaixo). A solução é movimento que cai para frente, alongando a silhueta visual. Comprimento até o queixo ou abaixo, com textura que vem para frente, redimensiona o rosto." },
  { q: "Cabelo comprido até a cintura fica pesado demais em cachos?", a: "Depende da porosidade e da densidade. Cabelo com alta porosidade fica muito pesado porque a água fica alojada no fio por mais tempo. Baixa porosidade com peso natural menor pode carregar comprimento até a cintura bem. A Leitura de Fio avalia se você pode manter isso com saúde." }
];

// Content blocks for noscript body injection
const aboutBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Muito Prazer, O Jon.</h1>
      <p>Especialista em curvaturas e visagismo no coração do bairro Caiçaras, BH.</p>
      <h2>O Cabelo não mente. O corte errado, sim.</h2>
      <p>Se você procura um especialista em cachos em Belo Horizonte que realmente entenda a ciência por trás das curvaturas, prazer. Meu Studio é um refúgio para quem cansou de cortes genéricos e busca um atendimento personalizado para cabelos ondulados, cacheados e crespos.</p>
      <p>Não sou apenas um cabeleireiro. Sou um leitor de fios. No Caiçaras (BH), construí um espaço focado na liberdade do seu fio natural, utilizando técnicas que respeitam o fator de encolhimento e a identidade de cada cliente.</p>
      <h2>Trajetória e Anos de Experiência</h2>
      <p>Há mais de uma década atrás da cadeira, Jonatan Junior construiu sua trajetória profissional dedicada quase que integralmente ao universo dos cabelos com curvatura — ondulados, cacheados e crespos. Passou por formações técnicas em corte, coloração e química capilar, mas foi na prática diária, atendendo centenas de texturas diferentes no bairro Caiçaras, que desenvolveu o olhar clínico que hoje é a marca registrada do Studio do Jon. Anos de atendimento a cabelos que chegavam danificados por descolorações mal avaliadas, cortes feitos com o fio molhado e esticado, ou queixas de "cabelo que não cresce" (quando na verdade só estava quebrando) revelaram um padrão: a maioria dos problemas capilares não nascia do cabelo em si, mas da falta de diagnóstico antes da tesoura ou da química.</p>
      <h2>A Origem do Método Leitura de Fio</h2>
      <p>O Método Leitura de Fio não surgiu de um curso ou de uma fórmula copiada. Nasceu da repetição de um mesmo erro visto em centenas de atendimentos: cortar ou transformar quimicamente um cabelo cacheado do mesmo jeito que se trata um cabelo liso, ignorando que a fibra com curvatura se comporta como uma mola — encolhe ao secar, reage diferente à porosidade e exige leitura individual antes de qualquer intervenção. Jonatan percebeu que preview e resultado só coincidiam quando havia, antes da tesoura, uma etapa de escuta, análise a seco, análise molhada e checagem de histórico químico. Dessa constatação nasceu um protocolo estruturado em 7 etapas, testado e refinado atendimento após atendimento, até se tornar parte obrigatória (e sem custo extra) de todo corte realizado no Studio do Jon. Hoje, a Leitura de Fio é o que diferencia o Studio do Jon de salões que ainda tratam cabelo cacheado com fórmulas prontas de revista.</p>
      <h2>Especialização em Curvaturas 2A a 4C</h2>
      <p>Jonatan Junior atende e se especializou em todo o espectro de curvaturas — do tipo 2A (ondulado suave, raiz mais lisa e onda que aparece no comprimento) ao 4C (crespo compacto, altíssimo fator de encolhimento e fibra fina, porém volumosa). Essa amplitude importa porque cada faixa de curvatura exige uma abordagem técnica distinta: um corte que funciona perfeitamente em um 3A pode arruinar a forma de um 4B se aplicado sem ajuste. No Studio do Jon, o diagnóstico da Leitura de Fio identifica exatamente em qual (ou quais, já que é comum uma cabeça abrigar mais de um padrão) tipo de curvatura o cliente se encaixa, e a partir disso define graduação, angulação e técnica de finalização. Essa especialização multi-curvatura é rara: muitos profissionais dominam bem apenas uma faixa (geralmente ondulados ou cacheados leves) e "empurram" a mesma técnica para todo mundo. Jonatan trata 2A, 2B, 2C, 3A, 3B, 3C, 4A, 4B e 4C como universos técnicos distintos, cada um com sua própria lógica de corte, volume e cuidado.</p>
      <h2>Filosofia: Respeito ao Cacho Natural, Zero Química Alisante</h2>
      <p>A filosofia por trás do Studio do Jon é simples de enunciar e rigorosa de cumprir: o cabelo com curvatura não precisa ser corrigido, precisa ser compreendido. Por isso, Jonatan Junior não realiza nenhum tipo de alisamento, relaxamento, escova progressiva ou qualquer procedimento que modifique quimicamente a curvatura natural do fio. O trabalho é 100% voltado para cabelos naturais — definição, saúde e forma são conquistadas através de corte técnico, visagismo e tratamentos capilares (hidratação, nutrição, reconstrução), nunca através de química alisante. Essa escolha é também um posicionamento: em um mercado ainda cheio de salões que "domesticam" o cacho com escova ou química, o Studio do Jon existe para provar que dá para ter cabelo saudável, bonito e de manutenção viável sem abrir mão da textura natural. Para quem está em transição capilar, esse compromisso significa suporte técnico real, sem pressa e sem empurrar procedimentos químicos como atalho.</p>
      <h2>Método & Técnica</h2>
      <ul>
        <li><strong>Leitura de Fio:</strong> Análise clínica de porosidade, espessura e saúde antes de qualquer tesoura.</li>
        <li><strong>Corte com Técnica:</strong> Escultura do volume real, garantindo que o visual funcione no seu dia a dia.</li>
        <li><strong>Visagismo:</strong> Harmonização do corte com o formato do seu rosto e sua personalidade.</li>
      </ul>
      <h2>Localização e Endereço</h2>
      <p>Studio do Jon · Rua Francisco Ovídio, 184 · Caiçaras · Belo Horizonte, MG. Próximo ao metrô Gameleira e Avenida Pedro II. Telefone: (31) 3586-6673.</p>
    </article>
  </noscript>
`;

const investmentBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Investimento — Studio do Jon</h1>
      <p>Antes de qualquer tesoura, vem o diagnóstico. O <a href="/metodo">Método Leitura de Fio</a> está incluído em todo atendimento — sem cobrança extra. O que você paga é pelo resultado que foi planejado desde o início.</p>
      <h2>Nossos Valores e Serviços</h2>
      <ul>
        <li><strong>Corte especializado:</strong> R$ 190 a R$ 230. Inclui Leitura de Fio completa (7 etapas), corte, finalização como validação.</li>
        <li><strong>Descoloração em cabelo cacheado:</strong> Sob consulta. Inclui diagnóstico de porosidade, análise de histórico químico, processo e finalização. Valor varia conforme comprimento e estado do fio.</li>
        <li><strong>Consultoria Leitura de Fio:</strong> Sob consulta. Para quem quer só o diagnóstico, sem corte. Inclui análise completa do fio e orientações de cuidado personalizadas.</li>
      </ul>
      <h2>Corte Cabelo Cacheado Masculino BH</h2>
      <p>Homem com cacho também precisa de leitura de fio antes da tesoura. O corte cabelo cacheado masculino no Studio do Jon segue o mesmo Método Leitura de Fio dos atendimentos femininos: diagnóstico de curvatura e formato do rosto antes de qualquer corte, com visagismo aplicado aos traços masculinos. Nada de máquina padronizada — o volume e o encaracolamento natural são respeitados, evitando o efeito pirâmide e o frizz comum em barbearias que não entendem cabelo com curvatura. O valor segue a mesma faixa do Corte especializado (R$ 190 a R$ 230), incluindo a Leitura de Fio completa e a finalização educativa. Ideal para quem tem cabelo ondulado, cacheado ou crespo em Belo Horizonte.</p>
      <p>Quer aprender mais sobre diagnóstico capilar e cuidados técnicos? Visite nosso <a href="/blog">blog com 50+ artigos</a> sobre cabelos cacheados, crespos e ondulados.</p>
      <p><a href="/agendar">Pronto para agendar? Clique aqui e escolha seu horário.</a></p>
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

// Build glossary body insert
const glossaryData = JSON.parse(fs.readFileSync(path.join('src', 'data', 'glossary.json'), 'utf8'));
let glossaryBody = `
  <noscript>
    <article style="max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Glossário — Ciência do Cabelo Cacheado</h1>
      <p>Termos técnicos explicados com precisão. Sem marketing. Sem simplificação.</p>
      <dl style="margin-top: 24px;">
`;
glossaryData.forEach(item => {
  glossaryBody += `
        <dt style="font-weight: bold; margin-top: 20px; font-size: 1.1rem;">${item.term}</dt>
        <dd style="margin-left: 0; margin-top: 8px; color: #1a1310;">${item.definition}</dd>
        <dd style="margin-left: 0; margin-top: 4px; font-size: 0.85rem; color: #999; font-style: italic;">${item.context}</dd>
  `;
});
glossaryBody += `
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
      <p>Ao unir a biologia do folículo, a física da mola capilar, a química dos tratamentos e as proporções do visagismo, o Studio do Jon garante que seu cabelo seja cortado de forma personalizada, funcional e livre de fórmulas genéricas. O Método Leitura de Fio devolve a liberdade e a saúde natural dos seus cachos no bairro Caiçaras em Belo Horizonte.</p>

      <h2>Artigos Relacionados</h2>
      <h3>Diagnóstico &amp; Porosidade</h3>
      <ul>
        <li><a href="/blog/leitura-de-fio-metodo-exclusivo-studio-do-jon">Leitura de Fio: O Método Exclusivo | Jon</a></li>
        <li><a href="/blog/teste-de-porosidade-guia-definitivo">Teste de Porosidade: Segredo para Absorver | Jon</a></li>
        <li><a href="/blog/cabelo-poroso-nao-absorve-creme-scab-hair">Cabelo Poroso Não Absorve Creme? | Jon</a></li>
        <li><a href="/blog/acidificacao-capilar-cachos-porosidade">pH do Cacho: Como Fazer Acidificação Capilar e Vencer a Porosidade</a></li>
        <li><a href="/blog/frizz-em-cabelo-cacheado">Frizz em cabelo cacheado: a física por trás do fio arrepiado</a></li>
      </ul>
      <h3>Curvaturas 2A-4C</h3>
      <ul>
        <li><a href="/blog/curvatura-4c-cabelo-crespo-guia-completo">Curvatura 4C: o guia técnico completo para entender e cuidar do cabelo crespo</a></li>
        <li><a href="/blog/cacho-vs-crespo-qual-diferenca">Cacho vs Crespo: Qual é a Diferença | Jon</a></li>
        <li><a href="/blog/fator-encolhimento-cabelo-cacheado">Fator Encolhimento do Cabelo Cacheado | Jon</a></li>
        <li><a href="/blog/especialista-em-cabelo-cacheado-bh-texturas">Três Texturas na Mesma Cabeça | Jon</a></li>
        <li><a href="/blog/finalizacao-por-curvatura-guia-tecnico">Finalização por Curvatura: Do 2C ao 4C | Jon</a></li>
        <li><a href="/blog/voce-tem-cabelo-ondulado-e-nao-sabe-liso-com-frizz">Você Tem Cabelo Ondulado e Não Sabe? Como Identificar e Cuidar</a></li>
      </ul>
      <h3>Transição Capilar</h3>
      <ul>
        <li><a href="/blog/transicao-capilar-sem-sofrimento-guia-cachos">Transição Capilar Sem Sofrimento: Guia Completo para Voltar aos Cachos</a></li>
        <li><a href="/blog/transicao-capilar-bh-danos-botox">Progressiva Derreteu Seus Cachos? | Jon</a></li>
      </ul>
      <h3>Corte Técnico (seco/híbrido) &amp; Visagismo</h3>
      <ul>
        <li><a href="/blog/corte-hibrido-cabelo-cacheado">Corte Híbrido em Cabelo Cacheado: Técnica Molhada + Seca</a></li>
        <li><a href="/blog/corte-cabelo-cacheado-visagismo-influenciadora">Corte de Influenciadora Pode Não Ficar em Você | Jon</a></li>
        <li><a href="/blog/corte-para-cabelo-cacheado-mentira-do-corte-a-seco">Corte a Seco para Cabelo Cacheado | Jon</a></li>
        <li><a href="/blog/corte-para-cabelo-cacheado-bh-volume">Efeito Pirâmide no Cabelo Cacheado | Jon</a></li>
      </ul>
      <h3>Química &amp; Danos</h3>
      <ul>
        <li><a href="/blog/botox-capilar-cabelo-cacheado-perigos">Botox Capilar em Cabelo Cacheado | Jon</a></li>
      </ul>
    </article>
  </noscript>
`;


// Global organization / local business schema graphs
const localBusinessSchema = {
  "@type": ["HairSalon", "LocalBusiness"],
  "@id": "https://www.ojonquecortou.com.br/#localbusiness",
  "name": "Studio do Jon",
  "alternateName": "Studio do Jon",
  "url": "https://www.ojonquecortou.com.br",
  "logo": "https://www.ojonquecortou.com.br/logo.png",
  "image": "https://www.ojonquecortou.com.br/capa-studio.jpg",
  "description": "Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.",
  "telephone": "+553135866673",
  "email": "contato@ojonquecortou.com.br",
  "priceRange": "$$",
  "hasMap": "https://www.google.com/maps?cid=16629671607593282841",
  "sameAs": [
    "https://www.instagram.com/ojonquecortou",
    "https://www.google.com/maps?cid=16629671607593282841",
    "https://www.facebook.com/ojonquecortou/"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Francisco Ovídio, 184",
    "addressLocality": "Caiçaras",
    "addressRegion": "MG",
    "postalCode": "30770-040",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "-19.908634",
    "longitude": "-43.967875"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "19:00"
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
  "founder": { "@id": "https://www.ojonquecortou.com.br/#person" },
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
  "description": "Jonatan Junior (O Jon) é especialista em curvaturas e visagismo no bairro Caiçaras, Belo Horizonte. Criador do Método Leitura de Fio.",
  "worksFor": {
    "@id": "https://www.ojonquecortou.com.br/#localbusiness"
  },
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
    curl_type: "Cacheado · Caiçaras"
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
          "addressLocality": "Caiçaras",
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
      <p>Jonatan Junior, o Jon, é cabeleireiro especialista em cabelos ondulados, cacheados e crespos no bairro Caiçaras, Belo Horizonte (MG). Criador do Método Leitura de Fio — diagnóstico capilar em 7 etapas realizado antes de qualquer corte. Atende todas as curvaturas, do tipo 2A ao 4C. Não realiza alisamento, relaxamento ou qualquer procedimento de modificação da curvatura.</p>
      <h2>Serviços Principais</h2>
      <ul>
        <li><strong>Corte com o Jon</strong> — R$ 190. Inclui Leitura de Fio completa, corte e finalização educativa.</li>
        <li><strong>Leitura de Fio</strong> — R$ 80 (revertido em crédito se fechar serviço). Diagnóstico exclusivo de 7 etapas.</li>
        <li><strong>Combo Corte + Tratamento</strong> — R$ 320. Corte especializado com tratamento de alta performance.</li>
        <li><strong>Descoloração em Cabelo Cacheado</strong> — A partir de R$ 699. Com diagnóstico de porosidade e histórico químico.</li>
        <li><strong>Tratamento Personalizado</strong> — R$ 130. Hidratação, nutrição ou reconstrução conforme diagnóstico.</li>
      </ul>
      <h2>O Método Leitura de Fio</h2>
      <p>Antes de qualquer tesoura, o Studio do Jon realiza 7 etapas de análise: escuta, análise a seco, diagnóstico do couro cabeludo, histórico químico, análise molhada, definição de técnica e finalização como validação. Esse diagnóstico é incluso em todo atendimento, sem custo extra. Saiba mais sobre o <a href="/metodo">Método Leitura de Fio</a>.</p>
      <p>Veja todos os <a href="/investimento">valores e formas de investimento</a> antes de agendar seu horário.</p>
      <h2>Localização e Agendamento</h2>
      <p>Studio do Jon · Rua Francisco Ovídio, 184 · Caiçaras · Belo Horizonte, MG · CEP 30770-040. Telefone: <a href="tel:+553135866673">(31) 3586-6673</a>. <a href="/agendar">Agende seu horário online</a> ou fale pelo <a href="https://wa.me/553135866673">WhatsApp</a>. Instagram: @ojonquecortou.</p>
      <p>Avaliação média: 4.9 estrelas com base em 272 avaliações no Google.</p>
      <p>Localizado no bairro Caiçaras, na Rua Pedro II, o Studio do Jon fica a poucos passos do metrô Gameleira, um dos pontos mais acessíveis de Belo Horizonte para quem busca um especialista em cabelo cacheado sem depender de carro. Clientes de toda a região metropolitana chegam de metrô, ônibus ou a pé para o diagnóstico da Leitura de Fio, tornando o Caiçaras uma referência local para cortes técnicos em cachos, crespos e ondulados.</p>
    </article>
  </noscript>
`;

const agendarBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Agende seu Horário — Studio do Jon</h1>
      <p>Marque seu horário com Jon, especialista em cabelos ondulados, cacheados e crespos no bairro Caiçaras, Belo Horizonte (MG). O Método Leitura de Fio — diagnóstico capilar em 7 etapas — está incluído em todo atendimento, sem custo extra. O agendamento é feito de forma instantânea e online, direto por este site.</p>
      <h2>Como Funciona</h2>
      <ul>
        <li>Escolha o serviço desejado (corte, tratamento, coloração ou consultoria).</li>
        <li>Selecione a data e o horário disponíveis na agenda online.</li>
        <li>Receba a confirmação instantânea do seu agendamento.</li>
      </ul>
      <h2>Localização e Contato</h2>
      <p>Studio do Jon · Rua Francisco Ovídio, 184 · Caiçaras · Belo Horizonte, MG · CEP 30770-040. Telefone: <a href="tel:+553135866673">(31) 3586-6673</a>. Prefere falar antes? Chame no <a href="https://wa.me/553135866673">WhatsApp</a>. Instagram: @ojonquecortou.</p>
    </article>
  </noscript>
`;

// Build dynamically the Blog hub page body insert (top 20 most recent posts by datePublished)
const blogHubPosts = [...posts]
  .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished))
  .slice(0, 20);

let blogHubBody = `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Blog do Jon — Dicas e Ciência para Cabelo Cacheado, Crespo e Ondulado</h1>
      <p>Artigos práticos e embasados sobre cabelos com curvatura, escritos por Jonatan Junior, especialista em cachos em Belo Horizonte. Aqui você encontra guias sobre porosidade, frizz, hidratação, técnicas de finalização e a ciência por trás do Método Leitura de Fio.</p>
      <p>Confira os artigos mais recentes do blog:</p>
`;
blogHubPosts.forEach(post => {
  const hubPostDesc = post.excerpt || post.metaDescription || '';
  blogHubBody += `
      <article style="margin-top: 20px;">
        <h2><a href="/blog/${post.slug}">${post.title}</a></h2>
        <time>${post.date}</time>
        <p>${hubPostDesc}</p>
      </article>
  `;
});
blogHubBody += `
    </article>
  </noscript>
`;

// Definition of static pages with their specific metadata
const pages = [
  {
    route: '/',
    title: 'Especialista em Cabelo Cacheado BH | Studio do Jon',
    description: 'Salão especialista em cabelos ondulados, cacheados e crespos em Belo Horizonte (Caiçaras). Corte a seco, visagismo e transição capilar.',
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
    title: 'Serviços para Cabelo Cacheado em BH',
    description: 'Corte a seco, tratamentos e coloração para cachos, com leitura de fio antes de qualquer tesoura. Veja preços e agende no Studio do Jon, BH.',
    bodyInsert: servicesBody,
    schema: {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      "name": "Serviços — Studio do Jon",
      "url": "https://www.ojonquecortou.com.br/servicos",
      "itemListElement": [
        { "@type": "Offer", "priceCurrency": "BRL", "price": "190.00", "itemOffered": { "@type": "Service", "name": "Corte com o Jon", "description": "Inclui Leitura de Fio completa, corte a seco/técnico e finalização educativa." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "80.00", "itemOffered": { "@type": "Service", "name": "Leitura de Fio", "description": "Diagnóstico capilar de 7 etapas. Valor revertido em crédito se fechar serviço." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "230.00", "itemOffered": { "@type": "Service", "name": "Combo Corte + Tratamento", "description": "Corte especializado com tratamento de alta performance." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "699.00", "itemOffered": { "@type": "Service", "name": "Luzes ou Morena Iluminada", "description": "Iluminação sem descolorante, preservando a estrutura do fio." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "499.00", "itemOffered": { "@type": "Service", "name": "Coloração Completa", "description": "Cor sob medida respeitando a saúde do cacho." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "130.00", "itemOffered": { "@type": "Service", "name": "Tratamento personalizado", "description": "Hidratação, nutrição ou reconstrução conforme diagnóstico." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "180.00", "itemOffered": { "@type": "Service", "name": "Inside TRP — Reconstrução Premium", "description": "Tratamento proteico premium para fios danificados." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "180.00", "itemOffered": { "@type": "Service", "name": "Detox Estimulante", "description": "Esfoliação detox do couro cabeludo." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "100.00", "itemOffered": { "@type": "Service", "name": "Lavar e Finalizar", "description": "Higienização e finalização sob medida (definição, volume ou leveza)." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "390.00", "itemOffered": { "@type": "Service", "name": "Pacote Cachos Perfeitos", "description": "4 sessões de tratamento com cronograma técnico (30% OFF)." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "130.00", "itemOffered": { "@type": "Service", "name": "Manutenção de Corte", "description": "Retoque para clientes que cortaram nos últimos 90 dias." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "180.00", "itemOffered": { "@type": "Service", "name": "Retoque de Raiz", "description": "Manutenção da cor sem alterar o comprimento." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "150.00", "itemOffered": { "@type": "Service", "name": "Infusão de Carga Hídrica para Cabelos Porosos", "description": "Tratamento de hidratação profunda sob medida conforme Leitura de Fio." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "170.00", "itemOffered": { "@type": "Service", "name": "Ritual de Reposição Lipídica para Nutrição Profunda", "description": "Nutrição lipídica intensiva com blends biocompatíveis para curvaturas ressecadas." } },
        { "@type": "Offer", "priceCurrency": "BRL", "price": "200.00", "itemOffered": { "@type": "Service", "name": "Protocolo de Blindagem de pH e Reconstrução", "description": "Acidificação técnica e reposição de aminoácidos para cabelos pós-química ou fragilizados." } }
      ]
    }
  },
  {
    route: '/sobre',
    title: 'Sobre o Jon | Especialista em Cachos em BH | Studio do Jon',
    description: 'Criador do Método Leitura de Fio, Jon é referência em corte e tratamento para cabelo cacheado em BH. Conheça a trajetória e agende sua avaliação.',
    bodyInsert: aboutBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        founderPersonSchema,
        {
          "@type": "WebPage",
          "@id": "https://www.ojonquecortou.com.br/sobre",
          "url": "https://www.ojonquecortou.com.br/sobre",
          "name": "Sobre o Jonatan Junior | Especialista em Cachos BH | Studio do Jon",
          "description": "Conheça a história de Jonatan Junior, cabeleireiro especialista em cachos em Belo Horizonte. Criador do Método Leitura de Fio para cabelos naturais.",
          "mainEntity": { "@id": "https://www.ojonquecortou.com.br/#person" },
          "about": {
            "@id": "https://www.ojonquecortou.com.br/#person"
          }
        }
      ]
    }
  },
  {
    route: '/blog',
    title: 'Blog do Jon | Dicas e Cuidados para Cabelo Cacheado e Crespo',
    description: 'Dicas práticas, guias de produtos, técnicas de finalização e tudo o que você precisa saber sobre cabelos cacheados, crespos e ondulados.',
    bodyInsert: blogHubBody,
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
    title: 'Perguntas Frequentes | Especialista em Cachos BH | Studio do Jon',
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
    route: '/glossario',
    title: 'Glossário de Cabelo Cacheado | Studio do Jon',
    description: 'Glossário técnico com 56 termos sobre cabelo cacheado, crespo e ondulado. Descubra a ciência por trás de porosidade, pH, cronograma capilar e Método Leitura de Fio.',
    bodyInsert: glossaryBody,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "name": "Glossário — Studio do Jon",
          "url": "https://www.ojonquecortou.com.br/glossario",
          "description": "Glossário técnico com 56 termos sobre cabelo cacheado, crespo e ondulado."
        },
        {
          "@type": "FAQPage",
          "mainEntity": glossaryData.map(term => ({
            "@type": "Question",
            "name": term.term,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": term.definition
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
          "name": "Método Leitura de Fio — diagnóstico capilar em 7 etapas",
          "description": "Diagnóstico feito pelo especialista Jonatan Junior antes de qualquer corte, no Studio do Jon (Belo Horizonte).",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Escuta", "text": "Conversa e avaliação de hábitos e expectativas antes de tocar no cabelo." },
            { "@type": "HowToStep", "position": 2, "name": "Análise a seco", "text": "Leitura do fio seco para identificar curvatura, volume e comportamento real." },
            { "@type": "HowToStep", "position": 3, "name": "Diagnóstico do couro cabeludo", "text": "Avaliação da saúde do couro e da raiz." },
            { "@type": "HowToStep", "position": 4, "name": "Histórico químico", "text": "Levantamento de químicas e processos anteriores que afetam o fio." },
            { "@type": "HowToStep", "position": 5, "name": "Análise molhada", "text": "Leitura do fio molhado: porosidade, densidade e definição." },
            { "@type": "HowToStep", "position": 6, "name": "Definição de técnica", "text": "Escolha da técnica de corte ideal para a curvatura e o objetivo." },
            { "@type": "HowToStep", "position": 7, "name": "Finalização como validação", "text": "Finalização usada para validar o resultado e ensinar a manutenção em casa." }
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
    title: 'Galeria de Cortes Cacheados',
    description: 'Fotos reais de antes e depois de cortes, mechas e tratamentos em cabelos cacheados, crespos and ondulados feitos pelo Jon.',
    bodyInsert: `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      <h1>Galeria de Resultados — Studio do Jon</h1>
      <p>Veja fotos reais de antes e depois de cortes, mechas e tratamentos personalizados realizados em cabelos ondulados, cacheados e crespos. Todos os resultados apresentados são de clientes reais atendidos no Studio do Jon no bairro Caiçaras, Belo Horizonte. Para agendar: <a href="/agendar">ojonquecortou.com.br/agendar</a></p>
      <hr />
      <p>Cada transformação começa com uma leitura técnica do fio: cachos ressecados e sem forma chegam ao estúdio e saem com curvatura definida, camadas que respeitam o comprimento e frizz sob controle. Em cortes masculinos e femininos, o antes costuma ser volume desalinhado ou pontas danificadas — o depois mostra definição uniforme da raiz às pontas, sem perder a textura natural. Coloração e mechas seguem o mesmo cuidado: contraste e brilho aplicados sem comprometer a saúde da fibra cacheada, crespa ou ondulada.</p>
    </article>
  </noscript>
`,
    schema: {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "name": "Galeria de Resultados — Studio do Jon",
      "description": "Fotos reais de antes e depois de cortes, mechas e tratamentos em cabelos cacheados e crespos atendidos pelo Jon em Belo Horizonte. Cada imagem documenta a transformação: da curvatura sem definição e cheia de frizz ao resultado com forma, movimento e brilho preservados, incluindo cortes femininos, masculinos e infantis.",
      "author": { "@id": "https://www.ojonquecortou.com.br/#jonatan" },
      "url": "https://www.ojonquecortou.com.br/galeria"
    }
  },
  {
    route: '/servicos/descoloracao-cabelo-cacheado',
    title: 'Descoloração em Cabelo Cacheado em BH | Studio do Jon',
    description: 'Descoloração em cabelo cacheado em BH. Protocolo com avaliação de porosidade, histórico químico e textura para manter a saúde do cacho. Agende.',
    bodyInsert: `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      ${EXPANDED_SERVICE_BODIES['descoloracao-cabelo-cacheado']}
    </article>
  </noscript>
`,
    schema: manualServiceSchema({
      name: 'Descoloração em Cabelo Cacheado',
      description: 'Descoloração em cabelo cacheado em BH. Protocolo com avaliação de porosidade, histórico químico e textura para manter a saúde do cacho.',
      route: '/servicos/descoloracao-cabelo-cacheado'
    })
  },
  {
    route: '/servicos/corte-hibrido',
    title: 'Corte Híbrido Cabelo Cacheado BH | Studio do Jon',
    description: 'Especialista em corte de cabelo cacheado em Belo Horizonte. Conheça o Corte Híbrido: molhado para precisão e seco para caimento. Agende já.',
    bodyInsert: `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      ${EXPANDED_SERVICE_BODIES['corte-hibrido']}
    </article>
  </noscript>
`,
    schema: manualServiceSchema({
      name: 'Corte Híbrido',
      description: 'Especialista em corte de cabelo cacheado em Belo Horizonte. Corte Híbrido: molhado para precisão e seco para caimento.',
      route: '/servicos/corte-hibrido'
    })
  },
  {
    route: '/servicos/transicao-capilar',
    title: 'Transição Capilar em Belo Horizonte | Studio do Jon',
    description: 'Passando pela transição capilar em BH? O Studio do Jon oferece cortes progressivos e suporte técnico para recuperar seus cachos com segurança. Agende.',
    bodyInsert: `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      ${EXPANDED_SERVICE_BODIES['transicao-capilar']}
    </article>
  </noscript>
`,
    schema: manualServiceSchema({
      name: 'Transição Capilar',
      description: 'Transição capilar em BH. O Studio do Jon oferece cortes progressivos e suporte técnico para recuperar seus cachos com segurança.',
      route: '/servicos/transicao-capilar'
    })
  },
  {
    route: '/servicos/visagismo-cachos',
    title: 'Visagismo Cabelo Cacheado Belo Horizonte | Studio do Jon',
    description: 'Valorize sua imagem através do visagismo para cabelos cacheados em Belo Horizonte. Cortes planejados para sua estrutura facial e rotina. Agende.',
    bodyInsert: `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      ${EXPANDED_SERVICE_BODIES['visagismo-cachos']}
    </article>
  </noscript>
`,
    schema: manualServiceSchema({
      name: 'Visagismo Cabelo Cacheado',
      description: 'Visagismo para cabelos cacheados em Belo Horizonte. Cortes planejados para sua estrutura facial e rotina.',
      route: '/servicos/visagismo-cachos'
    })
  },
  {
    route: '/servicos/masculino',
    title: 'Corte Cabelo Cacheado Masculino BH | Studio do Jon',
    description: 'Especialista em corte masculino para cabelos cacheados e crespos em BH. Definição, praticidade e visagismo sem degradê genérico. Agende.',
    bodyInsert: `
  <noscript>
    <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
      ${EXPANDED_SERVICE_BODIES['masculino']}
    </article>
  </noscript>
`,
    schema: manualServiceSchema({
      name: 'Corte Cabelo Cacheado Masculino',
      description: 'Especialista em corte masculino para cabelos cacheados e crespos em BH. Definição, praticidade e visagismo sem degradê genérico.',
      route: '/servicos/masculino'
    })
  },
  {
    route: '/agendar',
    title: 'Agende seu corte | Studio do Jon — Especialista em Cachos BH',
    description: 'Marque seu horário com Jon, especialista em corte para cabelos cacheados, crespos e ondulados em Belo Horizonte.',
    bodyInsert: agendarBody
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

  // Use expanded body if available, otherwise use default
  const serviceBody = SEED_SERVICE_EXPANDED_BODIES[service.id] ? `
    <noscript>
      <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
        ${SEED_SERVICE_EXPANDED_BODIES[service.id]}
      </article>
    </noscript>
  ` : `
    <noscript>
      <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #1a1310; background: #efe5d2;">
        <h1>${service.name} em Belo Horizonte | Studio do Jon</h1>
        <p style="font-weight: bold; color: #ccc;">${service.tagline || ''}</p>
        <hr />
        <p>${service.description}</p>
        ${service.includes && service.includes.length > 0 ? `
        <h2>O que inclui</h2>
        <ul>
          ${service.includes.map(item => `<li>${item}</li>`).join('\n          ')}
        </ul>` : ''}
        <p><strong>Investimento:</strong> ${service.priceType ? `${service.priceType} ` : ''}R$ ${service.promoPrice || service.price}${service.duration ? ` &middot; <strong>Duração:</strong> ${service.duration} minutos` : ''}</p>
        <p><a href="/agendar">Agende seu horário</a> &middot; <a href="/servicos">Ver todos os serviços</a>${service.id === 'leitura-de-fio' ? ' &middot; <a href="/metodo">Conheça o Método Leitura de Fio completo</a>' : ''}</p>
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
    "author": { "@id": "https://www.ojonquecortou.com.br/#person" },
    "publisher": {
      "@type": "Organization",
      "name": "Studio do Jon",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.ojonquecortou.com.br/logo-cabeleireiro-de-cachos.png"
      }
    },
    "datePublished": post.datePublished || isoDate,
    "dateModified": post.dateModified || post.datePublished || isoDate,
    "wordCount": wordCount,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".post-content h2", ".post-content h3", ".post-content p:not(.meta)"]
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.ojonquecortou.com.br/blog/${post.slug}`
    }
  };

  const noscriptContent = `
    <noscript>
      <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h1>${post.title}</h1>
        <p style="font-size: 0.85rem; color: #555; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 20px;">
          Categoria: <strong>${post.category || 'Cuidado Capilar'}</strong> ·
          Escrito por <strong>Jonatan Junior</strong> (Cabeleireiro especialista em cabelos cacheados, crespos e ondulados) ·
          Publicado em: <strong><time datetime="${post.datePublished || isoDate}">${post.date || isoDate}</time></strong>${post.dateModified && post.dateModified !== post.datePublished ? ` · Atualizado em: <strong><time datetime="${post.dateModified}">${post.dateModified}</time></strong>` : ''}
        </p>
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
    title: post.seoTitle || post.title,
    description: postDesc,
    image: post.image,
    schema: pageSchema,
    bodyInsert: noscriptContent,
    postData: post,
    lastmod: post.dateModified || post.datePublished || parseDateToISO(post.date)
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

  // 6b. Inject Initial Props for Hydration Fallback (SW caching solution)
  if (page.postData) {
    const postDataScript = `\n    <script type="application/json" id="pre-rendered-post-data">\n    ${JSON.stringify(page.postData, null, 2).replace(/\n/g, '\n    ')}\n    </script>`;
    html = html.replace('<!-- Google Fonts -->', `${postDataScript}\n\n    <!-- Google Fonts -->`);
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
    let lastmod = page.lastmod || currentDate;

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

console.log('Generating posts.json...');
const postsJson = JSON.stringify(posts);
fs.writeFileSync(path.join(__dirname, '../public/posts.json'), postsJson);
fs.writeFileSync(path.join(distDir, 'posts.json'), postsJson);
console.log('posts.json generated and updated successfully in public/ and dist/!');
