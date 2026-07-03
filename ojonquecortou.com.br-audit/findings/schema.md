# Schema.org / Structured Data Audit — www.ojonquecortou.com.br

Audit date: 2026-07-03
Pages fetched (raw HTML, `mode=raw`, `is_spa=False` for all — routes are prerendered/static at the edge, confirmed via `render_page.py --mode never`):
- `/` (home)
- `/faq`
- `/depoimentos`
- `/servicos/leitura-de-fio` (service page sample)
- `/blog/curvatura-4c-cabelo-crespo-guia-completo` (blog post sample)

## Category Score: 58 / 100

Primary driver: a sitewide duplicate-`@id` LocalBusiness node introduced by the recent "LocalBusiness schema estruturado no index.html base" commit, present on literally every page checked, plus internal data conflicts (`priceRange` disagreement) between the two copies of the same entity.

---

## 1. Inventory — JSON-LD blocks found per page

Every single page checked has **exactly two** `<script type="application/ld+json">` blocks:

| Page | Block A (static, `index.html` base, no `id` attr) | Block B (`id="dynamic-page-schema"`, injected by `scripts/prerender.js`) |
|---|---|---|
| `/` | `HairSalon`/`LocalBusiness` (`@id=#localbusiness`) — full node | `@graph`: `HairSalon`/`LocalBusiness` (`@id=#localbusiness`, full node, **duplicate**), `Person` (`@id=#person`), `WebSite` (`@id=#website`, with `SearchAction`) |
| `/faq` | same static `HairSalon`/`LocalBusiness` node | `@graph`: `WebPage` (no `@id`), `FAQPage` (60+ `Question`/`Answer` pairs) |
| `/depoimentos` | same static `HairSalon`/`LocalBusiness` node | `@graph`: `HairSalon`/`LocalBusiness` (`@id=#localbusiness`, full node, **duplicate**), 7× `Review` |
| `/servicos/leitura-de-fio` | same static `HairSalon`/`LocalBusiness` node | `@graph`: `Service` (`provider` = full inline `HairSalon`/`LocalBusiness` copy, **duplicate**, with nested `Offer`), `BreadcrumbList` |
| `/blog/curvatura-4c-...` | same static `HairSalon`/`LocalBusiness` node | `@graph`: `Article`, `FAQPage` (5 Qs, scoped to article content), `BreadcrumbList` |

Types present sitewide: `HairSalon`, `LocalBusiness`, `Person`, `WebSite`+`SearchAction`, `FAQPage`, `Review`, `Service`+`Offer`, `Article`, `BreadcrumbList`. **Not found anywhere**: standalone `Organization` node with its own `@id` (Article's `publisher` is an ad hoc, unlinked `Organization`), page-level `AggregateRating` rollup tied to the visible review list on `/depoimentos`, `WebPage`/`isPartOf` linkage from content pages back to `#website`/`#localbusiness`.

## 2. Validation results

- **Valid JSON syntax**: all 10 blocks parse cleanly (2 per page × 5 pages). No syntax errors.
- **`@context`**: `https://schema.org` everywhere — correct (https, not http). Pass.
- **No deprecated types**: no `HowTo`, `SpecialAnnouncement`, `CourseInfo`/`EstimatedSalary`/`LearningVideo` found. Pass.
- **URLs**: absolute throughout (`https://www.ojonquecortou.com.br/...`). Pass.
- **Dates**: `datePublished`/`dateModified` on the sampled Article are `2026-07-01` (ISO 8601). Pass, but see Finding 5 (same-day pub/mod on many posts).
- **Duplicate `@id` conflicts**: **FAIL**, sitewide. See Finding 1.
- **Placeholder text**: none found. Pass.
- **Encoding**: `<meta charset="UTF-8">` declared and JSON-LD renders correctly with proper Portuguese accents when read directly (mojibake seen in one intermediate terminal `grep` was a shell-display artifact only, not a real site bug — verified against raw bytes and the Read tool render). Not a finding.

---

## Findings

### Finding 1 — CRITICAL: Sitewide duplicate `@id` LocalBusiness node (regression from index.html base schema)
**Evidence**: On `/`, `/faq`, `/depoimentos`, `/servicos/leitura-de-fio`, and the sampled blog post, an identical static `HairSalon`/`LocalBusiness` block with `@id: "https://www.ojonquecortou.com.br/#localbusiness"` renders unconditionally from the `index.html` base template (comment: `<!-- Schema Markup: injected per-page by prerender.js at build time -->` immediately precedes it, but this block itself is static, not the prerender-injected one). The prerender-injected `dynamic-page-schema` block runs immediately after it. On `/` and `/depoimentos` this second block **also** contains a full `HairSalon`/`LocalBusiness` node with the **same `@id`**, meaning two independent JSON-LD script tags on the same page declare an identical `@id` as two syntactically different objects. This is precisely the risk flagged in memory ("recent commit added LocalBusiness schema... check whether this introduced a NEW duplicate") — it has materialized and is live in production.
**Additional conflict**: the two copies don't even agree — Block A's `priceRange` is `"$$"` on `/` but Block B/inline copies elsewhere show `"$"` (see Finding 2). A single `@id` should resolve to one canonical, consistent node; Google's structured-data parser will pick one arbitrarily or may flag conflicting duplicate entities during rendering.
**Recommendation**: Remove the static `HairSalon`/`LocalBusiness` block from `index.html` entirely (Block A) now that `prerender.js` reliably injects a per-route canonical version, OR make Block A a lightweight `{"@id": "https://www.ojonquecortou.com.br/#localbusiness"}`-only stub that is never actually used because prerender always overwrites the page before crawl. Simplest fix: delete the static block from the `index.html` base template — the site is confirmed non-SPA/prerendered (`is_spa=False` on every route), so `prerender.js`'s per-route injection is sufficient and already runs on every route in production.

### Finding 2 — HIGH: `priceRange` conflicts between LocalBusiness copies ("$$" vs "$")
**Evidence**: Home page Block A/B: `"priceRange": "$$"`. Same node re-declared inline inside `/servicos/leitura-de-fio`'s `Service.provider` and `/depoimentos`'s Block B/Review's `itemReviewed`: `"priceRange": "$"`. Two different price-tier signals for the identical `@id` across the site.
**Recommendation**: Standardize on one value. Given "Corte com o Jon" is R$190 and combos run to R$230 (per FAQ answers), `"$$"` is more representative; align all inline copies to that once Finding 1's duplication is resolved (a single canonical node removes the conflict entirely).

### Finding 3 — HIGH: `Service.provider` and `Review.itemReviewed` embed full inline LocalBusiness copies instead of `{"@id": ...}` references
**Evidence**: `/servicos/leitura-de-fio`'s `Service.provider` is a complete ~40-line inline `HairSalon`/`LocalBusiness` object (with its own `@id` matching the canonical one) rather than a bare reference. Same pattern on all 7 `Review.itemReviewed` objects on `/depoimentos`, except those don't even carry the `@id` (so they're anonymous duplicate `HairSalon` type declarations with no dedup key at all — worse than Finding 1's pattern).
**Recommendation**: Once a single canonical `#localbusiness` node exists per page (Finding 1 fixed), replace `Service.provider` and every `Review.itemReviewed` with `{"@id": "https://www.ojonquecortou.com.br/#localbusiness"}`. This is a `prerender.js` template change (per memory: edit `localBusinessSchema` construction, not `index.html`) — reuse the `@id` reference pattern already correctly used for `founder`/`worksFor`/`author` elsewhere in the same file.

### Finding 4 — MEDIUM: Article `publisher` is an unlinked, ad hoc `Organization` with a different logo than the canonical business
**Evidence**: Blog post's `Article.publisher`: `{"@type":"Organization","name":"Studio do Jon","logo":{"@type":"ImageObject","url":".../logo-cabeleireiro-de-cachos.png"}}` — no `@id`, and its logo file differs from `#localbusiness.logo` (`.../logo.png`). This creates a third, disconnected identity for the same business in the knowledge graph.
**Recommendation**: Give the canonical LocalBusiness node (or a dedicated `Organization` sibling) a stable `@id` and reference it from `Article.publisher` via `{"@id": "https://www.ojonquecortou.com.br/#localbusiness"}` (LocalBusiness is a valid Organization subtype and acceptable as Article publisher). Standardize on a single logo asset across all schema.

### Finding 5 — INFO: FAQPage present and content-matched — correctly kept for AI/LLM value, not a rich-result play
**Evidence**: `/faq` has a `FAQPage` with 60+ `Question`/`Answer` pairs that match the visible on-page Q&A (verified against the rendered content in the JSON-LD, e.g. "Quanto custa um corte no Studio do Jon?" ties to visible pricing FAQ). The sampled blog post also carries a 5-question, content-scoped `FAQPage`.
**Per current Google policy** (FAQ rich results retired sitewide as of 2026-05-07): this markup will not produce a SERP FAQ rich snippet. It is still valuable for AI Overviews/LLM citation and entity/answer extraction, so it should **not** be removed. No action required; flagging as Info per audit rules.
**One structural note**: `/faq`'s `WebPage` node in the same graph has no `@id`, so it can't be cleanly cross-referenced (e.g. via `mainEntityOfPage`) — low-value fix, optional.

### Finding 6 — MEDIUM: `/depoimentos` shows only 7 discrete `Review` nodes with no page-level `AggregateRating` tying them to the visible "4.9/5, 272 reviews" claim
**Evidence**: The 4.9/272 `AggregateRating` only exists inside the `#localbusiness` node (itself duplicated per Finding 1). The 7 `Review` objects on `/depoimentos` are real, well-formed (`author`, `reviewRating`, `reviewBody`) but carry no `datePublished`, and the page doesn't structurally connect "here are sample reviews contributing to the 4.9★/272 total" — that link only exists in prose/UI, not in schema (each Review's `itemReviewed` is its own anonymous HairSalon copy, disconnected from the AggregateRating-bearing node, per Finding 3).
**Recommendation**: (a) Add `datePublished` to each `Review` (recommended property, low effort, dates likely available from the source review data). (b) Fix `itemReviewed` to reference the canonical `@id` (Finding 3) — that alone makes the 4.9/272 AggregateRating and the 7 sample Reviews part of the same graph node, which is the correct pattern for Google's Review snippet + merchant listing eligibility (LocalBusiness, not "self-serving" review type, is fine as long as reviews are of the business, not of products it sells).

### Finding 7 — LOW: `Service` schema present on the sampled service page but not confirmed sitewide; Offer pricing is a good practice worth replicating
**Evidence**: `/servicos/leitura-de-fio` has `Service` + nested `Offer` (`price: 80`, `priceCurrency: "BRL"`, numeric type, correctly typed — not a string). This is exactly the kind of high-value schema Google can use for service listings. The sitemap lists 20 `/servicos/*` URLs; only one was sampled, but the consistent `prerender.js` templating strongly suggests all get the same `Service`+`Offer`+`BreadcrumbList` pattern.
**Recommendation**: Spot-check 2–3 more service pages (e.g. `/servicos/corte-jon`, `/servicos/transicao-capilar`) to confirm `Offer.price` values match the current price list quoted in the FAQ (Corte com o Jon R$190, Combo R$230, Manutenção R$130, Leitura de Fio isolada R$80) — no mismatch found in the one page sampled, but worth a full pricing-consistency pass given prices live in prose (FAQ answers) AND in schema (`Offer.price`) in at least two places that must stay in sync.

### Finding 8 — LOW: `BreadcrumbList` present and correctly formed on deep pages
**Evidence**: Both `/servicos/leitura-de-fio` and the sampled blog post have valid 3-level `BreadcrumbList`s (Home → Section → Page) with correct `position`, `name`, absolute `item` URLs. No missing-property issues.
**Recommendation**: None — this is working correctly. No action needed.

### Finding 9 — INFO: `WebSite` + `SearchAction` present on home, targets `/blog?q={search_term_string}`
**Evidence**: Home's Block B includes a `WebSite` node with `potentialAction.SearchAction.target.urlTemplate = "https://www.ojonquecortou.com.br/blog?q={search_term_string}"`. This is syntactically valid for Sitelinks Search Box eligibility, contingent on `/blog?q=...` actually returning filtered results (not verified in this audit — functional check, not schema check).
**Recommendation**: Confirm `/blog?q=test` returns a working search results view; if it doesn't, this markup risks Search Console warnings for a non-functional SearchAction endpoint.

---

## Missing schema opportunities

1. **Canonical `Organization`/`LocalBusiness` `@id` reuse everywhere** (ties into Findings 1, 3, 4) — the single highest-leverage fix; every other gap here is downstream of not having one unambiguous node.
2. **`Review.datePublished`** on `/depoimentos` reviews (Finding 6).
3. **`WebPage`/`@id` + `isPartOf`** linking `/faq`'s `WebPage` node back to `#website` (minor, Finding 5).
4. **No `HowTo` recommended** for "Leitura de Fio" — correctly avoided per current guidance (HowTo rich results were removed Sept 2023); `Service` is the right type here and is already used. No action needed, noting explicitly since the brief asked about it.
5. **Sitewide `Service.priceRange` / `Offer.price` consistency pass** across all 20 service pages (Finding 7) — not fully verified, single-page sample only.

---

## Sample corrected JSON-LD (Service page `provider`, illustrating Finding 1 + 3 fix)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Leitura de Fio",
      "provider": { "@id": "https://www.ojonquecortou.com.br/#localbusiness" },
      "offers": {
        "@type": "Offer",
        "price": 80,
        "priceCurrency": "BRL",
        "valueAddedTaxIncluded": true
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.ojonquecortou.com.br" },
        { "@type": "ListItem", "position": 2, "name": "Serviços", "item": "https://www.ojonquecortou.com.br/servicos" },
        { "@type": "ListItem", "position": 3, "name": "Leitura de Fio", "item": "https://www.ojonquecortou.com.br/servicos/leitura-de-fio" }
      ]
    }
  ]
}
```

(Note: `valueAddedTaxIncluded` should be boolean `true`, not the string `"true"` currently on the live site — minor type nit folded into this example.)
