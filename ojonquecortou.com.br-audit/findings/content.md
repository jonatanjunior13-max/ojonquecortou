# Content Quality / E-E-A-T Audit — www.ojonquecortou.com.br

Audit date: 2026-07-03
Method: Sitemap pull (46 URLs) + raw HTML fetch of 8 core pages, all 19 /servicos/* subpages, and 17 blog posts sampled across the full date range (2026-03-30 to 2026-07-01), plus targeted checks (JSON-LD parsing, paragraph-level dedup scan, internal link counting).

## Category Score: 84 / 100

Content quality is a genuine strength of this site. Prices are specific, the founder's method has real specificity, JSON-LD includes `speakable` markup and FAQPage Q&As, and the previously-flagged cannibalization/CTR fixes are confirmed holding. The main gaps are: several thin, template-shaped /servicos subpages under 700 words; zero internal links from blog posts to the glossary despite heavy jargon use; six-plus blog posts frozen at `dateModified = datePublished` for 3+ months with no visible refresh signal; and inconsistent author-byline depth (name appears, but no persistent author bio/credentials block reused across posts).

---

## What Works

- **Real founder specificity, not generic AI fluff.** `/sobre` tells a concrete origin story for the "Leitura de Fio" method (repeated pattern of bad diagnosis → 7-step protocol born from practice, not "a course or copied formula" — explicitly disclaims generic AI-style credentialing language). Names all curl types serviced (2A–4C) and explains why cross-curvature technique matters. This is exactly the kind of first-hand-experience signal Sept 2025 QRG rewards.
- **Specific, quotable, AI-citable facts throughout.** Real prices in R$ (e.g., "Leitura de Fio: R$ 80", "Infusão de Carga Hídrica: Fixo R$ 150 · Duração: 45 minutos", full price ladder on `/servicos`: R$80/R$320/R$230/R$90/R$190/R$699/R$130/R$499), a named address ("Rua Francisco Ovídio, 184 · Caiçaras · Belo Horizonte, MG"), phone number, and technical claims with numbers (corte híbrido lasts "3-4 meses", retoque de raiz "a cada 4-6 semanas"). This is well above the marketing-fluff baseline most local-service sites have.
- **FAQPage schema with `speakable` markup is implemented correctly.** `/faq`'s JSON-LD `@graph` includes both a `WebPage` node and a full `FAQPage` node with `mainEntity` Q&As and `SpeakableSpecification` targeting `h1`/`dt`/`dd`. This is a genuine AI-citation/voice-assistant readiness win that most competitor salon sites will not have.
- **No duplicate-content problem across /servicos subpages.** Paragraph-level dedup scan across all 19 service pages found only one shared text block (`"Agende seu horário · Ver todos os serviços"` — an expected CTA snippet, not descriptive content). Each service page's actual body copy is distinct.
- **Cannibalization fix and title rewrites confirmed holding.** `/blog/rotina-basica-cabelo-cacheado-cronograma` 301s cleanly into `/blog/cronograma-capilar-cabelo-cacheado` (verified via `curl -L`, returns 200, identical title/H1/meta/word-count to the target — content genuinely merged, not just redirected). Spot-checked titles render as expected: `/blog/wolf-cut-cabelos-cacheados-tendencia` → "Corte Lobo (Wolf Cut) em Cabelo Cacheado BH — Técnica & Agendamento", `/servicos` → "Serviços para Cabelo Cacheado em BH", `/sobre` → "Sobre o Jon | Especialista em Cachos em BH". No other blog pairs in the sampled set show near-identical intent without differentiation.
- **Glossary is a real asset (56 terms), and blog jargon density is high** — meaning it has real utility, it's simply not being linked to (see findings below).

---

## Findings

### 1. Six /servicos subpages are thin, template-shaped content (400-700 words)
**Severity:** Medium
**Evidence:** Word counts from body-text extraction (script/style stripped): `infusao-carga-hidrica-porosos` 691w, `inside-trp` 648w, `lavar-finalizar` 666w, `pacote-cachos-perfeitos` 671w, `protocolo-blindagem-ph-reconstrucao` 685w, `retoque-raiz` 661w, `ritual-reposicao-lipidica-nutricao` 694w. These are the same 7 pages that share the one duplicate CTA block, and they follow an identical shape: one ~150-250-word intro paragraph, a price/duration line, and the CTA. By contrast, sibling pages like `corte-jon` (2,925w), `luzes-morena-iluminada` (2,924w), and `leitura-de-fio` (2,913w) are comprehensive. All are technically above Google's often-cited (but non-binding) ~300w product-page floor, but they read as the "thin AI-templated subpage" pattern QRG raters are trained to flag — one dense paragraph rather than genuine topical coverage (no FAQ, no "quem deve escolher isso", no before/after specificity, no technique detail).
**Recommendation:** Bring these 7 pages toward the depth of `corte-jon`/`leitura-de-fio`: add a "para quem é indicado" section, a short technique/process breakdown (even 3-4 steps), and 1-2 real client specifics or FAQ-style objections. Target 1,200-1,500 words each, prioritizing the treatments most likely to be a first landing page from search (inside-trp, protocolo-blindagem-ph-reconstrucao — these read like premium/high-ticket services and deserve the strongest content).

### 2. Zero internal links from blog posts to /glossario despite heavy jargon use
**Severity:** Medium
**Evidence:** Checked internal link counts on 3 representative posts: `frizz-em-cabelo-cacheado.html` (0 glossario links, 46 other-blog links), `curvatura-4c-cabelo-crespo-guia-completo.html` (0 glossario links, 48 other-blog links), `cronograma-capilar-cabelo-cacheado.html` (0 glossario links, 58 other-blog links). These posts use technical terms extensively (porosidade, fator de encolhimento, curvatura, cronograma capilar) that are exactly the 56 terms indexed in `/glossario`, yet none link there. Meanwhile blog-to-blog cross-linking is heavy (46-58 links per post) and blog-to-service linking is present but thin (1-6 links per post).
**Recommendation:** Add contextual first-mention links from blog posts to matching `/glossario#termo` anchors. This serves two purposes: (a) readability/scannability for pt-BR readers unfamiliar with jargon — currently a reader hits "fator de encolhimento" with no gloss in-page — and (b) it activates the glossary as a genuine topical-authority hub rather than an orphaned reference page, reinforcing the site's technical-expertise signal for E-E-A-T.

### 3. Multiple blog posts frozen at dateModified = datePublished for 3+ months, no refresh signal
**Severity:** Low-Medium
**Evidence:** Sitemap `lastmod` for several posts is 2026-03-30 or 2026-04-0x-04-1x (12+ posts dated 2026-04-13/04-14 alone). Spot-checked JSON-LD on two of the oldest: `alforria-do-cacho-liberdade-2026` and `transicao-capilar-bh-corte-seco` both show `datePublished: 2026-03-30` and `dateModified: 2026-03-30` — identical, meaning no edit/refresh has ever been recorded, and today is 2026-07-03 (13+ weeks later). No visible "Atualizado em" UI signal distinct from "Publicado em" was found in the sampled HTML.
**Recommendation:** For posts older than ~90 days that remain evergreen (product/technique guides), do a light content refresh (even a paragraph addition or price/fact verification) and bump `dateModified` + add a visible "Atualizado em [date]" line distinct from "Publicado em". This is a freshness signal both for classic ranking and for AI-answer engines that weight recency in citation selection. Not urgent for all 12+ April posts at once — prioritize the highest-traffic ones per analytics.

### 4. Author attribution is present but shallow — no persistent author-bio block on posts
**Severity:** Low
**Evidence:** All sampled blog posts show `"Publicado em: [date]"` as a visible byline and `author` fields inside JSON-LD, but no visible in-article author bio/credential block (e.g., "Jonatan Junior, criador do Método Leitura de Fio, +10 anos de experiência") was found repeated on post pages the way it appears once on `/sobre`. E-E-A-T guidance rewards author expertise signals being visible at the point of content consumption, not just on a separate about page.
**Recommendation:** Add a compact author byline component to blog post templates (name, one-line credential, avatar, link to /sobre) — this is a common, low-effort implementation and directly strengthens the Expertise and Trustworthiness factors on the pages Google/LLMs are most likely to crawl for topical answers.

### 5. Readability — generally strong, with occasional dense paragraphs
**Severity:** Info/Low
**Evidence:** Most sampled body copy uses short-to-medium paragraphs (2-4 sentences) with clear H2 structure and bullet lists (e.g., `/sobre`'s "Método & Técnica" 3-item list, `/faq`'s dt/dl structure). One notable outlier: `servicos_infusao-carga-hidrica-porosos.html`'s single intro paragraph runs 205 words with no internal break — dense for a service page meant for quick scanning on mobile.
**Recommendation:** Minor — break any single paragraph over ~120 words into two, especially on the thin service pages flagged in Finding 1 (this pairs naturally with the depth expansion recommended there).

### 6. AI citation readiness — strong foundation, one gap
**Severity:** Info
**Evidence:** FAQPage + speakable schema on `/faq` is correctly implemented (verified via direct JSON-LD parse, confirmed `mainEntity` Q&A array present). HairSalon/LocalBusiness schema present sitewide (1 block per page checked). Specific, extractable facts (prices, durations, address, technique step-counts) are abundant — good LLM-citation bait. Gap: `/metodo` (the page most likely to be cited for "what is Leitura de Fio") has zero price mentions and no structured step-by-step schema (e.g., HowTo) despite describing a 7-step process in prose — this is a missed opportunity to make the 7 steps individually extractable/citable.
**Recommendation:** Consider adding `HowTo` or at minimum a numbered `<ol>` with named steps on `/metodo` for the 7-step Leitura de Fio process, so AI answer engines can extract and cite the exact sequence rather than paraphrasing prose.

### 7. E-E-A-T breakdown (weighted per skill rubric)

| Factor | Weight | Score | Notes |
|---|---|---|---|
| Experience | 20% | 85/100 | Strong first-hand origin story on /sobre; blog posts reference real technique/practice detail but lack in-article author-experience callouts (Finding 4). |
| Expertise | 25% | 82/100 | Deep technical vocabulary (curvature types 2A-4C, porosity, pH), 56-term glossary, named credentialed founder; undercut slightly by thin service pages (Finding 1) that don't demonstrate expertise as fully as flagship pages. |
| Authoritativeness | 25% | 75/100 | Single-location, single-practitioner site — authority is self-asserted (bio, method name) rather than third-party validated in the sampled pages (external citations/press mentions not found in body copy; testimonials page exists but wasn't the focus of this pass — defer to any dedicated backlinks/reviews audit). |
| Trustworthiness | 30% | 88/100 | Real address, phone, specific pricing, transparent "sem custo extra" disclosures, consistent NAP. Strong. |

**Weighted E-E-A-T score: ~82/100**

---

## Notes on Scope / Delegation

- Programmatically-generated-page patterns across the 19 /servicos/* subpages were checked for near-duplicate risk per the `seo-programmatic` cross-skill note — none found beyond the single shared CTA snippet (see "What Works"). If a dedicated programmatic-SEO audit runs separately, it should still verify template variance on the 7 thin pages flagged in Finding 1, since their uniform shape (even without literal text duplication) is the pattern that skill specializes in catching.
- Comparison-style pages (e.g., `cacho-vs-crespo-qual-diferenca`) were sampled for content depth only; full comparison-page standards review is deferred to `seo-competitor-pages`.
