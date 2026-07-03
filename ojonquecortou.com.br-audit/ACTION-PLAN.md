# Action Plan — www.ojonquecortou.com.br

Derived from the Full SEO Audit, 2026-07-03. Full context and evidence for every item: `FULL-AUDIT-REPORT.md` and `findings/*.md`. See the changelog at the top of `FULL-AUDIT-REPORT.md` for the same-day fix pass — items below marked ✅ were fixed and verified via a clean `npm run build` on 2026-07-03.

## Phase 1: Critical Fixes (Week 1)

- [x] ✅ **Remove the static duplicate LocalBusiness JSON-LD block from `index.html`.** Fixed. Bonus: found and fixed a deeper bug this was masking — `prerender.js` was corrupting `priceRange: "$$"` to `"$"` on every build via an unescaped `String.replace()` call; fixed across all 7 call sites. *(Schema, Critical)*
- [x] ✅ **Fix the "Combo Corte + Tratamento" homepage/llms.txt price.** Real root cause: it's a working promo (`price: 320` / `promoPrice: 230` in `seedServices.js`, correctly shown on the service page) — the homepage noscript body and `llms.txt` just had a stale hardcoded R$320. Both updated to "R$ 230 (promocional, de R$ 320)". The R$190–230 "Corte especializado" range on `/faq`/`/investimento` was left untouched — consistent between both pages, not proven wrong. *(On-Page/Schema/GEO/Local, Critical)*
- [x] ✅ **Repoint `og:image` and JSON-LD `logo`/`image` fields to `/jon-perfil.webp`/`/logo-app.png`.** Fixed in `index.html` and `prerender.js`. *(Technical/Images, High)*
- [x] ✅ **Add `media-src` to the Content-Security-Policy header.** Fixed in `vercel.json`. Note: the video now loads, but `/galeria` still ships zero `<img>` tags server-side — that structural fix (prerendering gallery images) is still open. *(Performance/Images, Critical)*
- [x] ✅ **WhatsApp floating bubble on mobile `/agendar`.** Fixed — button now hides on `/agendar` routes (page already has its own WhatsApp contact option in the booking flow). The same overlap on blog post mobile footers is still open. *(Visual, High)*
- [ ] **Address homepage LCP (8.4s, Poor).** Prerender real hero markup server-side with `fetchpriority="high"` and explicit image dimensions rather than relying on client hydration. **Not attempted — this is real engineering work, not a config fix.** *(Performance, Critical)*
- [x] ✅ **IndexNow key file — false positive, no fix needed.** The audit checked the wrong filename (`/indexnow.txt`); the real key file at `/2778862fb97f435e968549a6ef8f4f05.txt` was already live (200) the whole time. *(Technical, corrected)*

## Phase 2: High-Impact Improvements (Weeks 2–3)

- [x] ✅ Fix the opening-hours JSON-LD to match the real hours. Fixed in `prerender.js`. *(Local, High)*
- [ ] Give `/admin` and `/cliente` a true 401/403 or distinct noindex shell instead of silently serving the homepage snapshot; fix the soft-404 page body the same way. **Partially fixed**: `X-Robots-Tag: noindex, nofollow` added for both routes in `vercel.json` (prevents indexing). The underlying shared-shell architecture (both routes still serve homepage-identical body content) was not restructured — bigger change, deferred. *(Technical, High/Medium)*
- [x] ✅ Replace `Service.provider` and all `Review.itemReviewed` inline LocalBusiness copies with `{"@id": "#localbusiness"}` references. Fixed in `prerender.js`. *(Schema, High)*
- [ ] Dedupe the two GA4 tags (`G-2HCS01RSP2` and `G-BC8WXZKTLL`) and lazy-load Firebase only where needed — 504 KiB of unused JS is a major TBT contributor. *(Performance, High)*
- [x] ✅ Set `Cache-Control: max-age=31536000, immutable` on hashed `/assets/*` files. Fixed in `vercel.json`. *(Performance, High)*
- [ ] Add real content to `/agendar`: price recap, rating badge, and the existing cancel/reschedule flexibility surfaced as a friction-reducer. It's the conversion page with almost no crawlable content today. *(On-Page, High)*
- [ ] Add mid-article and intro CTAs to blog posts — currently a single end-of-post CTA on long posts breaks the cold-landing-to-booking path. *(On-Page, High)*
- [ ] Manually verify `corte-a-seco-cabelo-cacheado-bh-volume` vs `corte-para-cabelo-cacheado-bh-volume` — near-identical slugs/intent, likely the same duplicate pattern already fixed for cronograma-capilar. Merge/redirect if confirmed. *(Content Architecture, High)*
- [x] ✅ Add Wikidata `sameAs` and remove the dead `linktr.ee` link. Fixed in `prerender.js`. *(GEO/Backlinks, Medium/High)*
- [ ] Expand the 6 thin `/servicos` subpages (648–694 words) to 1,200–1,500 words, prioritizing the high-ticket services (`inside-trp`, `protocolo-blindagem-ph-reconstrucao`) first. *(Content, Medium)*
- [ ] Fix small tap targets on `/agendar` service card toggles (currently 23px tall vs. the 44px guideline). *(Visual, Medium)*

## Phase 3: Content & Authority (Month 2)

- [ ] Build 3 pillar pages (2,500–4,000 words) for the frizz, porosidade/pH, and cortes/tendências clusters, with mandatory bidirectional links to every spoke post. *(Content Architecture, High)*
- [ ] Verify and merge/redirect the near-duplicate "day after" posts (`fim-do-bad-hair-day-after` vs `day-after-cabelo-cacheado-bh-como-reativar-sem-lavar`) if confirmed identical intent. *(Content Architecture, Medium)*
- [ ] Add explicit comparison cross-links between the wolf-cut and shag-cacheado posts ("Wolf cut ou shag — qual combina com seu cacho?"). *(Content Architecture, Medium)*
- [ ] Add contextual first-mention links from blog posts to `/glossario` — currently zero despite heavy jargon use. *(Content, Medium)*
- [ ] Refresh the 12+ posts frozen at `dateModified = datePublished` for 3+ months; add a visible "Atualizado em" signal. *(Content, Low/Medium)*
- [ ] Build a press/media page (`/imprensa`) and pursue beauty-press outreach using the "Leitura de Fio" story — the single highest-leverage low-cost link-building opportunity found. *(Backlinks, Medium)*
- [ ] Add dates and per-review schema to `/depoimentos` testimonials. *(Local, Medium)*
- [ ] Reinforce "Belo Horizonte" locally in each `/servicos/*` page's own H1/intro, not just the shared footer. *(Local/On-Page, Medium)*
- [ ] Expand `llms.txt` with a curated "Principais Artigos" list and 3–5 sample FAQ Q&As — it currently lists routes only. *(GEO, Medium)*
- [ ] Build a comparison/"best-of" content asset to compete for "melhor salão cabelo crespo BH"-type queries, currently owned by competitors. *(SXO, Medium)*
- [ ] Self-host Google Fonts; add HowTo/ItemList schema to the `/metodo` 7-step process. *(Performance/Content, Medium/Info)*

## Phase 4: Monitoring & Iteration (Ongoing)

- [ ] **Seed a drift baseline now** — none existed prior to this audit. The duplicate-schema regression found here would have been caught immediately by drift monitoring had a baseline existed since the prior audit.
- [ ] Re-check Common Crawl backlink data quarterly; consider a free-tier Moz key (2,500 rows/month) for basic DA/PA visibility.
- [ ] Track GSC/GA4 impact after the pricing-consistency and image fixes ship.
- [ ] Re-measure Core Web Vitals with field data after the LCP/TBT fixes ship — consider configuring a PageSpeed Insights API key for future audits.
- [ ] Polish remaining Low-severity items: pinch-zoom re-enable, `/agendar` font-family mismatch, minor sub-44px tap targets, bare-domain redirect hop collapse.
