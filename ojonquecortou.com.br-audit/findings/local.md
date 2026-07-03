# Local SEO Findings — www.ojonquecortou.com.br (Studio do Jon)

Audit scope: website-side local signals only. No GBP API access; GBP itself (categories, Q&A, posts freshness, photo counts) was not directly queried. Fetched via raw HTTP (prerendered HTML) plus inspection of the compiled client JS bundle (`/assets/index-w9mZfY6z.js`) to recover content that renders client-side into the empty `<div id="root">`. Pages checked: `/`, `/sobre`, `/agendar`, `/depoimentos`, `/servicos`, sitemap.xml, one BH-targeted blog post.

Business type: brick-and-mortar (single physical location, no service-area language). Industry vertical: personal care / hair salon (`HairSalon` schema, correctly used — not generic `LocalBusiness` only).

## Local SEO Score: 78 / 100

| Dimension | Weight | Assessment |
|---|---|---|
| GBP Signals (on-site proxies) | 25% | Map embed present, `hasMap`/`sameAs` cid link consistent, but no visible review-widget pulling live GBP reviews, no photo-evidence carousel tied to GBP |
| Reviews & Reputation | 20% | Strong aggregateRating (4.9/272) repeated across pages; testimonials page has real names + locality tags but no dates, no photos, no per-review schema |
| Local On-Page SEO | 20% | Belo Horizonte/Caiçaras mentioned repeatedly across hero, /sobre, /servicos, footer; strong topical depth via blog; but no dedicated "salão em BH" pillar/landing page |
| NAP Consistency & Citations | 15% | NAP string is byte-for-byte identical across home/sobre/agendar footers; citations (Yelp/BBB equivalents) not verifiable from this site-side audit |
| Local Schema Markup | 10% | Address/phone/geo present with 6-decimal precision; **openingHoursSpecification contradicts visible on-page hours** |
| Local Link & Authority Signals | 10% | sameAs links to Instagram/Facebook/Maps present; Wikidata entity noted as recent off-site work (not directly re-verified here) |

Proximity (55%+ of ranking variance per Search Atlas) is outside website control and not scored here.

## What Works

- NAP string is identical, character-for-character, across the homepage, `/sobre`, and `/agendar` footers: "Studio do Jon · Rua Francisco Ovídio, 184 · Caiçaras · Belo Horizonte, MG · CEP 30770-040. Telefone: (31) 3586-6673." No abbreviation drift (no "R." vs "Rua", no format changes).
- `HairSalon` + `LocalBusiness` is the correct schema subtype pairing for this vertical (not a generic/incorrect type).
- Geo coordinates use 6 decimal places (`-19.908634, -43.967875`), exceeding the 5-decimal recommendation.
- The Google Maps embed (`storage.googleapis.com/maps-solutions-alzpk61fzb/.../address-selection.html`) is present in the client bundle with a descriptive `title` attribute ("Mapa de Localização do Studio - O Jon que Cortou") and is wired to render on the homepage.
- Belo Horizonte / Caiçaras / BH appear repeatedly and naturally across hero copy, `/sobre` narrative (multiple paragraphs, not just a footer mention), `/servicos`, and testimonial locality tags — not a single-mention token gesture.
- Click-to-call (`tel:+553135866673`) and click-to-WhatsApp (`wa.me/553135866673`) links are both present in the same footer sentence across pages, giving redundant low-friction contact paths.

## Findings

**1. Opening hours: schema contradicts visible on-page text — High**
Visible rendered UI text (client bundle, rendered on `/` and reused elsewhere) reads: "Terça a Sexta: 9h às 19h" / "Sábado: 9h às 17h" — implying closed Sunday **and Monday**, and Saturday closing at 17:00. The JSON-LD `openingHoursSpecification` on every page instead declares `Monday–Saturday, 09:00–19:00` uniformly (a single spec block, no Saturday exception, Monday included). This is a direct, verifiable NAP-adjacent discrepancy between structured data and what users/Google see rendered. Google can use either source and a mismatch risks incorrect "Open now" states in rich results and erodes trust signals used in local ranking systems.
*Recommendation:* Fix `prerender.js`'s `localBusinessSchema` to emit two `OpeningHoursSpecification` entries — Tuesday–Friday 09:00–19:00, Saturday 09:00–17:00 — and omit Sunday/Monday entirely (per schema.org convention, omitted days = closed). Confirm this matches actual GBP hours, since GBP is the canonical source users compare against.

**2. `priceRange` mismatch between the two homepage JSON-LD blocks — Medium**
The static `<script type="application/ld+json">` block declares `"priceRange": "$$"` while the `id="dynamic-page-schema"` block (the `@graph` version, also present on the homepage) declares `"priceRange": "$"`. This is the same two-block duplication issue previously flagged for schema/NAP work generally — confirmed here it also affects `priceRange`, not just structural duplication.
*Recommendation:* Since both blocks appear to originate from `prerender.js`, consolidate to a single source of truth for `priceRange` (recommend `$$` given premium/specialist positioning) and eliminate the duplicate emission if not intentional (duplicate LocalBusiness JSON-LD blocks with the same `@id` can confuse parsers).

**3. No dedicated local "salão em Belo Horizonte" landing/pillar page — Medium**
Sitemap has zero neighborhood/city landing pages; local intent is served entirely by the homepage plus scattered blog posts (e.g. `/blog/especialista-em-cabelo-cacheado-bh-texturas`, `/blog/corte-a-seco-cabelo-cacheado-bh-volume`). For a single-location business this is defensible (a forced separate "local" page next to the homepage would be a near-duplicate / thin doorway page, which Whitespark and Google guidance both discourage). However, "dedicated service pages" is cited as the #1 local organic ranking factor and #2 AI-visibility factor — and none of the individual `/servicos/*` pages were confirmed to carry page-specific local schema or strong "Belo Horizonte" phrasing beyond the shared footer (only `/servicos` root checked in this pass).
*Recommendation:* Do not create a separate generic "local" page (duplication risk). Instead, ensure each of the ~18 `/servicos/*` service pages independently reinforces "Belo Horizonte"/"Caiçaras" in its own H1/intro (not just inherited footer), since these act as the de facto local-intent pages for a single-location business.

**4. Testimonials lack dates and photos; no per-review schema — Medium**
`/depoimentos` shows 7 named testimonials with locality tags (BH/Caiçaras) and star ratings, but no dates on any review and no client photos. Only the aggregate rating (4.9/272) is marked up in schema — individual `Review` schema objects are absent. Review recency ("18-day rule" — rankings can fall off a cliff after 3 weeks without new reviews) cannot be verified from the site since dates aren't shown; this makes it impossible for a visitor or crawler to gauge freshness from the page itself.
*Recommendation:* Add approximate dates ("Avaliado em [mês/ano]") to each testimonial and, where consent exists, client photos. Consider marking up 3-5 featured reviews as individual `Review` nodes nested under the `HairSalon` entity.

**5. No visible live GBP review feed/widget on-site — Low**
No embedded Google review widget (e.g., pulling live reviews via a third-party embed) was found on the homepage or `/depoimentos`; testimonials appear to be manually curated/static text. This isn't wrong, but a live-syncing widget would auto-signal freshness to both users and crawlers without manual upkeep.
*Recommendation:* Low priority given manual curation already covers the trust-signal need; consider only if review volume/velocity work (GBP posting automation already exists per project notes) creates enough new reviews to make a live feed worthwhile.

**6. NAP citation presence on Tier 1 directories not verifiable from this site** — Info/Limitation
This audit could not fetch or confirm Yelp/BBB-equivalent Brazilian directory listings (e.g., Google Maps cid confirmed via `sameAs`, but no Yelp Brasil equivalent is common in this market). No `site:` search capability was available in this pass.
*Recommendation:* Manually verify NAP match on any existing directory listings (Facebook Business page — linked and consistent — Instagram, and any salon-specific BR directories) against the canonical NAP string used on-site.

## Limitations Disclaimer

- No GBP API access: could not verify primary/secondary GBP category correctness (the #1 ranking factor per Whitespark), Q&A section, post cadence, or true review velocity/response rate — only what the site itself surfaces.
- Citation audit was not performed via live directory fetches/searches in this pass; Tier 1 presence is unconfirmed either way.
- Only `/`, `/sobre`, `/agendar`, `/depoimentos`, `/servicos` (root) and one blog post were fetched; the ~18 individual `/servicos/*` subpages were not individually checked for per-page local phrasing or schema in this pass.
- Rendering was done by fetching raw HTML plus static analysis of the compiled JS bundle (string search) rather than a full Playwright browser render; this reliably recovered visible text (hours, map embed, contact links) but could theoretically miss any hydration-time conditional rendering.
