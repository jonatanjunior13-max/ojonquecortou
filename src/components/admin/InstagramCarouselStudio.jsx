import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Layers, 
  FileText, 
  Search, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Calendar, 
  Target, 
  User, 
  Sliders, 
  Eye, 
  HelpCircle,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './InstagramCarouselStudio.css';

// Agenda de Setembro 2026 Oficial do Studio do Jon
export const SEPTEMBER_CAROUSELS_AGENDA = [
  {
    id: 'carrossel-01-09',
    date: '01/09 · Terça',
    isSearchRanked: true,
    searchRank: 'Nº 5 mais buscada do Brasil',
    objective: 'Salvamento + Envio',
    title: 'Como pentear cabelo cacheado sem quebrar (O erro da tração pela raiz)',
    theme: 'Como pentear cabelo cacheado sem quebrar — por que começar pela raiz é o erro que mais custa comprimento. Explicar que desembaraçar de baixo pra cima evita empurrar e acumular nó, que fio seco não tem elasticidade e por isso parte, e que produto no fio não é luxo, é redução de atrito. Fechar amarrando em quanto de tração o fio de cada pessoa aguenta — que depende de porosidade e ninguém mediu.',
    coverProfile: 'Mulher negra, corpo médio, cabelo crespo 4A castanho escuro, desembaraçando o cabelo com os dedos, expressão concentrada.',
    coverLine1: 'O ERRO NO BANHO',
    coverLine2: 'QUE PARTE SEU CACHO',
    coverLine3: 'o jeito certo de desembaraçar',
    coverImage: '/blog-embaraco.webp', // local fallback
    slides: [
      {
        type: 'cover',
        tag: null,
        headline: 'O ERRO NO BANHO\nQUE PARTE SEU CACHO',
        body: 'o jeito certo de desembaraçar'
      },
      {
        type: 'second_cover',
        tag: null,
        headline: 'Seu cabelo não parou de crescer.\nA raiz continua fazendo o trabalho dela.',
        body: 'É o jeito que você passa o pente que está partindo o fio →'
      },
      {
        type: 'content',
        tag: '01 · O EFEITO ACÚMULO',
        headline: 'Puxar da raiz empurra os nós para a ponta.',
        body: 'Eles se juntam num bloco impenetrável. Na primeira trava, o fio quebra.'
      },
      {
        type: 'content',
        tag: '02 · A FÍSICA DO ATRITO',
        headline: 'Fio seco não estica: ele parte.',
        body: 'Condicionador no banho reduz o atrito. Tentar desembaraçar a seco rasga a cutícula.'
      },
      {
        type: 'content',
        tag: '03 · A CONTA QUE NÃO FECHA',
        headline: 'O cabelo cresce 1cm e quebra 2cm.',
        body: 'Não é falta de crescimento. É a força da sua mão quebrando o comprimento.'
      },
      {
        type: 'content',
        tag: '04 · DE BAIXO PARA CIMA',
        headline: 'Desembarace sempre pelas pontas.',
        body: 'Solte os últimos centímetros primeiro. Suba para o meio e termine na raiz.'
      },
      {
        type: 'content',
        tag: '05 · LEITURA DE RESISTÊNCIA',
        headline: 'A tração que seu fio suporta é individual.',
        body: 'Fio poroso ou descolorido rompe fácil. A escova certa respeita a saúde da fibra.'
      },
      {
        type: 'fecho',
        tag: null,
        headline: 'O crescimento acontece na raiz.\nO comprimento é você quem protege no banho.',
        body: 'Sem pressa e sem força bruta.'
      },
      {
        type: 'cta',
        tag: null,
        headline: 'Quantos centímetros você perde na escova?',
        body: 'Manda para a amiga que puxa pela raiz e reclama que o cabelo não cresce.',
        action: 'Salva para a próxima lavagem.'
      }
    ],
    caption: `O erro de 30 segundos no banho que está quebrando o seu cacho pelo meio.

Como pentear cabelo cacheado sem quebrar é uma das dúvidas que mais chegam no estúdio — e a maioria das pessoas acha que o cabelo parou de crescer quando, na verdade, está sendo partido na escova.

Imagina o cenário: você entra no chuveiro com pressa, apoia o pente direto no topo da cabeça e puxa com força até a ponta. Você escuta aquele estalo seco e vê uma maçaroca de fios na mão.

O que acabou de acontecer ali foi quebra mecânica por acúmulo de nós.

Quando você puxa da raiz para baixo, você não está desembaraçando. Você está varrendo todos os micro-nós soltos da cabeça e empurrando tudo para o mesmo ponto, criando uma barreira impenetrável nas pontas. Quando a escova trava nesse bolo e você força a mão, o fio ultrapassa o limite de elasticidade da queratina e se parte no meio.

O jeito que protege o seu comprimento:

- Água e emoliência sempre: nunca passe pente em fio seco ou sem produto. O condicionador ou a máscara criam a película que reduz o atrito e permite que as fibras escorreguem.
- A regra dos três terços: comece desembaraçando os últimos 5 centímetros das pontas. Quando estiver livre, solte o meio. Só no final passe o pente desde a raiz.
- Dedos antes da ferramenta: use as mãos para abrir os nós maiores antes de entrar com qualquer escova.

Seu couro cabeludo trabalha todo mês para entregar comprimento. Não seja você a pessoa que decapita esse resultado no box por pura pressa.

Manda esse post pra amiga que vive reclamando que o cacho dela não sai do lugar e vive puxando a raiz na força bruta.

Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.

#cachos #cachosbrasil #cacheadas #curlygirls #curls`,
    altText: 'Mulher negra de cabelos crespos tipo 4A desembaraçando os fios com os dedos · Studio do Jon · Belo Horizonte',
    researchSummary: {
      mechanism: 'Pontos de torção na haste elíptica concentram tensão mecânica. Pentear da raiz arrasta os nós soltos e os compacta na ponta. Ao forçar a passagem, a queratina atinge o yield point e quebra.',
      literalQuotes: [
        'Eu sinto estalar os fios quando começo a pentear de cima pra baixo',
        'Meu cabelo arrebenta todinho no banho, sai uma maçaroca',
        'Meu cacho não sai do mesmo tamanho, as pontas vão esfarelando'
      ],
      gap: 'O mercado culpa queda e vende vitamina; a verdade é que o comprimento está sendo decapitado na tração do banho.',
      unverified: 'Não foram usados percentuais genéricos de quebra por passada de escova para evitar dados inventados.'
    }
  },
  {
    id: 'carrossel-03-09',
    date: '03/09 · Quinta',
    isSearchRanked: true,
    searchRank: 'Nº 9 mais buscada do Brasil',
    objective: 'Salvamento + Envio',
    title: 'Qual é o melhor creme pra cabelo cacheado (E por que a pergunta está errada)',
    theme: 'Qual é o melhor creme pra cabelo cacheado — e por que a pergunta está errada. Mostrar que não existe "o melhor", existe o certo pra porosidade e densidade de cada fio. Explicar o que muda entre creme leve e denso, por que o mesmo creme funciona numa amiga e não em você, e por que trocar de produto toda semana impede qualquer leitura de resultado.',
    coverProfile: 'Mulher branca, corpo grande/plus-size, cabelo ondulado 2C loiro escuro, olhando uma prateleira de produtos com expressão de indecisão.',
    coverLine1: 'O MELHOR CREME',
    coverLine2: 'NÃO EXISTE',
    coverLine3: 'o que a indústria não te conta',
    coverImage: '/blog-frizz.webp',
    slides: [
      {
        type: 'cover',
        tag: null,
        headline: 'O MELHOR CREME\nNÃO EXISTE',
        body: 'o que a indústria não te conta'
      },
      {
        type: 'second_cover',
        tag: null,
        headline: 'A pergunta que você faz toda semana está errada.',
        body: 'O produto milagroso da sua amiga pesou no seu cacho por um motivo →'
      },
      {
        type: 'content',
        tag: '01 · A ILUSÃO DO UNIVERSAL',
        headline: 'Não existe produto perfeito para todo mundo.',
        body: 'Existe o veículo com a densidade certa para a porosidade do seu fio.'
      },
      {
        type: 'content',
        tag: '02 · POROSIDADE MANDA',
        headline: 'Fio de baixa porosidade repele manteiga pesada.',
        body: 'Se a cutícula é fechada, creme denso senta na superfície e cria sebo, não nutrição.'
      },
      {
        type: 'content',
        tag: '03 · DENSIDADE DO FIO',
        headline: 'Cacho fino não aguenta óleo espesso.',
        body: 'Fios finos perdem o volume na hora com excesso de lipídio. Precisam de água e fixador leve.'
      },
      {
        type: 'content',
        tag: '04 · O ERRO DA TROCA SEMANAL',
        headline: 'Trocar de creme todo mês cega seu diagnóstico.',
        body: 'Se você muda de pote sem entender a resposta do fio, nunca vai saber o que funciona.'
      },
      {
        type: 'content',
        tag: '05 · LEITURA ANTES DA PRATELEIRA',
        headline: 'Descubra a necessidade da fibra primeiro.',
        body: 'O Método Jon lê retenção e elasticidade antes de indicar qualquer formulação.'
      },
      {
        type: 'fecho',
        tag: null,
        headline: 'Pare de comprar a promessa do rótulo.\nEntenda a física do seu próprio cabelo.',
        body: 'Menos acúmulo, mais resultado.'
      },
      {
        type: 'cta',
        tag: null,
        headline: 'Quantos potes você tem encostados no box?',
        body: 'Manda este post pra amiga que vive comprando o creme da moda e se decepcionando.',
        action: 'Salva para não gastar dinheiro à toa.'
      }
    ],
    caption: `Qual é o melhor creme pra cabelo cacheado — e por que essa pergunta está completamente errada.

Se você pesquisa sobre melhor creme para cabelo cacheado em Belo Horizonte ou vive com o armário cheio de potes pela metade, presta atenção nisso: o produto milagroso da sua amiga pesou no seu cabelo porque a física do seu fio é outra.

Creme não faz milagre sozinho. Ele é apenas um veículo cosmético.

O que decide se um finalizador vai funcionar no seu cacho:
- Porosidade da fibra: se a sua cutícula tem baixa porosidade, cremes cheios de manteiga pesada não entram no córtex. Eles ficam boiando por fora, criando acúmulo opaco e deixando o cabelo rígido.
- Espessura do fio: cachos finos precisam de fluidos leves e água abundante na distribuição. Creme espesso só serve para tirar o volume e achatar a raiz.
- O ciclo da troca: trocar de marca toda semana impede qualquer leitura real de resultado.

No Método Leitura de Fio, a gente analisa a elasticidade e a densidade real a seco antes de qualquer recomendação. Quando você sabe o que o fio pede, você para de gastar dinheiro à toa na prateleira.

Manda esse post pra amiga que não pode ver um lançamento de blogueira que já sai correndo pra comprar.

Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.

#cachos #cachosbrasil #cacheadas #curlygirls #curls`,
    altText: 'Mulher branca de cabelos ondulados 2C loiros olhando produtos com dúvida · Studio do Jon · Belo Horizonte',
    researchSummary: {
      mechanism: 'Penetração de lipídios vs. oclusão superficial. Fios de baixa porosidade possuem cutículas compactas com ângulo de inclinação fechado, impedindo a absorção de triglicerídeos pesados sem calor ou tensoativos adequados.',
      literalQuotes: [
        'Comprei o creme que todo mundo ama e meu cabelo ficou parecendo que passei sebo',
        'Meu cacho come creme e continua seco',
        'Tenho 10 potes no banheiro e nenhum funciona'
      ],
      gap: 'Marcas vendem produtos para "tipo 3 ou 4" ignorando que porosidade e espessura definem o resultado, não apenas o diâmetro da curvatura.',
      unverified: 'Nenhum teste de porosidade com copo dágua foi indicado por ser comprovadamente impreciso na tricologia.'
    }
  },
  {
    id: 'carrossel-08-09',
    date: '08/09 · Terça',
    isSearchRanked: false,
    searchRank: 'Posicionamento e Autoridade',
    objective: 'Autoridade + Comentário',
    title: 'Por que "salão especializado em cachos" virou palavra vazia',
    theme: 'Por que "salão especializado em cachos" virou palavra vazia. Opinião forte: hoje qualquer lugar coloca isso na vitrine, e a palavra deixou de significar coisa alguma. Listar o que de fato diferencia um lugar que sabe — avalia o fio seco antes, olha o couro cabeludo, pergunta histórico químico, corta considerando região por região. Reconhecer o lado oposto: existem profissionais excelentes sem rótulo nenhum. O ponto não é o letreiro, é o processo.',
    coverProfile: 'Mulher mista/asiática, corpo magro, cabelo cacheado 3C preto, olhando pra fora de uma vitrine de salão com expressão avaliativa.',
    coverLine1: 'SALÃO DE CACHOS',
    coverLine2: 'VIROU PALAVRA VAZIA',
    coverLine3: 'o que de fato separa quem sabe',
    coverImage: '/blog-leitura-fio-capa.webp',
    slides: [
      {
        type: 'cover',
        tag: null,
        headline: 'SALÃO DE CACHOS\nVIROU PALAVRA VAZIA',
        body: 'o que de fato separa quem sabe'
      },
      {
        type: 'second_cover',
        tag: null,
        headline: 'Colocar o rótulo na fachada ficou fácil.',
        body: 'O que define o especialista não é a vitrine, é o processo antes da tesoura →'
      },
      {
        type: 'content',
        tag: '01 · O DIAGNÓSTICO A SECO',
        headline: 'Quem entende lê o cacho no estado real.',
        body: 'Se molhou antes de avaliar a contração de cada mecha, já cortou no escuro.'
      },
      {
        type: 'content',
        tag: '02 · O COURO CABELUDO',
        headline: 'A raiz revela o histórico da fibra.',
        body: 'Olhar o couro cabeludo leva dois minutos. Quase ninguém faz.'
      },
      {
        type: 'content',
        tag: '03 · O HISTÓRICO QUÍMICO',
        headline: 'Perguntar de químicas passadas é obrigatório.',
        body: 'Fio que passou por relaxamento antigo tem ponto de quebra invisível sob tração.'
      },
      {
        type: 'content',
        tag: '04 · SETOR POR SETOR',
        headline: 'Cabelo não tem o mesmo cacho na cabeça toda.',
        body: 'A nuca, o topo e as têmporas pedem geometrias e inclinações diferentes.'
      },
      {
        type: 'content',
        tag: '05 · SEM REGRAS CEGAS',
        headline: 'Existem ótimos profissionais sem placa de especialista.',
        body: 'O que vale é a escuta e a técnica, não a decoração do salão.'
      },
      {
        type: 'fecho',
        tag: null,
        headline: 'O produto nunca é a tesoura.\nO produto sempre é a leitura.',
        body: 'Método Jon.'
      },
      {
        type: 'cta',
        tag: null,
        headline: 'Você já se decepcionou em salão de cachos?',
        body: 'Conta aqui nos comentários o que faltou no seu último atendimento.',
        action: 'Quero saber sua experiência.'
      }
    ],
    caption: `Por que "salão especializado em cachos" virou palavra vazia.

Se você procura corte para cabelo cacheado em Belo Horizonte já deve ter reparado: hoje qualquer espaço coloca "especialista em curvaturas" na fachada. E a palavra começou a perder o sentido.

O que separa um profissional que realmente domina a técnica de quem apenas decorou o salão com fotos bonitas:

- Análise a seco antes de molhar: o cacho só revela o encolhimento real e a assimetria no seu estado natural.
- Diagnóstico do couro cabeludo: descamação, tração e inflamação mudam toda a conduta da tesoura e do tratamento.
- Mapeamento por regiões: tratar a cabeça como um bloco uniforme é o erro clássico que gera o efeito pirâmide.

E vale a honestidade: existem profissionais incríveis que não usam rótulo nenhum e entregam um trabalho cirúrgico. O que importa nunca foi o letreiro. É o método de leitura.

Você já saiu frustrada de algum salão que se dizia especialista? Me conta nos comentários o que aconteceu.

Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.

#cachos #cachosbrasil #cacheadas #curlygirls #curls`,
    altText: 'Mulher mista de cabelos cacheados 3C pretos com expressão avaliativa · Studio do Jon · Belo Horizonte',
    researchSummary: {
      mechanism: 'Análise morfológica tridimensional do fio vs. corte mecânico linear. O folículo elíptico gera curvaturas distintas em diferentes quadrantes cranianos.',
      literalQuotes: [
        'Fui num salão caro de cachos e a moça cortou meu cabelo molhado e reto',
        'Paguei uma nota achando que era especialista e saí com um buraco atrás',
        'Prometem visagismo e fazem o mesmo corte redondo em todo mundo'
      ],
      gap: 'A maioria dos concorrentes não pode criticar o rótulo porque depende exclusivamente dele para vender. Jon ataca o processo técnico.',
      unverified: 'Fato e opinião do Jon claramente delimitados.'
    }
  },
  {
    id: 'carrossel-10-09',
    date: '10/09 · Quinta',
    isSearchRanked: true,
    searchRank: 'Nº 4 mais buscada do Brasil',
    objective: 'Salvamento Alto',
    title: 'Como cuidar de cabelo cacheado (O mínimo que funciona sem 12 passos)',
    theme: 'Como cuidar de cabelo cacheado — o mínimo que funciona, sem rotina de 12 passos. Desmontar a ideia de que cuidar bem exige muitos produtos e muito tempo. Mostrar os poucos pontos que de fato mudam resultado: lavagem sem agredir, água na finalização, redução de atrito, corte em dia. Fechar dizendo que rotina certa pro fio da pessoa é mais rápida que rotina errada repetida.',
    coverProfile: 'Mulher latina, corpo médio, cabelo cacheado 3B castanho-avermelhado, no banheiro com poucos produtos visíveis, expressão tranquila.',
    coverLine1: 'CUIDAR DO CACHO',
    coverLine2: 'SEM 12 PASSOS',
    coverLine3: 'o mínimo técnico que funciona',
    coverImage: '/blog-curvaturas.webp',
    slides: [
      {
        type: 'cover',
        tag: null,
        headline: 'CUIDAR DO CACHO\nSEM 12 PASSOS',
        body: 'o mínimo técnico que funciona'
      },
      {
        type: 'second_cover',
        tag: null,
        headline: 'Você não precisa de 2 horas no banheiro.',
        body: 'Rotina complexa é sintoma de produto errado ou corte vencido →'
      },
      {
        type: 'content',
        tag: '01 · LAVAGEM SUAVE',
        headline: 'Limpe o couro sem agredir o comprimento.',
        body: 'Shampoo na raiz com massagem circular. A espuma que desce já higieniza as pontas.'
      },
      {
        type: 'content',
        tag: '02 · ÁGUA COMO VEÍCULO',
        headline: 'Água é o melhor finalizador que você tem.',
        body: 'Distribuir creme no fio bem molhado reduz pela metade a quantidade de produto necessária.'
      },
      {
        type: 'content',
        tag: '03 · REDUÇÃO DE ATRITO',
        headline: 'Fronha de cetim e desembaraço de baixo para cima.',
        body: 'Dois hábitos simples que evitam quebra mecânica e seguram o day after sem retoque.'
      },
      {
        type: 'content',
        tag: '04 · CORTE NO TEMPO CERTO',
        headline: 'Corte em dia reduz o tempo de finalização.',
        body: 'Quando a geometria do cacho está alinhada, o cabelo seca definido sozinho.'
      },
      {
        type: 'content',
        tag: '05 · PRATICIDADE REAL',
        headline: 'Rotina boa é rotina que cabe na sua vida.',
        body: 'Se cuidar do seu cabelo virou um fardo diário, o processo está errado.'
      },
      {
        type: 'fecho',
        tag: null,
        headline: 'A rotina certa pro seu fio\né mais rápida que o erro repetido.',
        body: 'Menos passos, mais saúde.'
      },
      {
        type: 'cta',
        tag: null,
        headline: 'Quanto tempo você gasta finalizando?',
        body: 'Salva este checklist prático e manda para a amiga que vive presa em rotinas de 10 passos.',
        action: 'Salva para simplificar sua rotina.'
      }
    ],
    caption: `Como cuidar de cabelo cacheado — o mínimo que funciona, sem rotina de 12 passos.

Se você busca dicas de como cuidar de cabelo cacheado em Belo Horizonte e já cansou de ver tutoriais na internet exigindo 10 cremes diferentes e duas horas de dedoliss, simplifica isso agora.

O que realmente sustenta a saúde e a definição do cacho:

1. Higienização focada no couro: limpe o folículo com shampoo adequado e deixe que o enxágue cuide das pontas.
2. Água abundante na finalização: o cacho precisa de água para agrupar. O creme só sela a umidade. Menos produto, mais água.
3. Menos atrito diário: desembaraçar sempre de baixo para cima e dormir com fronha ou touca de cetim.
4. Manutenção geométrica: corte com caimento a seco elimina pontas danificadas e faz o cabelo definir quase sem esforço.

Rotina certa para o seu fio é rápida, prática e respeita o seu dia a dia.

Salva esse post para consultar no próximo banho e manda pra amiga que perde a paciência cuidando do cabelo.

Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.

#cachos #cachosbrasil #cacheadas #curlygirls #curls`,
    altText: 'Mulher latina de cabelos cacheados 3B castanhos no banheiro com poucos produtos · Studio do Jon · Belo Horizonte',
    researchSummary: {
      mechanism: 'Interação água-polímero na formação de feixes de cachos (*curl clumping*). Excesso de camadas oclusivas satura a fibra e gera peso desnecessário.',
      literalQuotes: [
        'Demoro duas horas pra finalizar meu cabelo e no dia seguinte já tá farofa',
        'Não tenho paciência pra rotina de 15 passos da internet',
        'Meu braço cansa de fazer fitagem mecha por mecha'
      ],
      gap: 'Influenciadores patrocinados criam passos extras para vender mais produtos. Jon não vende cosmético e propõe a simplificação lógica.',
      unverified: 'Sem prescrição de marcas comerciais.'
    }
  },
  {
    id: 'carrossel-15-09',
    date: '15/09 · Terça',
    isSearchRanked: false,
    searchRank: 'Episódio Mentira que te Contaram',
    objective: 'Autoridade + Envio',
    title: 'Silicone não é vilão do seu cacho (A ciência cosmética contra o mito)',
    theme: 'Silicone não é vilão do seu cacho. Episódio da série "Mentira que te contaram". Explicar que a ciência cosmética atual mostra que silicone solúvel em água não causa acúmulo significativo em concentração adequada, que o problema real é silicone insolúvel sem shampoo que remova, e que a demonização virou regra sem exceção. Reconhecer quando faz sentido evitar. Fechar em leitura de fio: depende do seu fio e da sua rotina de lavagem, não de regra fixa.',
    coverProfile: 'Mulher negra, corpo grande/plus-size, cabelo crespo 4B preto brilhante e definido, segurando um frasco e lendo o rótulo.',
    coverLine1: 'SILICONE NÃO É',
    coverLine2: 'O VILÃO DO CACHO',
    coverLine3: 'o que a ciência cosmética diz',
    coverImage: '/blog-cronograma-capilar.webp',
    slides: [
      {
        type: 'cover',
        tag: null,
        headline: 'SILICONE NÃO É\nO VILÃO DO CACHO',
        body: 'o que a ciência cosmética diz'
      },
      {
        type: 'second_cover',
        tag: null,
        headline: 'Te disseram que silicone estraga o fio.',
        body: 'A verdade técnica é bem mais simples do que o terrorismo dos rótulos →'
      },
      {
        type: 'content',
        tag: '01 · SOLÚVEL VS INSOLÚVEL',
        headline: 'Nem todo silicone se comporta igual.',
        body: 'Silicones solúveis em água protegem a fibra contra calor e saem no primeiro enxágue.'
      },
      {
        type: 'content',
        tag: '02 · O PAPEL DA BLINDAGEM',
        headline: 'Silicone reduz o atrito e sela a cutícula.',
        body: 'Em fios descoloridos ou com alta porosidade, ele evita que a umidade externa desmanche o cacho.'
      },
      {
        type: 'content',
        tag: '03 · O PROBLEMA REAL',
        headline: 'O vilão é o acúmulo sem lavagem adequada.',
        body: 'Usar silicone insolúvel todo dia e lavar só com co-wash fraco gera build-up.'
      },
      {
        type: 'content',
        tag: '04 · QUANDO EVITAR',
        headline: 'Fios finos e rotinas no poo pedem atenção.',
        body: 'Se você não usa shampoo com sulfato leve, evite silicones pesados como dimethicone puro.'
      },
      {
        type: 'content',
        tag: '05 · LEITURA DE FIO DECIDE',
        headline: 'Regra cega não substitui diagnóstico.',
        body: 'O que funciona pro seu cacho depende da sua rotina de lavagem e da porosidade.'
      },
      {
        type: 'fecho',
        tag: null,
        headline: 'Química cosmética é ferramenta.\nNão caia no terrorismo de internet.',
        body: 'Informação liberta.'
      },
      {
        type: 'cta',
        tag: null,
        headline: 'Você ainda tem medo de silicone?',
        body: 'Manda este post pra amiga que analisa rótulo com pânico e deixa de usar o que funciona.',
        action: 'Salva para consultar as fórmulas.'
      }
    ],
    caption: `Silicone não é o vilão do seu cacho.

Se você é daquelas que entra em pânico ao ler o rótulo de um produto procurando corte para cabelo cacheado em Belo Horizonte, vamos colocar a ciência cosmética na mesa.

A demonização do silicone virou regra cega na internet, mas a química do fio mostra outra realidade:

1. Silicones solúveis em água (como Dimethicone Copolyol) criam uma película protetora que reduz o atrito mecânico e saem facilmente na água sem acúmulo.
2. Em cabelos descoloridos ou com alta porosidade, o silicone age como barreira contra o calor e contra a umidade do ar que causa frizz.
3. O problema real nunca foi o silicone em si, mas usar fórmulas insolúveis pesadas sem usar um shampoo capaz de higienizar a fibra periodicamente.

Quem vende linha "zero silicone" não pode falar isso abertamente. Mas no Studio do Jon a gente não vende produto — a gente estuda a fibra.

Manda esse post pra amiga que vive neurótica com lista de ingredientes sem saber como a química age no fio.

Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.

#cachos #cachosbrasil #cacheadas #curlygirls #curls`,
    altText: 'Mulher negra de cabelos crespos 4B definidos lendo o rótulo de um frasco · Studio do Jon · Belo Horizonte',
    researchSummary: {
      mechanism: 'Polímeros de siloxano criam filmes hidrofóbicos seletivos. Silicones solúveis em água possuem grupos PEG/PPG modificados que garantem hidrossolubilidade completa sem efeito acumulativo.',
      literalQuotes: [
        'Disseram que silicone encapa o cabelo e apodrece por dentro',
        'Morro de medo de usar qualquer coisa com silicone',
        'Meu cabelo ficou opaco depois que cortei todo tipo de silicone'
      ],
      gap: 'Marcas "no poo" radicais criaram pânico em torno de ingredientes seguros para vender produtos específicos. Jon traz a ciência sem viés comercial.',
      unverified: 'Sem indicação comercial.'
    }
  }
];

export const RESERVE_CAROUSELS_AGENDA = [
  {
    id: 'reserva-01',
    title: 'Deixar a máscara mais tempo não melhora — satura o fio',
    coverProfile: 'Mulher branca, corpo médio, cabelo cacheado 3A ruivo acobreado.',
    category: 'Mitos & Verdades'
  },
  {
    id: 'reserva-02',
    title: 'Bob com franja longa: os 4 erros da versão 2026',
    coverProfile: 'Mulher mista, corpo magro, cabelo cacheado 3B preto.',
    category: 'Corte & Visagismo'
  },
  {
    id: 'reserva-03',
    title: 'O que o clima de BH faz com o seu cacho',
    coverProfile: 'Mulher latina, corpo grande, cabelo cacheado 3C castanho.',
    category: 'Saúde & Tratamento'
  },
  {
    id: 'reserva-04',
    title: 'Mãe sem tempo: os hábitos de "economia" que atrasam mais',
    coverProfile: 'Mulher negra, corpo grande, cabelo crespo 4B castanho.',
    category: 'Casos Reais & Rotinas'
  },
  {
    id: 'reserva-05',
    title: 'Penteados que não escondem o cacho debaixo de touca',
    coverProfile: 'Mulher branca, corpo magro, cabelo ondulado 2C loiro.',
    category: 'Finalização & Cuidados'
  },
  {
    id: 'reserva-06',
    title: 'Cabeleireiro que corta olhando só a foto que você mandou',
    coverProfile: 'Mulher mista, corpo médio, cabelo cacheado 3C castanho.',
    category: 'Corte & Visagismo'
  },
  {
    id: 'reserva-07',
    title: 'Transição capilar sem big chop por desespero',
    coverProfile: 'Mulher latina, corpo médio, cabelo ondulado/cacheado 3A castanho.',
    category: 'Transição Capilar'
  }
];

export default function InstagramCarouselStudio() {
  const [selectedCarouselId, setSelectedCarouselId] = useState(SEPTEMBER_CAROUSELS_AGENDA[0].id);
  const [activeViewMode, setActiveViewMode] = useState('grid'); // 'grid' | 'slider'
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('slides'); // 'slides' | 'caption' | 'prompts' | 'research'
  const [copiedKey, setCopiedKey] = useState(null);
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [customThemeTitle, setCustomThemeTitle] = useState('');
  const [customCoverProfile, setCustomCoverProfile] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Active Carousel Data
  const currentCarousel = useMemo(() => {
    const found = SEPTEMBER_CAROUSELS_AGENDA.find(c => c.id === selectedCarouselId);
    return found || SEPTEMBER_CAROUSELS_AGENDA[0];
  }, [selectedCarouselId]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const getGeminiPromptForSlide = (slide, index, total, carousel) => {
    if (slide.type === 'cover') {
      const lines = slide.headline.split('\n');
      return `Crie imagem fotorrealista para slide de Carrossel 4:5 (1080×1350px).

IMAGEM: Retrato fotorrealista editorial de ${carousel.coverProfile}. Fundo preto sólido #0a0a0a com iluminação de estúdio quente destacando a textura tridimensional dos cachos. Composição limpa com espaço negativo e gradiente suave na base.

TEXTO NA IMAGEM — os textos entre aspas abaixo são o único conteúdo a renderizar; as aspas são só marcador, não fazem parte do texto:

"${lines[0] || 'O ERRO NO BANHO'}"
ESTILO: terço inferior centralizado · Helvetica Now Display Medium, branco #ffffff, tamanho grande, caixa alta

"${lines[1] || 'QUE PARTE SEU CACHO'}"
ESTILO: linha seguinte, centralizado · Helvetica Now Display Medium, âmbar #c8852a, tamanho grande, caixa alta

"${slide.body}"
ESTILO: linha seguinte, centralizado · Helvetica Now Display Light, branco #ffffff, tamanho médio, minúscula

FONTE ÚNICA: Helvetica Now Display, variando só peso. NUNCA renderizar as aspas nem a palavra "ESTILO".
PROIBIÇÕES: sem contador de slide, sem bordas laterais, sem ghost number, sem serifa clássica, sem diamond icons. Verificar ortografia antes de renderizar. Renderizar SOMENTE o texto especificado.`;
    }

    if (slide.type === 'second_cover') {
      const lines = slide.headline.split('\n');
      return `Crie imagem fotorrealista para slide de Carrossel 4:5 (1080×1350px).

IMAGEM: fundo sólido #0a0a0a, sem fotografia — composição 100% tipográfica.

TEXTO NA IMAGEM — os textos entre aspas abaixo são o único conteúdo a renderizar; as aspas são só marcador, não fazem parte do texto:

"${lines[0] || 'Seu cabelo não parou de crescer.'}"
ESTILO: centro alinhado à esquerda · Helvetica Now Display Light, branco #ffffff, tamanho médio-grande

"${lines[1] || 'A raiz continua fazendo o trabalho dela.'}"
ESTILO: linha seguinte, alinhado à esquerda · Helvetica Now Display Light, branco 80% #cccccc, tamanho médio-grande

"${slide.body}"
ESTILO: linha seguinte, alinhado à esquerda · Helvetica Now Display Medium, âmbar #c8852a, tamanho médio-grande

FONTE ÚNICA: Helvetica Now Display, variando só peso. NUNCA renderizar as aspas nem a palavra "ESTILO".
PROIBIÇÕES: sem contador de slide, sem bordas laterais, sem ghost number, sem serifa clássica, sem diamond icons. Verificar ortografia antes de renderizar. Renderizar SOMENTE o texto especificado.`;
    }

    if (slide.type === 'fecho') {
      const lines = slide.headline.split('\n');
      return `Crie imagem fotorrealista para slide de Carrossel 4:5 (1080×1350px).

IMAGEM: fundo sólido #0a0a0a, sem fotografia — composição 100% tipográfica.

TEXTO NA IMAGEM — os textos entre aspas abaixo são o único conteúdo a renderizar; as aspas são só marcador, não fazem parte do texto:

"${lines[0] || 'O crescimento acontece na raiz.'}"
ESTILO: centro alinhado ao centro · Helvetica Now Display Light, branco #ffffff, tamanho médio-grande

"${lines[1] || 'O comprimento é você quem protege no banho.'}"
ESTILO: linha seguinte, centralizado · Helvetica Now Display Medium, âmbar #c8852a, tamanho médio-grande

"${slide.body}"
ESTILO: linha seguinte, centralizado · Helvetica Now Display Light, branco 80% #cccccc, tamanho médio-grande

FONTE ÚNICA: Helvetica Now Display, variando só peso. NUNCA renderizar as aspas nem a palavra "ESTILO".
PROIBIÇÕES: sem contador de slide, sem bordas laterais, sem ghost number, sem serifa clássica, sem diamond icons. Verificar ortografia antes de renderizar. Renderizar SOMENTE o texto especificado.`;
    }

    if (slide.type === 'cta') {
      return `Crie imagem fotorrealista para slide de Carrossel 4:5 (1080×1350px).

IMAGEM: fundo sólido #0a0a0a, sem fotografia — composição 100% tipográfica.

TEXTO NA IMAGEM — os textos entre aspas abaixo são o único conteúdo a renderizar; as aspas são só marcador, não fazem parte do texto:

"${slide.headline}"
ESTILO: terço superior alinhado à esquerda · Helvetica Now Display Medium, branco #ffffff, tamanho grande

"${slide.body}"
ESTILO: centro alinhado à esquerda · Helvetica Now Display Light, branco 80% #cccccc, tamanho médio

"${slide.action}"
ESTILO: terço inferior alinhado à esquerda · Helvetica Now Display Medium, âmbar #c8852a, tamanho médio-grande

FONTE ÚNICA: Helvetica Now Display, variando só peso. NUNCA renderizar as aspas nem a palavra "ESTILO".
PROIBIÇÕES: sem contador de slide, sem bordas laterais, sem ghost number, sem serifa clássica, sem diamond icons. Verificar ortografia antes de renderizar. Renderizar SOMENTE o texto especificado.`;
    }

    // Default Content Slide (Slides 3 a 7)
    return `Crie imagem fotorrealista para slide de Carrossel 4:5 (1080×1350px).

IMAGEM: fundo sólido #0a0a0a, sem fotografia — composição 100% tipográfica.

TEXTO NA IMAGEM — os textos entre aspas abaixo são o único conteúdo a renderizar; as aspas são só marcador, não fazem parte do texto:

"${slide.tag}"
ESTILO: topo alinhado à esquerda · Helvetica Now Display Medium, âmbar #c8852a, tamanho pequeno

"${slide.headline}"
ESTILO: centro alinhado à esquerda · Helvetica Now Display Medium, branco #ffffff, tamanho grande

"${slide.body}"
ESTILO: abaixo da afirmação principal, alinhado à esquerda · Helvetica Now Display Light, branco 80% #cccccc, tamanho médio

FONTE ÚNICA: Helvetica Now Display, variando só peso. NUNCA renderizar as aspas nem a palavra "ESTILO".
PROIBIÇÕES: sem contador de slide, sem bordas laterais, sem ghost number, sem serifa clássica, sem diamond icons. Verificar ortografia antes de renderizar. Renderizar SOMENTE o texto especificado.`;
  };

  const allPromptsCombined = useMemo(() => {
    return currentCarousel.slides.map((s, idx) => {
      return `=== SLIDE ${idx + 1} (${s.type.toUpperCase()}) ===\n` + getGeminiPromptForSlide(s, idx, currentCarousel.slides.length, currentCarousel);
    }).join('\n\n');
  }, [currentCarousel]);

  return (
    <div className="instagram-carousel-studio">
      
      {/* Top Header Card */}
      <div className="studio-hero-card">
        <div className="studio-hero-content">
          <div className="studio-badge">
            <Sparkles size={13} /> ESTÚDIO DE CARROSSÉIS · INSTAGRAM (@OJONQUECORTOU)
          </div>
          <h2>Gerador & Pré-visualizador de Carrosséis Oficiais</h2>
          <p>
            Conteúdo com fundamentação técnica em tricologia, tom direto do Jon, proporção 4:5, 
            sistema visual <strong>#0a0a0a + âmbar #c8852a</strong> e prompts de imagem prontos para o Gemini.
          </p>
        </div>

        <div className="studio-hero-stats">
          <div className="hero-stat-pill">
            <Calendar size={14} /> <strong>12</strong> Posts na Agenda de Setembro
          </div>
          <div className="hero-stat-pill">
            <Target size={14} /> <strong>9</strong> Slides por Carrossel (Regra &lt;25 palavras)
          </div>
        </div>
      </div>

      {/* Theme Selection Bar */}
      <div className="studio-selection-section">
        <div className="selection-header">
          <div className="selection-title">
            <Layers size={16} />
            <span>Escolha o Post da Agenda ou Crie um Novo</span>
          </div>
          <div className="selection-tabs">
            <button 
              className={`view-mode-btn ${!isCustomMode ? 'active' : ''}`}
              onClick={() => setIsCustomMode(false)}
            >
              📅 Agenda de Setembro 2026
            </button>
            <button 
              className={`view-mode-btn ${isCustomMode ? 'active' : ''}`}
              onClick={() => setIsCustomMode(true)}
            >
              ✍️ Criar Tema Personalizado
            </button>
          </div>
        </div>

        {!isCustomMode ? (
          <div className="carousel-agenda-grid">
            {SEPTEMBER_CAROUSELS_AGENDA.map((item) => {
              const isSelected = item.id === selectedCarouselId;
              return (
                <div 
                  key={item.id}
                  className={`agenda-post-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCarouselId(item.id);
                    setActiveSlideIndex(0);
                  }}
                >
                  <div className="agenda-card-top">
                    <span className="agenda-date-pill">{item.date}</span>
                    {item.isSearchRanked && (
                      <span className="search-ranked-pill">🔍 {item.searchRank}</span>
                    )}
                  </div>
                  <h4 className="agenda-card-title">{item.title}</h4>
                  <div className="agenda-card-footer">
                    <span className="agenda-obj-tag">🎯 {item.objective}</span>
                    <span className="agenda-slides-count">9 slides</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="custom-theme-creator-box">
            <div className="custom-input-grid">
              <div className="custom-field">
                <label>Tema ou Dúvida Principal:</label>
                <input 
                  type="text" 
                  placeholder="Ex: Por que a acidificação estraga o cacho se feita em excesso?"
                  value={customThemeTitle}
                  onChange={(e) => setCustomThemeTitle(e.target.value)}
                  className="studio-input"
                />
              </div>
              <div className="custom-field">
                <label>Perfil da Cliente-Modelo da Capa (Etnia, Corpo, Cabelo):</label>
                <input 
                  type="text" 
                  placeholder="Ex: Mulher latina, corpo médio, cabelo cacheado 3A ruivo"
                  value={customCoverProfile}
                  onChange={(e) => setCustomCoverProfile(e.target.value)}
                  className="studio-input"
                />
              </div>
            </div>
            <button 
              className="generate-ai-btn"
              onClick={() => {
                alert(`Tema "${customThemeTitle || 'Personalizado'}" preparado! O assistente pode gerar a pesquisa e os 9 slides.`);
              }}
            >
              <Sparkles size={16} /> Gerar Carrossel com o Método Leitura de Fio
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Viewport (Tabs + Interactive Preview) */}
      <div className="studio-workspace">
        
        {/* Navigation Tabs */}
        <div className="workspace-tabs-bar">
          <div className="workspace-tabs-left">
            <button 
              className={`workspace-tab ${activeTab === 'slides' ? 'active' : ''}`}
              onClick={() => setActiveTab('slides')}
            >
              <Eye size={15} /> Prévia dos Slides (4:5)
            </button>
            <button 
              className={`workspace-tab ${activeTab === 'caption' ? 'active' : ''}`}
              onClick={() => setActiveTab('caption')}
            >
              <FileText size={15} /> Legenda & SEO Local
            </button>
            <button 
              className={`workspace-tab ${activeTab === 'prompts' ? 'active' : ''}`}
              onClick={() => setActiveTab('prompts')}
            >
              <Sparkles size={15} /> Prompts do Gemini ({currentCarousel.slides.length})
            </button>
            <button 
              className={`workspace-tab ${activeTab === 'research' ? 'active' : ''}`}
              onClick={() => setActiveTab('research')}
            >
              <Search size={15} /> Pesquisa Técnica & Diagnóstico
            </button>
          </div>

          <div className="workspace-tabs-right">
            {activeTab === 'slides' && (
              <div className="view-switch-pills">
                <button 
                  className={`view-pill ${activeViewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setActiveViewMode('grid')}
                >
                  Grade Completa
                </button>
                <button 
                  className={`view-pill ${activeViewMode === 'slider' ? 'active' : ''}`}
                  onClick={() => setActiveViewMode('slider')}
                >
                  Apresentação (1 por 1)
                </button>
              </div>
            )}
            <a 
              href="/preview_carrossel_01_setembro.html"
              target="_blank"
              rel="noreferrer"
              className="open-external-btn"
            >
              <ExternalLink size={14} /> Abrir Tela Cheia
            </a>
          </div>
        </div>

        {/* TAB 1: SLIDES PREVIEW */}
        {activeTab === 'slides' && (
          <div className="slides-preview-container">
            
            {activeViewMode === 'grid' ? (
              <div className="slides-live-grid">
                {currentCarousel.slides.map((slide, idx) => {
                  const isCover = slide.type === 'cover';
                  const isSecondCover = slide.type === 'second_cover';
                  const isFecho = slide.type === 'fecho';
                  const isCta = slide.type === 'cta';
                  
                  return (
                    <div 
                      key={idx} 
                      className={`live-slide-card ${isCover ? 'card-cover' : ''} ${isSecondCover ? 'card-second-cover' : ''} ${isFecho ? 'card-fecho' : ''} ${isCta ? 'card-cta' : ''}`}
                      style={isCover ? { backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.1) 45%, rgba(10,10,10,0.92) 80%, #0a0a0a 100%), url(${currentCarousel.coverImage || '/blog-embaraco.webp'})` } : {}}
                    >
                      <div className="slide-top-bar">
                        <span className="slide-type-tag">
                          {isCover ? 'CAPA' : isSecondCover ? '2ª CAPA' : isFecho ? 'FECHO' : isCta ? 'CTA' : `SLIDE 0${idx + 1}`}
                        </span>
                        <button 
                          className="copy-slide-prompt-btn"
                          title="Copiar prompt do Gemini para este slide"
                          onClick={() => handleCopy(getGeminiPromptForSlide(slide, idx, currentCarousel.slides.length, currentCarousel), `slide_${idx}`)}
                        >
                          {copiedKey === `slide_${idx}` ? <Check size={12} style={{ color: '#4ade80' }} /> : <Copy size={12} />}
                          <span>{copiedKey === `slide_${idx}` ? 'Copiado!' : 'Prompt'}</span>
                        </button>
                      </div>

                      {isCover && (
                        <div className="cover-lower-third">
                          {(() => {
                            const lines = slide.headline.split('\n');
                            return (
                              <>
                                <div className="c-line1">{lines[0] || 'O ERRO NO BANHO'}</div>
                                <div className="c-line2">{lines[1] || 'QUE PARTE SEU CACHO'}</div>
                                <div className="c-line3">{slide.body}</div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {isSecondCover && (
                        <div className="second-cover-body">
                          {(() => {
                            const lines = slide.headline.split('\n');
                            return (
                              <>
                                <div className="sc-line1">{lines[0]}</div>
                                <div className="sc-line2">{lines[1]}</div>
                                <div className="sc-line3">{slide.body}</div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {!isCover && !isSecondCover && !isFecho && !isCta && (
                        <div className="content-slide-body">
                          {slide.tag && <div className="slide-amber-tag">{slide.tag}</div>}
                          <div className="slide-main-claim">{slide.headline}</div>
                          <div className="slide-support-text">{slide.body}</div>
                        </div>
                      )}

                      {isFecho && (
                        <div className="fecho-slide-body">
                          {(() => {
                            const lines = slide.headline.split('\n');
                            return (
                              <>
                                <div className="f-line1">{lines[0]}</div>
                                <div className="f-line2">{lines[1]}</div>
                                <div className="f-line3">{slide.body}</div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {isCta && (
                        <div className="cta-slide-body">
                          <div className="cta-head">{slide.headline}</div>
                          <div className="cta-desc">{slide.body}</div>
                          <div className="cta-act">{slide.action}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="slider-mode-wrapper">
                <div className="slider-controls-top">
                  <button 
                    className="slider-nav-arrow"
                    disabled={activeSlideIndex === 0}
                    onClick={() => setActiveSlideIndex(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={20} /> Anterior
                  </button>
                  <span className="slider-progress-text">
                    Slide <strong>{activeSlideIndex + 1}</strong> de {currentCarousel.slides.length}
                  </span>
                  <button 
                    className="slider-nav-arrow"
                    disabled={activeSlideIndex === currentCarousel.slides.length - 1}
                    onClick={() => setActiveSlideIndex(p => Math.min(currentCarousel.slides.length - 1, p + 1))}
                  >
                    Próximo <ChevronRight size={20} />
                  </button>
                </div>

                <div className="slider-single-card-view">
                  {(() => {
                    const slide = currentCarousel.slides[activeSlideIndex];
                    const isCover = slide.type === 'cover';
                    const isSecondCover = slide.type === 'second_cover';
                    const isFecho = slide.type === 'fecho';
                    const isCta = slide.type === 'cta';

                    return (
                      <div 
                        className={`live-slide-card large-preview ${isCover ? 'card-cover' : ''} ${isSecondCover ? 'card-second-cover' : ''} ${isFecho ? 'card-fecho' : ''} ${isCta ? 'card-cta' : ''}`}
                        style={isCover ? { backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.1) 45%, rgba(10,10,10,0.92) 80%, #0a0a0a 100%), url(${currentCarousel.coverImage || '/blog-embaraco.webp'})` } : {}}
                      >
                        <div className="slide-top-bar">
                          <span className="slide-type-tag">
                            {isCover ? 'SLIDE 1 · CAPA' : isSecondCover ? 'SLIDE 2 · 2ª CAPA' : isFecho ? `SLIDE ${activeSlideIndex + 1} · FECHO` : isCta ? `SLIDE ${activeSlideIndex + 1} · CTA` : `SLIDE 0${activeSlideIndex + 1} · CONTEÚDO`}
                          </span>
                          <button 
                            className="copy-slide-prompt-btn"
                            onClick={() => handleCopy(getGeminiPromptForSlide(slide, activeSlideIndex, currentCarousel.slides.length, currentCarousel), `single_${activeSlideIndex}`)}
                          >
                            {copiedKey === `single_${activeSlideIndex}` ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
                            <span>{copiedKey === `single_${activeSlideIndex}` ? 'Copiado!' : 'Copiar Prompt Gemini'}</span>
                          </button>
                        </div>

                        {isCover && (
                          <div className="cover-lower-third">
                            {(() => {
                              const lines = slide.headline.split('\n');
                              return (
                                <>
                                  <div className="c-line1">{lines[0] || 'O ERRO NO BANHO'}</div>
                                  <div className="c-line2">{lines[1] || 'QUE PARTE SEU CACHO'}</div>
                                  <div className="c-line3">{slide.body}</div>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {isSecondCover && (
                          <div className="second-cover-body">
                            {(() => {
                              const lines = slide.headline.split('\n');
                              return (
                                <>
                                  <div className="sc-line1">{lines[0]}</div>
                                  <div className="sc-line2">{lines[1]}</div>
                                  <div className="sc-line3">{slide.body}</div>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {!isCover && !isSecondCover && !isFecho && !isCta && (
                          <div className="content-slide-body">
                            {slide.tag && <div className="slide-amber-tag">{slide.tag}</div>}
                            <div className="slide-main-claim">{slide.headline}</div>
                            <div className="slide-support-text">{slide.body}</div>
                          </div>
                        )}

                        {isFecho && (
                          <div className="fecho-slide-body">
                            {(() => {
                              const lines = slide.headline.split('\n');
                              return (
                                <>
                                  <div className="f-line1">{lines[0]}</div>
                                  <div className="f-line2">{lines[1]}</div>
                                  <div className="f-line3">{slide.body}</div>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {isCta && (
                          <div className="cta-slide-body">
                            <div className="cta-head">{slide.headline}</div>
                            <div className="cta-desc">{slide.body}</div>
                            <div className="cta-act">{slide.action}</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: CAPTION & SEO */}
        {activeTab === 'caption' && (
          <div className="caption-tab-content">
            <div className="caption-header-row">
              <div>
                <h3>Legenda do Post (Com SEO Local & Tom do Jon)</h3>
                <p className="caption-subtitle">Linha 1 retenção · Linha 2 termos de busca em BH · CTA único · Rodapé fixo</p>
              </div>
              <button 
                className="action-copy-btn primary"
                onClick={() => handleCopy(currentCarousel.caption, 'full_caption')}
              >
                {copiedKey === 'full_caption' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedKey === 'full_caption' ? 'Legenda Copiada!' : 'Copiar Legenda Completa'}</span>
              </button>
            </div>

            <div className="caption-text-area-box">
              <pre className="caption-pre-formatted">{currentCarousel.caption}</pre>
            </div>

            <div className="alt-text-box">
              <div className="alt-text-label">
                <CheckCircle2 size={15} style={{ color: 'var(--adm-gold)' }} />
                <span>Alt Text Obrigatório (Acessibilidade & SEO):</span>
              </div>
              <div className="alt-text-content">
                <code>{currentCarousel.altText}</code>
                <button 
                  className="copy-mini-btn"
                  onClick={() => handleCopy(currentCarousel.altText, 'alt_text')}
                >
                  {copiedKey === 'alt_text' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROMPTS FOR GEMINI */}
        {activeTab === 'prompts' && (
          <div className="prompts-tab-content">
            <div className="prompts-header-row">
              <div>
                <h3>Prompts de Imagem para o Gemini (1 a 9)</h3>
                <p className="prompts-subtitle">Prontos para gerar no Google Gemini. Aspas retas, fontes Helvetica Now Display e regras anti-alucinação.</p>
              </div>
              <button 
                className="action-copy-btn primary"
                onClick={() => handleCopy(allPromptsCombined, 'all_prompts')}
              >
                {copiedKey === 'all_prompts' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedKey === 'all_prompts' ? 'Todos os Prompts Copiados!' : 'Copiar Todos os 9 Prompts'}</span>
              </button>
            </div>

            <div className="prompts-accordion-list">
              {currentCarousel.slides.map((s, idx) => {
                const prompt = getGeminiPromptForSlide(s, idx, currentCarousel.slides.length, currentCarousel);
                return (
                  <div key={idx} className="prompt-item-card">
                    <div className="prompt-item-header">
                      <span className="prompt-slide-pill">SLIDE {idx + 1} ({s.type.toUpperCase()})</span>
                      <button 
                        className="copy-mini-btn"
                        onClick={() => handleCopy(prompt, `p_${idx}`)}
                      >
                        {copiedKey === `p_${idx}` ? 'Copiado!' : 'Copiar Este Prompt'}
                      </button>
                    </div>
                    <pre className="prompt-code-block">{prompt}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: RESEARCH & MECHANISM */}
        {activeTab === 'research' && (
          <div className="research-tab-content">
            <h3>🔬 Bloco de Pesquisa & Fundamentação Técnica</h3>
            <p className="research-intro">
              Todo conteúdo gerado pelo @ojonquecortou passa por 4 blocos de validação antes de ser escrito.
            </p>

            <div className="research-grid">
              <div className="research-block-card">
                <h4>1. Mecanismo Técnico (Tricologia)</h4>
                <p>{currentCarousel.researchSummary?.mechanism || 'Análise da estrutura morfológica da queratina e cutícula.'}</p>
              </div>

              <div className="research-block-card">
                <h4>2. Frases Literais do Público</h4>
                <ul>
                  {(currentCarousel.researchSummary?.literalQuotes || []).map((q, i) => (
                    <li key={i}>"{q}"</li>
                  ))}
                </ul>
              </div>

              <div className="research-block-card">
                <h4>3. A Brecha de Mercado</h4>
                <p>{currentCarousel.researchSummary?.gap || 'O ângulo que os concorrentes omitem.'}</p>
              </div>

              <div className="research-block-card">
                <h4>4. Validação & Sem Invenções</h4>
                <p>{currentCarousel.researchSummary?.unverified || 'Todo número sem fonte citável foi cortado.'}</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
