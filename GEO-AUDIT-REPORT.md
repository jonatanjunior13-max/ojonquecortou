# GEO Audit Report: Studio do Jon — O Jon que Cortou

**Data da Auditoria:** 2026-06-18  
**URL:** https://www.ojonquecortou.com.br  
**Tipo de Negócio:** Local Business (Salão especialista em cabelos cacheados)  
**Páginas Analisadas:** 52 (homepage, 8 páginas principais, 17 serviços, 5 blog posts amostragem + estrutura das 41 posts)

---

## Sumário Executivo

**GEO Score Geral: 61/100 (Regular)**

O site tem uma base técnica sólida e acima da média para negócios locais: llms.txt existe, todos os principais crawlers de IA estão liberados, schema JSON-LD cobre LocalBusiness/FAQPage/Article/Review, e os blog posts têm conteúdo completo indexável via noscript. O maior problema crítico é que a **homepage não tem corpo de texto crawlável** — apenas uma nav oculta, zero conteúdo para IA sem JavaScript. Secundariamente, ausência de presença em plataformas que IAs citam (YouTube, Wikipedia, Reddit) e schemas duplicados em todas as páginas limitam o potencial.

### Pontuação por Categoria

| Categoria | Score | Peso | Pontuação Ponderada |
|---|---|---|---|
| AI Citabilidade | 65/100 | 25% | 16,25 |
| Autoridade de Marca | 52/100 | 20% | 10,40 |
| Conteúdo E-E-A-T | 68/100 | 20% | 13,60 |
| Infraestrutura Técnica GEO | 62/100 | 15% | 9,30 |
| Schema & Dados Estruturados | 72/100 | 10% | 7,20 |
| Otimização de Plataformas | 42/100 | 10% | 4,20 |
| **GEO Score Geral** | | | **61/100** |

---

## Issues Críticos (Corrigir Imediatamente)

### CRÍTICO-1: Homepage sem corpo de texto crawlável

**Impacto:** AI crawlers (GPTBot, ClaudeBot, Perplexity) e Googlebot sem JS acessam a homepage e encontram **zero conteúdo de texto no body**. O `<div id="root">` contém apenas uma `<nav>` visualmente oculta com links. Nenhum noscript article, nenhum H1, nenhum parágrafo.

**Problema:** Blog posts têm noscript content completo — excelente. Mas a homepage não.

**Arquivo:** `scripts/prerender.js` — adicionar `bodyInsert` para a rota `/`

**Fix:**
```javascript
// Na entrada route: '/' do array pages, adicionar:
{
  route: '/',
  title: 'Especialista em Cabelo Cacheado BH | Studio do Jon',
  description: '...',
  bodyInsert: homeBody,  // <-- falta isso
  schema: { ... }
}
```

Criar um `homeBody` com `<noscript>` contendo: H1, parágrafo de apresentação, lista de serviços, endereço, CTA para /agendar.

---

### CRÍTICO-2: Dois schemas HairSalon em conflito em todas as páginas

**Impacto:** Todas as páginas têm **dois blocos JSON-LD separados** com `@type: HairSalon`. Um é o schema dinâmico do prerender.js (completo, com GeoCoordinates, OpeningHours, AggregateRating). O outro é um schema estático hardcoded no `index.html` original (simplificado, com `email: jonatanjunior13@gmail.com` e `postalCode` incompleto).

**Problema:** Crawlers de IA podem ler informações conflitantes. O schema estático usa `email: jonatanjunior13@gmail.com` (email pessoal) enquanto o dinâmico usa `contato@ojonquecortou.com.br`. Pricerange: `"$"` no dinâmico vs `"R$80–R$699"` no estático.

**Arquivo:** `index.html` (raiz do projeto) — remover o segundo bloco `<script type="application/ld+json">` estático

---

## Issues de Alta Prioridade (Corrigir em 1 Semana)

### ALTO-1: CEP inconsistente no schema de Reviews

**Página:** `/depoimentos`  
**Problema:** Schema `Review` usa `postalCode: "30720-320"` mas o `localBusinessSchema` correto usa `"30770-040"`.  
**Arquivo:** `scripts/prerender.js` — linha com `reviewsPageBody` e schema de depoimentos  

### ALTO-2: og:type "website" em todos os blog posts

**Impacto:** Plataformas de IA e Facebook/WhatsApp não identificam o conteúdo como artigo, reduzindo a extração como citação editorial.  
**Problema:** Todo blog post tem `<meta property="og:type" content="website" />` — deveria ser `"article"`.  
**Fix em `prerender.js`:** Para páginas com rota `/blog/`, injetar `og:type = article`, `article:author`, `article:published_time`, `article:modified_time`.

```javascript
if (page.route.startsWith('/blog/')) {
  html = html.replace(
    '<meta property="og:type" content="website" />',
    `<meta property="og:type" content="article" />`
  );
  html = replaceOrAddMeta(html, 'article:author', 'Jonatan Junior', true);
  if (page.schema && page.schema.datePublished) {
    html = replaceOrAddMeta(html, 'article:published_time', page.schema.datePublished, true);
  }
}
```

### ALTO-3: Sem BreadcrumbList schema

**Impacto:** IAs e Google não entendem hierarquia das páginas. Blog posts e serviços ficam sem contexto de navegação.  
**Fix:** Adicionar BreadcrumbList em blog posts e páginas de serviço no prerender.js:

```javascript
const breadcrumb = {
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.ojonquecortou.com.br" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.ojonquecortou.com.br/blog" },
    { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://www.ojonquecortou.com.br/blog/${post.slug}` }
  ]
};
```

### ALTO-4: Maioria dos blog posts sem FAQPage schema

**Impacto:** Posts de alta performance (porosidade, pH, corte a seco, shaggy) respondem perguntas diretamente mas não têm FAQPage schema. AIs que buscam Q&A não os cita em formato estruturado.  
**Situação atual:** Apenas ~4 posts têm FAQPage schema. 37 não têm.  
**Fix:** Adicionar 3-5 FAQ questions+answers em cada post no `posts.js` e incluir no schema.

### ALTO-5: llms.txt incompleto

**Problemas detectados:**
- `sameAs` lista apenas Instagram — falta Facebook, Linktr.ee, Google Maps CID
- Sem menção às avaliações (4.9 estrelas, 272 reviews)
- Sem lista de tópicos de blog cobertos
- Email no llms.txt é pessoal (`jonatanjunior13@gmail.com`) — deveria ser `contato@ojonquecortou.com.br`

---

## Issues de Média Prioridade (Corrigir em 30 dias)

### MÉDIO-1: Pessoa sem imagem no schema

`/sobre` tem schema `Person` completo mas sem campo `"image"`. IAs que identificam pessoas priorizam entidades com foto associada.  
**Fix:** Adicionar `"image": "https://www.ojonquecortou.com.br/jon-perfil.webp"` ao `founderPersonSchema` no prerender.js.

### MÉDIO-2: /metodo usa Service schema — deveria ser Article

A página `/metodo` é uma long-form educational page com ~3.000 palavras. Schema `Service` não captura o valor citável do conteúdo.  
**Fix:** Usar `Article` ou `WebPage` com `mainEntity: { "@type": "HowTo" }` para as 7 etapas do método.

### MÉDIO-3: Sem HowTo schema nas etapas do Método

O `/metodo` descreve um processo de 7 etapas — estrutura perfeita para `HowTo` schema. IAs usam HowTo para respostas "como fazer".

### MÉDIO-4: Article schema sem wordCount

Todos os artigos do blog têm schema `Article` mas sem `"wordCount"`. Google e IAs usam isso para avaliar profundidade.  
**Fix:** Calcular palavra estimada no prerender.js e adicionar ao schema.

### MÉDIO-5: Sem presença em YouTube

IAs (especialmente ChatGPT e Perplexity) citam frequentemente vídeos de YouTube como fonte de expertise. Canal com demonstrações do Método Leitura de Fio aumentaria drasticamente a citabilidade.

### MÉDIO-6: Sem presença no Reddit/Quora

Para perguntas como "melhor cabeleireiro cachos BH" ou "como fazer transição capilar", IAs buscam recomendações de fóruns. Zero presença detectada.

---

## Issues de Baixa Prioridade

### BAIXO-1: Sem speakable markup

Páginas de FAQ e blog seriam candidatos ideais para `SpeakableSpecification`, permitindo que assistentes de voz (Google Assistant, Alexa) extraiam trechos.

### BAIXO-2: Endereço usa "Caiçaras" em alguns lugares, "Caiçaras" em outros

Inconsistência menor no streetAddress — ora `"Caiçaras"`, ora `"Caiçaras"`. Padronizar para `"Caiçaras"`.

### BAIXO-3: Sem datePublished no schema da homepage

### BAIXO-4: Twitter/X sem `twitter:image` em algumas páginas

---

## Deep Dives por Categoria

### AI Citabilidade — 65/100

**Pontos fortes:**
- Blog posts têm conteúdo técnico rico e citável via `<noscript>`. O artigo sobre acidificação capilar (~900 palavras) é excelente — explica conceitos físicos/químicos com linguagem especialista clara. AIs podem extrair parágrafos inteiros.
- FAQ page tem 12 perguntas completas com respostas diretas.
- Termos específicos e proprietários ("Leitura de Fio", "Corte Híbrido") criam citações únicas.

**Problemas:**
- Homepage = zero texto crawlável. Primeira impressão para IA: página em branco.
- ~37 blog posts sem FAQPage schema — oportunidade perdida enorme.
- Artigos não têm citações externas ou fontes (fragilidade E-E-A-T).

**Exemplos de conteúdo citável existente:**
> "A acidificação capilar é um procedimento técnico projetado para devolver o pH do cabelo à sua faixa ácida fisiológica... ela age na física da fibra: ela altera o estado das cutículas para que elas possam segurar os nutrientes." — Excelente para citação sobre cuidados capilares.

> "O Método Leitura de Fio tem 7 etapas sequenciais: 1) Escuta, 2) Análise a seco, 3) Diagnóstico do couro cabeludo, 4) Histórico químico, 5) Análise molhada, 6) Definição de técnica, 7) Finalização como validação." — Estrutura perfeita para extração por IA.

---

### Autoridade de Marca — 52/100

**Presença mapeada:**
| Plataforma | Status |
|---|---|
| Instagram (@ojonquecortou) | ✅ Ativo, referenciado em schema |
| Facebook | ✅ Presente, linkado |
| Google Maps / GBP | ✅ CID confirmado (16629671607593282841), 4.9⭐ / 272 avaliações |
| Linktr.ee | ✅ Linkado |
| YouTube | ❌ Ausente |
| Wikipedia | ❌ Ausente |
| Reddit | ❌ Ausente |
| Quora | ❌ Ausente |
| LinkedIn | ❌ Ausente |
| TikTok | ❌ Não verificado |

**O que limita:** Ausência em plataformas que IAs treinam e citam. ChatGPT prioriza YouTube, Reddit, Wikipedia para validar expertise. Perplexity cita fóruns e reviews. A marca existe fortemente no Google/Maps mas tem footprint mínimo nas plataformas que alimentam modelos de linguagem.

---

### Conteúdo E-E-A-T — 68/100

**Experiência:** ✅ Conteúdo claramente de especialista, não genérico. Tom de primeira pessoa, casos específicos.  
**Expertise:** ✅ Terminologia técnica correta (porosidade, pH capilar, curvaturas 2A-4C, fator de encolhimento). /metodo tem ~3.000 palavras de nível universitário sobre biologia capilar.  
**Autoridade:** 🟡 272 reviews 4.9⭐ é excelente sinal local. Mas sem presença editorial em terceiros (menções em sites especializados, blogs de moda/beleza, YouTube).  
**Confiabilidade:** 🟡 Bom — email de negócio, endereço verificável, schema NAP consistente. Mas dois schemas com dados conflitantes (CRÍTICO-2) prejudicam.

**Gap principal:** Artigos não citam fontes externas. Uma referência a estudos de pH capilar ou instituição de cosmetologia elevaria muito o score de confiabilidade.

---

### Infraestrutura Técnica GEO — 62/100

| Verificação | Status |
|---|---|
| robots.txt — crawlers IA | ✅ Excelente — GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, anthropic-ai, CCBot, cohere-ai, GoogleOther explicitamente permitidos |
| llms.txt | ✅ Presente e estruturado — mas incompleto (ver ALTO-5) |
| SSR/Prerender | ✅ Blog posts e páginas principais têm HTML completo |
| Homepage body text | ❌ CRÍTICO — zero conteúdo crawlável sem JS |
| meta robots | ✅ `index, follow` em todas as páginas |
| Canonical URLs | ✅ Presente em todas as páginas |
| Sitemap.xml | ✅ 57 URLs, lastmod atualizado |
| HTTPS | ✅ |
| og:type blog | ❌ "website" em vez de "article" |

---

### Schema & Dados Estruturados — 72/100

**Schemas presentes:**
| Schema | Páginas | Qualidade |
|---|---|---|
| HairSalon + LocalBusiness | Todas | ✅ Completo (mas DUPLICADO — ver CRÍTICO-2) |
| Person (founder) | Todas | 🟡 Falta `image`, `url` externo |
| FAQPage | /faq, ~4 blog posts | ✅ 12 perguntas em /faq |
| Article | ~41 blog posts | 🟡 Falta `wordCount`, `og:type` errado |
| Service | 17 páginas de serviço | ✅ Com preço e provider |
| Review (individual) | /depoimentos | ✅ Múltiplos reviews com texto |
| AggregateRating | LocalBusiness schema | ✅ 4.9 / 272 |
| GeoCoordinates | LocalBusiness | ✅ |
| OpeningHoursSpecification | LocalBusiness | ✅ |
| BreadcrumbList | — | ❌ Ausente |
| HowTo | — | ❌ Ausente (/metodo seria ideal) |
| SpeakableSpecification | — | ❌ Ausente |
| VideoObject | — | ❌ Ausente (sem canal YT) |

**Bug encontrado:** CEP `"30720-320"` no Review schema de /depoimentos ≠ `"30770-040"` correto no localBusinessSchema.

---

### Otimização de Plataformas — 42/100

Plataformas onde IAs treinam e citam — e onde o Studio do Jon ainda não tem presença:

- **YouTube:** Zero canal. Demonstrações do Método Leitura de Fio em vídeo seriam altamente citáveis por ChatGPT e Gemini. Maior oportunidade single-channel.
- **Reddit:** Sem posts em r/Cabelos, r/BeloHorizonte, r/CuidadosCabelos. Recomendações orgânicas em fóruns são fontes primárias para Perplexity.
- **Wikipedia:** Sem página. "Leitura de Fio" como metodologia específica poderia ter artigo próprio como técnica de cuidado capilar.
- **LinkedIn:** Sem perfil profissional linkado. Aumenta entity recognition do autor.
- **Quora:** Sem respostas sobre cabelos cacheados em português.

---

## Quick Wins — Implementar Esta Semana

1. **Remover schema duplicado do index.html** (CRÍTICO-2) — 10 min. Remove conflito de dados em todas as 57 páginas de uma vez.

2. **Atualizar llms.txt** (ALTO-5) — 15 min. Adicionar sameAs completo, aggregateRating, email correto, lista de tópicos do blog. Impacto direto em como Claude, ChatGPT e Gemini identificam a marca.

3. **Corrigir CEP 30720-320 → 30770-040 no schema de reviews** (ALTO-1) — 5 min. NAP consistency é critério de confiabilidade.

4. **Adicionar image ao founderPersonSchema** (MÉDIO-1) — 2 min. `"image": "https://www.ojonquecortou.com.br/jon-perfil.webp"` ao objeto `founderPersonSchema` no prerender.js. Rebuild.

5. **Criar noscript content para a homepage** (CRÍTICO-1) — 30 min. Maior impacto individual. Adicionar H1, parágrafo de apresentação, lista de serviços chave, endereço e CTA ao `homeBody` no prerender.js.

---

## Plano de Ação 30 Dias

### Semana 1: Resolver Críticos e Schema

- [ ] Remover schema HairSalon duplicado de `index.html`
- [ ] Criar `homeBody` noscript para a homepage (H1 + intro + serviços + endereço)
- [ ] Corrigir CEP no schema de reviews em `prerender.js`
- [ ] Adicionar `"image"` ao `founderPersonSchema`
- [ ] Atualizar `llms.txt`: sameAs completo, aggregateRating, email correto
- [ ] Rebuild e deploy

### Semana 2: og:type, BreadcrumbList, FAQSchema

- [ ] Corrigir `og:type` para `"article"` em todos os blog posts no prerender.js
- [ ] Adicionar `article:author`, `article:published_time` em blog posts
- [ ] Implementar `BreadcrumbList` schema para blog posts e páginas de serviço
- [ ] Adicionar FAQPage schema aos 10 blog posts mais acessados (usar GSC para identificar)
- [ ] Rebuild e deploy

### Semana 3: /metodo HowTo + Article Schema Quality

- [ ] Converter schema de `/metodo` de `Service` para `Article` + `HowTo` com as 7 etapas
- [ ] Adicionar `wordCount` estimado aos schemas de Article em blog posts
- [ ] Adicionar `"speakable"` às seções principais do FAQ e /metodo
- [ ] Adicionar 3-5 FAQs nos posts que respondem perguntas mas não têm schema
- [ ] Rebuild e deploy

### Semana 4: Presença em Plataformas

- [ ] **LinkedIn**: Criar perfil profissional para Jonatan Junior com link para o site
- [ ] **YouTube**: Criar canal e publicar 1 vídeo demonstrando Leitura de Fio (pode ser reaproveitamento de Reels)
- [ ] **Reddit**: Criar conta e responder 5-10 perguntas em r/Cabelos, r/BeloHorizonte com expertise genuína (sem spam)
- [ ] **Quora**: Responder 5 perguntas sobre cuidados com cabelos cacheados em português
- [ ] Atualizar `llms.txt` com novos perfis de plataformas
- [ ] Solicitar recrawl de sitemap no Google Search Console

---

## Impacto Esperado

Após implementação completa das correções:

| Categoria | Score Atual | Score Estimado |
|---|---|---|
| AI Citabilidade | 65 | 78 |
| Autoridade de Marca | 52 | 62 |
| Conteúdo E-E-A-T | 68 | 74 |
| Infraestrutura Técnica GEO | 62 | 80 |
| Schema & Dados Estruturados | 72 | 84 |
| Otimização de Plataformas | 42 | 55 |
| **GEO Score Geral** | **61** | **74** |

A maior oportunidade isolada é a homepage sem corpo de texto — corrigir isso provavelmente move o score técnico de 62 para 80+ sozinho.

---

## Apêndice: Páginas Analisadas

| URL | Schema Principal | Issues |
|---|---|---|
| / (homepage) | HairSalon + Person | CRÍTICO: zero body text; schema duplicado |
| /sobre | Person | Sem image no schema; noscript sem bio de Jon |
| /servicos | HairSalon + ItemList | Schema duplicado |
| /faq | FAQPage (12 perguntas) | ✅ Bem implementado |
| /metodo | Service | Deveria ser Article + HowTo |
| /investimento | HairSalon | Schema duplicado |
| /depoimentos | HairSalon + Review | CEP errado nos reviews |
| /blog | — | Sem schema de categoria |
| /servicos/leitura-de-fio | Service | ✅ Bem implementado |
| /blog/acidificacao-capilar-cachos-porosidade | Article | Sem FAQPage schema |
| /blog/leitura-de-fio-metodo-exclusivo-studio-do-jon | Article + FAQPage | ✅ Melhor post do site |
| /blog/ph-capilar-cachos-brilho-definicao | Article | Sem FAQPage; og:type errado |
| /dist/depoimentos | HairSalon + Review | CEP 30720-320 errado |
