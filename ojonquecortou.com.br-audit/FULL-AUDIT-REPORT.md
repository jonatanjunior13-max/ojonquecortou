# Full SEO Audit — www.ojonquecortou.com.br

## Changelog — 2026-07-03, same-day fix pass

After this audit was produced, a fix pass was applied directly to the codebase (`C:\Users\jonat\.gemini\antigravity\scratch\ojonquecortou\`, the live repo). Verified against a clean `npm run build`.

**Corrected as false positives** (the audit was wrong, not the site):
- **IndexNow key file "still 404"** — the audit checked the generic `/indexnow.txt` and `/.well-known/indexnow.txt` paths. IndexNow doesn't use a fixed filename; it uses `/{key}.txt`. The real key file at `/2778862fb97f435e968549a6ef8f4f05.txt` was already live and returning 200 the whole time. No fix needed.
- **Pricing "inconsistency"** — partially a false alarm. `seedServices.js` has explicit `price` (R$320, regular) and `promoPrice` (R$230, active promo) fields for "Combo Corte + Tratamento"; the service detail page and its schema correctly show the active promo price. The real bug was narrower: the homepage noscript body and `llms.txt` still hardcoded the old R$320. Fixed below. The R$190–230 range for "Corte especializado" on `/faq` and `/investimento` was left untouched — it's consistent between both pages and may reflect a real complexity-based range; not proven wrong, not touched.

**Fixed:**
- Removed the duplicate static LocalBusiness JSON-LD block from `index.html` (root cause of the `@id` duplication and `priceRange` conflict). Verified: homepage now emits exactly one `application/ld+json` block.
- **Found and fixed a second, deeper bug while verifying the above**: the schema-injection code in `prerender.js` passed dynamic content as the *replacement string* to `String.replace()`. A literal `"$$"` in that content (i.e., `priceRange: "$$"`) is a special JS escape sequence that collapses to a single `"$"` — so the correct `"$$"` value was being silently corrupted to `"$"` on every build, site-wide. This is what the schema/local/GEO agents were actually seeing as a "conflict" between the two schema blocks (the static block, untouched by this code path, showed the correct `"$$"`; the dynamic block showed the corrupted `"$"`). Fixed by switching all seven `html.replace(anchor, dynamicString)` call sites in `prerender.js` to function-form replacements (immune to `$`-pattern interpretation). Verified on a clean rebuild: `priceRange` now correctly reads `"$$"` everywhere.
- `og:image` and JSON-LD `logo`/`image` repointed from the 404ing `/capa-studio.jpg`/`/logo.png` to the working `/jon-perfil.webp` and `/logo-app.png`.
- `Service.provider` and all `Review.itemReviewed` now use `{"@id": "#localbusiness"}` references instead of inline duplicate copies.
- Opening-hours schema fixed to match the real visible hours (Tuesday–Friday 9h–19h, Saturday 9h–17h) instead of the incorrect Monday–Saturday 9h–19h.
- Dead `linktr.ee` link removed from `sameAs`; Wikidata (`Q140387726`) added to `sameAs` on the LocalBusiness node.
- Homepage noscript body and `llms.txt` updated: "Combo Corte + Tratamento — R$ 230 (promocional, de R$ 320)" instead of the stale flat R$320.
- `llms.txt` glossary count corrected (56 → 60 terms, matching the real glossary data) and a Wikidata link added.
- CSP `media-src` directive added, unblocking the `/galeria` video (was hard-blocked with no directive at all).
- Cache-Control set to `max-age=31536000, immutable` for `/assets/*` (was 4 hours).
- `X-Robots-Tag: noindex, nofollow` added for `/admin` and `/cliente` routes.
- WhatsApp floating button now hides on `/agendar` (was overlapping the primary booking CTA on mobile).

**Still open** (deferred — see note at the end of this changelog):
- Homepage LCP (8.4s) / TBT (2,820ms) — needs real prerendering of hero markup + third-party script consolidation, not a config fix.
- `/galeria` still ships zero `<img>` tags server-side (CSP fix unblocks the video, but the structural client-only-fetch issue remains).
- `/admin`/`/cliente` still serve full homepage-identical body content (only the indexability header was fixed, not the underlying shared-shell architecture).
- Soft-404 body/canonical mismatch — needs a dedicated 404 template.
- WhatsApp bubble still overlaps the sticky CTA bar on blog post mobile footers (only the `/agendar` case was fixed).
- All Phase 3 content work (pillar pages, thin-page expansion, press page, stale-post refresh, `llms.txt` deepening) — not attempted, this is substantial content authoring, not a mechanical fix.
- Near-duplicate blog post pairs flagged for manual review (`corte-a-seco...` vs `corte-para...`, the two "day after" posts) — not merged, needs a human call on which to keep.
- Bare-domain redirect hop collapse, pinch-zoom, font-family mismatch, self-hosting fonts, deduping GA4 tags — low-priority polish, not attempted.

---

**Audit date:** 2026-07-03
**Business type:** Local Service — Hair Salon (brick-and-mortar, single location), curly/wavy/coily hair specialist (types 2A–4C), Belo Horizonte (Caiçaras), Brazil
**Scope:** Full site crawl (78 URLs via sitemap — homepage, 10 core pages, 20 service pages, 47 blog posts), 11 specialist passes (technical, content, schema, sitemap, performance, visual/mobile, GEO/AI search, local SEO, search experience, content clustering, backlinks)

## Overall SEO Health Score: 70 / 100

Computed as a weighted average across the 7 core categories (Technical 22%, Content 23%, On-Page 20%, Schema 10%, Performance 10%, AI Search Readiness 10%, Images 5%). Four supplementary specialist categories — Sitemap, Local SEO, Search Experience (SXO), and Content Architecture — are scored separately below since they fall outside that standard weighting but were run because this is a local-service business with a content-driven blog. Backlinks could not be scored numerically; see that section.

| Category | Score | Weight |
|---|---|---|
| Technical SEO | 76/100 | 22% |
| Content Quality | 84/100 | 23% |
| On-Page SEO | 72/100 | 20% |
| Schema / Structured Data | 58/100 | 10% |
| Performance (Core Web Vitals) | 32/100 | 10% |
| AI Search Readiness (GEO) | 78/100 | 10% |
| Images | 50/100 | 5% |
| **Supplementary — Sitemap** | 92/100 | — |
| **Supplementary — Local SEO** | 78/100 | — |
| **Supplementary — Search Experience (SXO)** | 58/100 | — |
| **Supplementary — Content Architecture** | 52/100 | — |
| **Supplementary — Visual / Mobile** | 76/100 | — |
| **Supplementary — Backlinks** | n/a (insufficient data) | — |

## Executive Summary

This site's foundation is genuinely strong: real, differentiated content (the "Leitura de Fio" method has no equivalent among competitors), clean crawlability, a healthy 47-post blog, and prior fixes (sitemap dates, redirects, title rewrites, cannibalization) are all confirmed holding. The score is dragged down by a small number of **fixable, high-leverage bugs** — most of them one file or one CSS rule away from resolved — plus one genuinely hard problem (Core Web Vitals) that needs real engineering time.

### Top 5 Critical Issues

1. **Pricing inconsistency, confirmed independently by four different specialist passes.** "Combo Corte + Tratamento" shows R$230 on /faq, R$190–230 on /investimento, and R$320 on the homepage JSON-LD and llms.txt. /investimento's own title, body, and schema disagree with each other too. Any AI system or customer comparing pages will see conflicting numbers.
2. **A live schema regression.** A recent commit added a static LocalBusiness JSON-LD block to `index.html`, duplicating the block `prerender.js` already injects on every route. On `/` and `/depoimentos` this creates two objects sharing the same `@id` — invalid, and the direct cause of the priceRange conflict and several other downstream schema issues.
3. **Every social share preview on the site is broken.** `og:image` (`/capa-studio.jpg`) and the JSON-LD `logo` field (`/logo.png`) both 404. Anyone sharing a link on WhatsApp, Facebook, or LinkedIn sees a broken image.
4. **`/galeria` is functionally broken**, not just under-optimized. The CSP has no `media-src` directive, so a gallery video is hard-blocked by the browser itself, and the page ships zero `<img>` tags server-side — everything loads client-side after full JS boot.
5. **Homepage Core Web Vitals fail outright.** LCP measured at 8.4s (threshold: 4.0s "poor"), Total Blocking Time at 2,820ms, driven mostly by duplicate/redundant third-party analytics scripts, not the app's own code.

### Top 5 Quick Wins

1. Repoint `og:image` + JSON-LD `logo`/`image` to the already-working `/jon-perfil.webp` — one template edit, fixes every social share site-wide.
2. Remove the static duplicate JSON-LD block from `index.html` — one file edit, resolves the `@id` duplication and the `priceRange` conflict together.
3. Add `media-src` to the CSP header — one line, unblocks the `/galeria` video immediately.
4. Reposition the WhatsApp bubble on mobile `/agendar` — CSS fix, removes an overlap that's currently sitting on top of the primary booking button.
5. Pick one number for "Combo Corte + Tratamento" and propagate it — a content decision plus four find-and-replace edits, no engineering required.

---

## Technical SEO — 76/100

**What works:** the 2026-07-02 sitemap-lastmod fix is holding (dates genuinely span 2026-03-30 to 2026-07-03); robots.txt correctly allows every major AI crawler while blocking `/admin` and `/cliente`; canonical tags are self-referencing and consistent everywhere sampled; meta robots is `index,follow` correctly on every public page; the site's prerendered noscript content means crawlers don't depend on JS execution; both previously-known redirects (`/sobre-o-jon`, the old cronograma-capilar slug) are clean single-hop 301s.

**Findings:**
- **[High] `/admin` and `/cliente` return HTTP 200 with byte-identical homepage HTML.** Despite the `robots.txt` disallow, there's no real access control at the HTTP level — both routes silently fall back to the exact homepage snapshot (21,341 bytes, confirmed via diff). *Fix: serve a true 401/403 or a distinct noindex shell at the edge/prerender layer.*
- **[Medium] Soft-404 content mismatch.** A deliberately invalid URL correctly returns HTTP 404 (good), but the response body is byte-identical to the homepage, including the canonical tag pointing to `/`. *Fix: a distinct 404 template with noindex and no misleading canonical.*
- **[High] `og:image` and JSON-LD `logo`/`image` 404 site-wide** — see Images section below for full detail.
- **[High] IndexNow key file still missing** (previously flagged, still open): 404 at both `/indexnow.txt` and `/.well-known/indexnow.txt`.
- **[Low] Bare-domain redirect takes 2 hops and uses 307 instead of 301** for the non-www→www hop. *Fix: collapse to a single 301 straight to https+www.*
- **[Low] Pinch-zoom is disabled** via `user-scalable=no, maximum-scale=1.0` in the viewport meta — a WCAG 1.4.4 issue with no ranking upside to keeping it.
- **[Low] Google Fonts load render-blocking with no `font-display: swap` or preload** — a plausible LCP/FOIT contributor.

Full detail: `findings/technical.md`

## Content Quality — 84/100

**What works:** `/sobre` has real founder specificity — a concrete origin story for the Leitura de Fio method, not generic AI-sounding credentialing copy; the site is genuinely rich in AI-citable facts (specific prices, technique durations, exact address); FAQPage schema with `speakable` markup is correctly implemented; there's no duplicate-content problem across the 19 service subpages; every previously-applied fix (cannibalization redirect, CTR title rewrites) is confirmed holding.

**Findings:**
- **[Medium] Six `/servicos` subpages are thin and template-shaped** (648–694 words each — `infusao-carga-hidrica-porosos`, `inside-trp`, `lavar-finalizar`, `pacote-cachos-perfeitos`, `protocolo-blindagem-ph-reconstrucao`, `retoque-raiz`, `ritual-reposicao-lipidica-nutricao`) versus 2,900+ words on flagship pages, all following the same intro+price+CTA shape. *Fix: expand to 1,200–1,500 words with "para quem é indicado," technique detail, and objection-handling — prioritize the highest-ticket services first.*
- **[Medium] Zero internal links from blog posts to `/glossario`** despite heavy technical jargon use. The 56-term glossary is effectively orphaned from the content that would benefit most from linking to it.
- **[Low] 12+ posts frozen at `dateModified = datePublished`** for 3+ months with no visible "updated" signal, despite being 13+ weeks stale.
- **[Low] Author attribution is shallow on blog posts** — a byline exists but no in-article bio/credential block, unlike the rich one on `/sobre`.
- **[Info] The 7-step Leitura de Fio method isn't schema-marked** as HowTo — a missed AI-extraction opportunity.

E-E-A-T breakdown: Experience 85, Expertise 82, Authoritativeness 75 (single-practitioner, self-asserted — no third-party validation found in sampled copy), Trustworthiness 88.

Full detail: `findings/content.md`

## On-Page SEO — 72/100

**What works:** all five previously-flagged CTR title issues are confirmed fixed and rendering correctly; `/investimento` and `/servicos` are the right page *types* for transactional intent, with prices bold and bulleted rather than buried in prose.

**Findings:**
- **[Critical] Pricing inconsistency, the single most-corroborated issue in this audit.** `/investimento`'s own title ("a partir de R$200"), body ("R$190 a R$230"), and schema (`min190/max230`) disagree with each other, and separately "Combo Corte + Tratamento" is quoted at three different prices across `/faq`, `/investimento`, and the homepage/llms.txt. *Fix: pick one true price per service and propagate it identically everywhere.*
- **[High] `/agendar` — the actual conversion page — has almost no crawlable content.** Three short paragraphs, no pricing recap, no trust signal, at the single most important step in the funnel.
- **[High] Blog posts rely on a single end-of-post CTA.** A 1,500+ word sample post had exactly one call-to-action, at the very last line — the cold-landing-to-booking path is thin.
- **[Medium] Individual `/servicos/*` pages don't reinforce "Belo Horizonte" locally themselves**, relying only on the shared site footer.

## Schema / Structured Data — 58/100

**What works:** JSON-LD used exclusively with correct syntax throughout; BreadcrumbList correctly formed; blog Article schema is solid (headline, author via `@id`, dates, `mainEntityOfPage`); `Service` + `Offer` schema with typed price/currency exists on the sampled service page and is ready to scale to all 20; `AggregateRating` (4.9/272) is backed by 7 real, matching Review nodes, not just prose; FAQPage on `/faq` is correctly retained for AI/GEO citation value even after Google retired FAQ rich results.

**Findings:**
- **[Critical] Sitewide duplicate `@id` LocalBusiness node — confirmed live.** A recent commit added a static schema block to `index.html` that now duplicates the block `prerender.js` already injects. On `/` and `/depoimentos`, two objects share the same `@id`. *Fix: remove the static block — prerender already covers every route.*
- **[High] `priceRange` conflict** between the two duplicate blocks (`$$` vs `$`) — resolves automatically once the block above is removed.
- **[High] `Service.provider` and all 7 `Review.itemReviewed` embed full inline copies** of the business entity instead of `{"@id": "#localbusiness"}` references — the Review copies don't even carry an `@id`, making them anonymous duplicates.
- **[Medium] Article `publisher` is a disconnected identity** using a different logo file than the canonical business node.
- **[Medium] `/depoimentos` reviews lack `datePublished`** and aren't structurally tied to the AggregateRating node (downstream of the inline-copy issue).

Full detail: `findings/schema.md`

## Performance (Core Web Vitals) — 32/100

*Method note: no PageSpeed Insights/CrUX API key is configured, so these are lab measurements (Lighthouse mobile/simulated throttle, curl timing, source inspection), not field data.*

**What works:** TTFB is excellent everywhere (40–186ms, Vercel edge + Cloudflare); CLS on the homepage is good (0.024); HTTP/2+H3, compression, and security headers are all correctly configured; JS is already code-split into hashed chunks — a good foundation to build on.

**Findings:**
- **[Critical] LCP fails on the homepage — 8.4s** against a 4.0s "poor" threshold. The site is entirely client-rendered; the LCP element can't paint until JS downloads, parses, and hydrates, and no `fetchpriority`/preload hints exist anywhere.
- **[Critical] Total Blocking Time is 2,820ms** — the main thread is saturated by third-party scripts, not app code: `react-vendor` 733ms, two separate `gtag.js` configs combining for ~1.2s, `gtm.js` 611ms.
- **[High] 504 KiB of unused JavaScript, nearly all third-party.** Facebook Pixel is 94% wasted; there's a duplicate GA4 stream (`G-2HCS01RSP2` alongside `G-BC8WXZKTLL`) 65% wasted; the firebase-vendor bundle is 58% wasted globally.
- **[Critical] `/galeria` is functionally broken**, not just slow — see the Images section.
- **[High] Hashed static assets are cached only 4 hours, not immutable**, despite being safe to cache for a year.
- **[Medium] Render-blocking third-party Google Fonts request** with `display=swap` set but no self-hosting.
- **[Medium] Four independent analytics vendors fire on every page** (GTM, two `gtag.js` configs, two Meta Pixel IDs, Ahrefs) — the largest single contributor to blocking time.

Full detail: `findings/performance.md`

## AI Search Readiness (GEO) — 78/100

**What works:** exceptional SSR/noscript fallback gives AI crawlers dense, fact-specific content on every page without executing JS, plus a hidden nav repeating all ~49 blog links as a crawlable internal sitemap; the JSON-LD entity graph correctly links LocalBusiness + Person + WebSite by `@id`, textbook AI entity disambiguation; RSL 1.0 is correctly declared, permitting AI indexing/inclusion while prohibiting AI training — an ideal posture; `/metodo` is genuinely excellent, clinical-register prose with concrete numbers near the optimal citation-passage length; the 60-term glossário is properly structured with source links per term.

**Findings:**
- **[High] The pricing conflict (see On-Page and Schema sections) risks wrong-price AI citations** — this is the same issue surfacing across four different specialist lenses.
- **[Medium] No Wikidata `sameAs` despite an existing entity** (Q140387726, created 2026-06-30, currently zero on-site references).
- **[Medium] Zero YouTube/Reddit/LinkedIn presence** — YouTube is the strongest known AI-citation correlate among third-party platforms.
- **[Medium] `llms.txt` under-represents content depth** — it lists routes only, without sampling any of the ~49 posts, 20+ FAQ pairs, or glossary terms.
- **[Low] `llms.txt` glossary count is stale** ("56 termos" vs the actual 60).
- **[Low] No external authoritative citations**, which specifically hurts visibility on Perplexity.

Full detail: `findings/geo.md`

## Images — 50/100

**Findings:**
- **[High] `og:image` (`/capa-studio.jpg`) and JSON-LD `logo` (`/logo.png`) both 404, site-wide.** Every social share preview across the site is broken, and Merchant/Knowledge Panel image validation is degraded. Working alternates already exist and are used elsewhere: `/logo-app.png`, `/jon-perfil.webp`.
- **[Critical] `/galeria` has zero `<img>` tags in raw HTML** — all imagery is 100% client-fetched post-JS-boot with no server-rendered fallback, and the accompanying video is entirely CSP-blocked.
- **[Medium, unconfirmed] Possible lazy-load failure on homepage blog card thumbnails** — three thumbnails showed `complete:false / naturalWidth:0` after a 3-second wait despite the underlying URLs returning valid 200 responses. Needs a manual scroll-confirm; likely an intersection-observer timing issue, not missing files.

## Sitemap — 92/100 (supplementary)

Essentially clean. All 78 URLs return 200 with zero coverage gaps against the site's own navigation; `/cliente` and `/admin` are correctly excluded; the lastmod fix from 2026-07-02 is holding — the 40% of URLs sharing today's date are exactly the non-blog template pages (home, core pages, service pages), not a recurrence of the old bug, while the 47 blog posts show 28 genuinely distinct dates. Only informational items remain (`priority`/`changefreq` values that Google ignores; no sitemap index needed at this scale).

Full detail: `findings/sitemap.md`

## Local SEO — 78/100 (supplementary)

**What works:** NAP is byte-for-byte consistent across every page checked; schema uses the correct `HairSalon` + `LocalBusiness` subtype with 6-decimal geo precision; the Google Maps embed is present and correctly configured; "Belo Horizonte"/"Caiçaras"/"BH" appear naturally and repeatedly, not as a token footer mention; click-to-call and click-to-WhatsApp are both present on every page.

**Findings:**
- **[High] Opening-hours schema contradicts the visible on-page text.** The UI correctly shows Tuesday–Friday 9h–19h and Saturday 9h–17h (closed Sunday/Monday), but the JSON-LD declares Monday–Saturday uniformly 9h–19h on every page.
- **[Medium] Testimonials on `/depoimentos` lack dates and per-review schema**, making review recency unverifiable from the page itself.
- **[Medium] No dedicated "salão em Belo Horizonte" pillar page** — a reasonable choice for a single location, but individual service pages could reinforce locality more in their own copy.

Full detail: `findings/local.md`

## Search Experience (SXO) — 58/100 (supplementary)

This measures page-type/journey/structure fit to real searcher intent, distinct from the SEO Health Score above.

**What works:** `/investimento` and `/servicos` are structurally correct for transactional queries; "Faz química?" is explicitly answered and FAQ-schema-marked, a strong citable answer for a key objection; `/metodo` is a genuinely differentiated asset with no equivalent found among competitors across 4 SERP checks.

**Findings:**
- **[Medium] No content asset exists for "best-of"/comparison intent** — "melhor salão cabelo crespo BH" is currently dominated by competitors and listicles that don't mention the site.
- **[Medium] Cluster fragmentation dilutes ranking authority** — see Content Architecture below; the same fragmented clusters that create duplicate-content risk also mean neither asset in a cluster surfaces in real SERPs.
- **[Low] Domain identity inconsistency was observed in search-facing citations** (a bare `.com` variant surfaced alongside the real `.com.br` domain) — worth an NAP/URL consistency pass on directories and GBP.

Full detail: `findings/sxo.md`

## Content Architecture (Clustering) — 52/100 (supplementary)

**What works:** the 47 posts show genuine subtopic differentiation in most clusters; the cronograma-capilar cannibalization fix is a good precedent already proven to work; `/metodo` and `/glossario` already provide real (if unstructured) internal-link density.

**Findings:**
- **[High] `corte-a-seco-cabelo-cacheado-bh-volume` vs `corte-para-cabelo-cacheado-bh-volume`** — near-identical slugs and intent, the highest-priority manual check in this audit; likely the same pattern as the already-fixed cronograma pair.
- **[High] No formal pillar page for 3 of 4 major clusters** — frizz (5 posts), porosidade/pH, and cortes/tendências (9 posts) have no curated hub.
- **[Medium] Near-duplicate "day after" posts, transição capilar cluster fragmentation, and borderline wolf-cut/shag-cacheado overlap** — all detailed in `findings/cluster.md`.

Full detail: `findings/cluster.md`

## Visual / Mobile — 76/100 (supplementary)

8 above-the-fold + 8 full-page screenshots captured across 4 pages × 2 viewports, saved to `screenshots/`.

**What works:** mobile homepage nails the above-the-fold with name, location, value prop, and CTA all visible without scrolling; dark theme has strong consistent contrast; no horizontal scroll/overflow anywhere tested.

**Findings:**
- **[High] The WhatsApp bubble overlaps the primary CTA on mobile `/agendar`** — it sits directly on top of the first service card's "Adicionar" button, the core conversion action on the most important page.
- **[Medium] The same overlap pattern recurs on the blog post's sticky mobile footer.**
- **[Medium] Small tap targets on `/agendar` service card toggles** (151×23px, half the 44px guideline) sit directly above the real action button.
- **[Low] Font-family mismatch on the `/agendar` header** (serif vs. the site's usual sans-serif/mono).

Full detail: `findings/visual.md`

## Backlinks — insufficient data for a numeric score (supplementary)

No paid backlink data source is available (Ahrefs MCP returned "Insufficient plan" on every call; Moz/Bing/DataForSEO are unconfigured). Common Crawl returned zero indexed data for this domain, which is normal for a smaller/newer domain rather than a red flag. Producing a 0–100 score here would be fabricated, so none is given.

**What works:** GBP/Maps citation and both Instagram/Facebook profile links are live and verified; the "Método Leitura de Fio" story is a genuine, ready-to-pitch differentiator; the Wikidata entity (Q140387726) is live and correctly points back to the site.

**Findings:**
- **[High] The homepage's Person `sameAs` JSON-LD (both duplicate blocks) links to `https://linktr.ee/ojonquecortou`, which 404s.**
- **[Medium] No press/media page exists** (`/imprensa`, `/na-midia` both 404) — the highest-leverage low-cost link-building fix identified in this audit.
- **[Info] Toxic-link ratio is explicitly unassessed**, not "clean" — a paid tool would be needed for real confidence here.

Full detail: `findings/backlinks.md`

---

## A note on cross-agent convergence

Several findings were independently surfaced by multiple specialist agents working without knowledge of each other's output, which increases confidence they're real:

- **The pricing inconsistency** was independently flagged by the On-Page/SXO, Schema, GEO, and Local specialists — four separate lenses landing on the same root problem.
- **The duplicate `@id` LocalBusiness schema block** was directly confirmed by the Schema specialist and is the root cause the Local specialist's `priceRange` finding traces back to.
- **The dead `linktr.ee` sameAs link and the missing Wikidata `sameAs`** were both surfaced independently by the GEO and Backlinks specialists, and both fixes live in the same `prerender.js` edit.
- **The broken `og:image`/`logo` assets** were confirmed by the Technical specialist and independently corroborated by the Images-focused findings in the same pass.

## A note on session interruption

During this audit, six of the eleven specialist agents hit an account-level session/usage limit mid-task and had to be resumed after the reset. All were successfully resumed and completed with full findings — nothing here reflects a rushed or partial pass. Separately, the Content specialist reported a mid-task prompt-injection attempt (a fake "coordinator" message bundled with unrelated tool instructions appeared in its context, likely via a fetched page or tool result) — it correctly identified this as untrusted content, ignored it, and stayed in scope. No corrective action is needed; flagged here for transparency.
