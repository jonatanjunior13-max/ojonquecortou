# GEO / AI Search Readiness Audit — ojonquecortou.com.br
Date: 2026-07-03

## Scope
Deep-dive on llms.txt depth, passage-level citability, brand entity signals, content
structure for AI parsing, freshness/authority signals, and platform-specific gaps.
Builds on already-verified robots.txt (all major AI crawlers allowed) and llms.txt
presence (200 OK).

Pages sampled: `/` (home), `/metodo`, `/faq`, `/sobre`, `/glossario`, `/investimento`,
`/blog/curvatura-4c-cabelo-crespo-guia-completo`, `/llms.txt`, `/robots.txt`,
`/license.xml`, `/sitemap.xml`.

---

## GEO Health Score: 78/100

| Dimension | Weight | Score | Notes |
|---|---|---|---|
| Citability | 25% | 82 | Dense, fact-specific prose with numbers; hurt by cross-page price/stat drift |
| Structural Readability | 20% | 88 | H2/Q&A/dl structures, FAQPage + speakable schema, breadcrumbs |
| Multi-Modal Content | 15% | 45 | No YouTube, no video, no Reddit/LinkedIn presence found |
| Authority & Brand Signals | 20% | 75 | Strong local entity graph, but no Wikidata sameAs, weak off-site 3rd-party corroboration |
| Technical Accessibility | 20% | 92 | Excellent noscript/SSR fallback, RSL 1.0 license, JSON-LD @graph, hidden nav crawl paths |

---

## 1. llms.txt depth evaluation

Re-fetched `/llms.txt` directly (200 OK, plain text, well-formed markdown).

**What it covers well:** business summary, differentiator (Método Leitura de Fio,
7 steps named), 6 services with exact prices, key routes (including `/glossario` and
`/blog`), NAP, star rating (4.9/5, 272 reviews), Instagram handle.

**Gaps found:**
- **Does not surface blog content categories or top articles.** It links to `/blog`
  generically but lists zero of the ~49 published posts or their topic clusters
  (Diagnóstico & Porosidade, Curvaturas 2A-4C, Transição Capilar, Corte Técnico,
  Química & Danos — these clusters *do* exist, visible in the `/metodo` "Artigos
  Relacionados" sitemap-like block, but aren't surfaced in llms.txt). An LLM using
  llms.txt as a summary won't know the depth of the blog corpus exists.
- **No FAQ highlights.** `/faq` has 20+ Q&A pairs with FAQPage schema — llms.txt
  doesn't sample even 2-3 of the highest-value ones (pricing, hours, method
  definition) as quick-reference text.
- **No glossário sample.** Glossário has 60 defined terms (llms.txt says "56 termos"
  — **stale count**, off by 4).
- **Stale price:** llms.txt states "Combo Corte + Tratamento — R$ 320". This
  conflicts with both the FAQ page (R$ 230, in both visible text and FAQPage
  JSON-LD) and `/investimento` (which frames it as "R$ 190 a R$ 230" for corte
  especializado, no R$ 320 anywhere). See Finding 1 below — this is a live,
  three-way source-of-truth conflict, not just an llms.txt issue.
- No `license`/RSL reference inside llms.txt itself (RSL is correctly declared via
  robots.txt `License:` directive and `<link rel="license">`, so this is a minor
  omission, not a gap).

---

## 2. Passage-level citability (4 pages sampled)

**`/metodo` — excellent.** Dense clinical-register prose in noscript/SSR body:
specific mechanism claims ("o encolhimento pode variar de 10% em cabelos ondulados
até mais de 75% em cabelos crespos tipo 4C"), clear definitional blocks for
porosidade (baixa/média/alta) and elasticidade, each as a self-contained
2-4 sentence unit landing close to the 134-167 word optimal citation range per H2
section. This is the strongest page on the site for AI extraction.

**`/faq` — excellent structure, good citability.** 20+ Q&A pairs, each answer
50-80 words, factual and self-contained (e.g., exact hours "segunda a sábado, das
9h às 19h", exact address, exact prices). FAQPage schema + `speakable` markup
(cssSelector targeting h1/dt/dd) is a strong signal specifically for voice/AI
assistants. Weakness: internal price inconsistency undermines trust in the answer
block (see Finding 1).

**Blog post (`curvatura-4c-cabelo-crespo-guia-completo`) — strong.** Article schema
with `author` linked via `@id` to the Person entity, `publisher`, `wordCount: 1518`,
`speakable`, embedded FAQPage (5 Q&As specific to 4C hair), BreadcrumbList. Content
includes a specific, quotable stat: "o encolhimento em cabelos 4C pode chegar a 75%
do comprimento real" — consistent with `/metodo`'s claim. Minor inconsistency: the
glossário's own "Fator de encolhimento" entry says curly/coily hair shrinks "30% a
70%", not matching the 75% figures used elsewhere (see Finding 2).

**Homepage — good but more marketing-toned.** The visible React-rendered homepage
(behind JS) leans more promotional; the noscript fallback is the more citable
version and is well-built (H1/H2 structure, direct answer content, specific
address/phone/price data in first 300 words). Since AI crawlers that don't execute
JS depend on this noscript block (or on `extracted_text`-style boilerplate
stripping if they do render), the noscript quality matters more than usual here —
and it's good.

---

## 3. Brand entity signals

**Internal consistency: strong.**
- Consistent naming: "Studio do Jon" (LocalBusiness), "Jonatan Junior" (Person,
  `@id="#person"`), cross-linked via `worksFor`/`founder` in a proper JSON-LD
  `@graph` (LocalBusiness + Person + WebSite all interlinked by `@id`). This is a
  textbook entity-disambiguation setup for AI systems that parse schema.
- `sameAs` on LocalBusiness: Instagram, Google Maps (with cid), Facebook.
- `sameAs` on Person: Instagram, Facebook, **Linktree**, Google Maps.
- Minor author-name inconsistency: blog post's `pre-rendered-post-data.author`
  field is `"Jon"` while the Person schema and meta tags use `"Jonatan Junior"` —
  small, but AI systems building an author profile could see these as two entities
  without the `@id` link (which does correctly point to the same Person node, so
  this is low risk, not a Critical issue).

**External/off-site corroboration: weak.**
- **No Wikidata `sameAs` anywhere**, despite a Wikidata item (Q140387726) for
  "O Jon que Cortou" already existing as of 2026-06-30. Zero references to
  "wikidata" found in JSON-LD or body text across all sampled pages. This is a
  quick, high-value fix — adding `"https://www.wikidata.org/wiki/Q140387726"` to
  the `sameAs` array on both LocalBusiness and Person nodes costs minutes and
  directly strengthens entity disambiguation for Google (which weights Wikidata
  heavily for Knowledge Graph / AI Overviews) and any LLM doing entity grounding.
- **Zero YouTube, Reddit, LinkedIn, or TikTok mentions/links** anywhere in the
  sampled pages or schema. Given YouTube mention correlation with AI citation is
  cited at ~0.737 (strongest known signal) and Reddit is "high," this is the
  single biggest brand-signal gap on the site.
- No press/media mentions, no third-party "as featured in" signals, no external
  citations pointing back into the site's own content anywhere in the crawled HTML.

---

## 4. Content structure for AI parsing

Strong across the board:
- Consistent H1 → H2 → H3 hierarchy in noscript bodies on every page checked.
- `/faq` and blog posts use real FAQPage schema (not just visual accordions), with
  `speakable` SpeakableSpecification pointing at the right CSS selectors — a
  concrete assist for AI/voice answer extraction.
- `/glossario` uses a proper `<dl>/<dt>/<dd>` definition-list structure, 60 terms,
  each with a 2-3 sentence definition and a "used in" backlink hint tying the term
  to source articles — good for AI systems building topical authority maps.
- BreadcrumbList on blog posts aids hierarchical understanding.
- A hidden (visually-clipped but DOM-present) `<nav>` block repeats ~49 blog post
  links on every page — functions as an internal sitemap for crawlers that don't
  execute JS, which is a deliberate and effective SSR-crawlability pattern.

---

## 5. Freshness / authority signals

- `datePublished`/`dateModified` present on Article schema for blog posts (sampled
  post: both `2026-07-01` — no evidence yet of post-publish updates being tracked
  distinctly from publish date, so "freshness" signal is real only at publish
  time).
- **Sitemap `lastmod` is not trustworthy** — confirms prior finding (GSC audit
  2026-07 memory note): every URL sampled in `/sitemap.xml` shows `lastmod
  2026-07-03` (today), including pages like `/depoimentos` that are unlikely to
  have actually changed today. This weakens freshness signal quality for engines
  that trust sitemap lastmod (AI Overviews/Google do to some extent); low
  incremental cost to fix since it likely means lastmod is hardcoded to build
  date rather than content change date.
- Author bio (`/sobre`) has real depth (decade+ of experience narrative, method
  origin story) but no precise founding year, awards, certifications, or
  press citations — authority is asserted, not third-party corroborated.
- `aggregateRating` (4.9/5, 272 reviews) is present in schema and consistent
  between llms.txt and homepage JSON-LD — good consistency, but it's a
  self-reported number in schema; no visible link to the underlying Google
  Business Profile review page from the review count itself beyond the general
  Maps `sameAs`.

---

## 6. Platform-specific gaps

- **Google AI Overviews:** Best-positioned dimension. Rich LocalBusiness/HairSalon
  schema, GeoCoordinates, opening hours, and (once organic rankings support it)
  the entity graph gives Google strong grounding. Missing Wikidata `sameAs` is the
  most direct, lowest-effort improvement for AIO/Knowledge Panel corroboration.
  Sitemap lastmod inaccuracy is a secondary drag.
- **ChatGPT (web search / SearchGPT):** Benefits most from llms.txt and RSL 1.0
  (`ai-index`/`ai-include` permitted, `ai-train` prohibited — correctly signals
  "you may cite/include me, don't train on me," which is the ideal RSL posture
  for a business that wants citation traffic without giving away training data).
  Gap: llms.txt's shallow blog/FAQ coverage means ChatGPT's first-pass summary of
  the site under-represents the ~49-post blog depth.
  The price discrepancy (R$230 vs R$320) is a direct citation-accuracy risk here.
- **Perplexity:** Favors well-cited pages with clear sourcing. This site cites no
  external sources/studies anywhere sampled (all claims are asserted from
  in-house expertise, not linked to dermatology/trichology references). Adding
  even a few citations to external authoritative sources on hair science claims
  (e.g., keratin composition, follicle biology) in `/metodo` or glossário entries
  would likely help Perplexity's citation confidence.
- **Bing Copilot / Bing Chat:** GoogleOther is allowed but no explicit `Bingbot`
  or `BingPreview` rule in robots.txt (falls under wildcard `Allow: /`, so not
  blocked, just not explicitly enumerated — low risk since default allows it).

---

## Findings (severity-ranked)

### Finding 1 — Pricing conflict across three sources (High)
`/faq` (visible text + FAQPage JSON-LD) and `/investimento` say "Combo Corte +
Tratamento" costs R$ 190–230, while the homepage noscript/JSON-LD and `/llms.txt`
say R$ 320. An AI system citing this business risks quoting the wrong price,
directly undermining user trust and creating support friction ("you told me
R$320 but the site/AI says R$230"). **Fix:** identify the correct current price
and update all four sources in one pass; this is a data-consistency bug, not a
GEO-strategy issue, but it actively harms AI citation accuracy today.

### Finding 2 — No Wikidata sameAs despite existing Wikidata item (Medium)
Wikidata item Q140387726 for "O Jon que Cortou" exists (confirmed by task brief,
independently corroborated by zero on-site references to it) but is not linked
from LocalBusiness or Person `sameAs` arrays anywhere sampled. **Fix:** add
`https://www.wikidata.org/wiki/Q140387726` to both `sameAs` arrays in
`prerender.js`'s `localBusinessSchema` (per existing memory note: edit prerender.js,
not index.html, and remember the home page has two near-duplicate JSON-LD blocks
that both need the update).

### Finding 3 — Zero YouTube/Reddit/LinkedIn presence (Medium)
No mentions or links to YouTube, Reddit, or LinkedIn found across all sampled
pages/schema. YouTube mention correlation with AI citation is the strongest known
signal (~0.737); Reddit is also high-correlation. **Fix:** not a quick schema fix
— requires an actual off-site content play (e.g., publish technique/demo videos
to YouTube and embed/link back; encourage organic Reddit discussion in r/brasil
curly-hair-adjacent communities). Flag as strategic, not tactical.

### Finding 4 — llms.txt under-represents blog/FAQ/glossário depth (Medium)
llms.txt lists routes but not content samples. A ~49-post blog, 20+ FAQ pairs, and
60-term glossary exist but aren't represented by even a curated top-10 list or
sample Q&A in llms.txt. **Fix:** add a "Principais Artigos" section (8-10 highest-
value post titles+URLs) and 3-5 sample FAQ Q&As directly in llms.txt text.

### Finding 5 — llms.txt glossary count stale (Low)
llms.txt says "Glossário Técnico (56 termos)"; actual page has 60 `<dt>` terms.
**Fix:** either automate this count at build time (same prerender.js pipeline
already generates schema) or update manually on next content pass.

### Finding 6 — Sitemap lastmod not trustworthy (Low, already tracked)
Confirms prior GSC audit finding — every sitemap URL shows today's date
regardless of actual last edit. Weakens freshness-signal reliability for AI
Overviews/Google. Cross-reference: GSC audit 2026-07 memory note.

### Finding 7 — Minor shrinkage-stat drift in glossário (Low)
Glossário's "Fator de encolhimento" entry states curly/coily shrinkage of
"30% a 70%"; `/metodo` and the 4C blog post both use "até 75%" / "pode chegar a
75%". Not contradictory (ranges overlap) but not perfectly aligned either — an
AI citing the glossary definition vs. the blog post could surface slightly
different numbers for the same brand claim. **Fix:** standardize the range
across glossário, `/metodo`, and all blog posts referencing shrinkage %.

### Finding 8 — No external/authoritative source citations (Low)
No claims in `/metodo`, glossário, or blog content link to outside authoritative
sources (dermatology, trichology, cosmetic science). This is specifically a
Perplexity-visibility gap, since Perplexity weights well-sourced pages more
heavily than the other platforms. **Fix:** add 2-3 external citations to
scientific/authoritative sources in the highest-traffic pages (`/metodo`,
top blog posts).
