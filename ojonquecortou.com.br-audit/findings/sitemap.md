# Sitemap Audit — www.ojonquecortou.com.br

Audit date: 2026-07-03
Source: https://www.ojonquecortou.com.br/sitemap.xml (fetched live, 200 OK, 15,712 bytes)

## Score: 92/100

## Summary
The sitemap is valid, fully accurate against a live crawl, and 100% of listed URLs return 200. No missing indexable pages were found when cross-checking every internal link discoverable from the homepage, /servicos, /blog, /faq, /glossario, /metodo, /investimento, and /sobre. The two items previously flagged (lastmod dates, rotina-basica redirect) are both confirmed fixed. Remaining points are informational/low severity: legacy priority/changefreq tags (Google ignores both) and a note on future restructuring as the blog scales.

## What Works
- XML is well-formed (validated via .NET XmlDocument parser) with the correct `http://www.sitemaps.org/schemas/sitemap/0.9` namespace and no malformed entries.
- All 78 URLs return HTTP 200 — verified every single one (not just a spot-check), zero 3xx/4xx/5xx.
- 100% sitemap-to-crawl parity: every internal href discovered on homepage (56 unique links), /servicos, /blog, /faq, /glossario, /metodo, /investimento, and /sobre is present in the sitemap. Zero orphaned pages, zero missing pages.
- `/cliente` and `/admin` are correctly excluded from the sitemap and correctly `Disallow`ed in robots.txt (they return 200 as SPA shell responses but are non-indexable by directive, which is appropriate).
- The old `rotina-basica-cabelo-cacheado-cronograma` URL is absent from the sitemap and correctly issues a 301 to `/blog/cronograma-capilar-cabelo-cacheado` — confirmed live, not listed anywhere in the 78 entries.
- lastmod dates are genuinely varied: 29 distinct date values spanning 2026-03-30 to 2026-07-03, tracking real per-post edit history (not a blanket fake date). See distribution note below.
- robots.txt correctly references the sitemap: `Sitemap: https://www.ojonquecortou.com.br/sitemap.xml`.
- Sample-checked meta robots tags (home, a blog post, agendar) all show `index, follow` — no accidental noindex on sitemap-listed pages.

## Findings

### 1. lastmod distribution — 31/78 (40%) share today's date (2026-07-03)
**Severity:** Info
**Evidence:** 31 of 78 URLs carry `<lastmod>2026-07-03</lastmod>`: this is the homepage + all 10 core static pages (servicos, sobre, blog, depoimentos, faq, glossario, metodo, investimento, galeria, agendar) + all 20 /servicos/* subpages + 1 blog post (curvatura-4c-cabelo-crespo-guia-completo, plausibly actually edited today). The remaining 47 blog posts carry 28 distinct dates from 2026-03-30 through 2026-07-01, a legitimate spread (no single date exceeds 7 occurrences among blog posts; the max repeat is 7× on 2026-04-14).
**Assessment:** This is NOT the same bug as before. The 31-URL cluster on today's date corresponds exactly to the site's non-blog templates (services + core pages), which plausibly share a single "last deploy/edit" timestamp because they aren't individually dated content the way blog posts are. This is legitimate, not a re-occurrence of the blanket-fake-date bug. No action required, but if `parseDateToISO` for the core/service pages is literally falling back to "today at build time" rather than a real content-edit date, consider giving those pages fixed real lastmod values too so the pattern doesn't look coincidentally suspicious to a future auditor.
**Recommendation:** No fix needed now; optionally document why core/service pages share a date (build-time fallback vs. actual edit) so it's not re-flagged.

### 2. priority and changefreq tags present throughout
**Severity:** Info
**Evidence:** All 78 entries carry `<priority>` (1.0 home, 0.9 for servicos/sobre/blog/depoimentos/galeria, 0.8 for everything else) and `<changefreq>` (daily on /blog, weekly on 5 high-value pages, monthly on the remaining 72). Google officially ignores both signals.
**Assessment:** The hierarchy itself is sane (home > core sections > detail pages), so this isn't a mistake, it's simply legacy markup with no functional benefit. Not harmful, adds bytes only.
**Recommendation:** Optional cleanup — can be removed in a future sitemap regeneration to slim the file, but not urgent at 78 URLs / 15KB.

### 3. Sitemap will need restructuring guidance as blog scales
**Severity:** Info
**Evidence:** Current: 78 URLs total (47 blog posts), well under the 50,000-URL single-file limit and under the ~few-thousand-URL practical threshold where a sitemap index becomes worth the complexity.
**Recommendation:** No action needed today. Revisit only if/when blog posts approach ~500–1000 entries or if the single sitemap file starts mixing very different content-type cadences (e.g., a future service-area expansion) — at that point split into `sitemap-pages.xml` + `sitemap-blog.xml` behind a `sitemap-index.xml`. Flagging as forward-looking guidance only.

### 4. No orphaned/thin blog posts identified requiring sitemap removal
**Severity:** Info
**Evidence:** All 47 blog posts are internally linked from /blog and return 200 with `index, follow`. Did not perform full word-count/duplicate-content analysis (out of scope for a sitemap-mechanics audit) but titles show topical diversity (technique guides, product education, seasonal care, cut trends) rather than templated/programmatic patterns. No location-page-style doorway pattern present (single-location business, not multi-city).
**Recommendation:** None from a sitemap-inclusion standpoint. If a content-quality audit is run separately, flag any post under ~300 words for consolidation, but this is outside sitemap architecture scope.

## Quality Gate Check
Location Page Thresholds: **Not applicable.** This is a single-location salon (Belo Horizonte) with 0 location/city-swap pages. The 20 /servicos/* pages are service-differentiated (distinct treatments: descoloracao, corte-hibrido, transicao-capilar, coloracao-completa, etc.), not geo-doorway pages, so the 30+/50+ page thresholds for programmatic location pages do not apply here.

## Validation Check Table

| Check | Result |
|---|---|
| XML well-formed | Pass |
| Correct namespace (sitemap/0.9) | Pass |
| URL count vs 50,000 limit | Pass (78) |
| All URLs return 200 | Pass (78/78 checked) |
| Redirected URLs listed in sitemap | Pass (none found) |
| Noindexed URLs in sitemap | Pass (none found on sample) |
| Missing indexable pages (crawl vs sitemap) | Pass (0 gaps across home/servicos/blog/faq/glossario/metodo/investimento/sobre) |
| /cliente or /admin wrongly included | Pass (both excluded, both Disallow'd in robots.txt) |
| lastmod realism | Pass (29 distinct dates, legitimate spread; see Finding 1 for nuance) |
| rotina-basica-cabelo-cacheado-cronograma absent + 301 | Pass (confirmed) |
| priority/changefreq present | Info only — ignored by Google, safe to remove |
| robots.txt sitemap reference | Pass |
| Sitemap index needed at current scale | Not needed (78 << 50,000) |
