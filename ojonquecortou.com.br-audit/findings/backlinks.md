# Backlink Profile Audit — ojonquecortou.com.br

**Audit date:** 2026-07-03
**Domain:** ojonquecortou.com.br (production: www.ojonquecortou.com.br)
**Tier available:** Tier 0 — Common Crawl + Verification crawler only.
No Moz API key, no Bing Webmaster API key configured on this machine
(`backlinks_auth.py --check` → `tier: 0`). Ahrefs MCP tools
(`site-explorer-domain-rating`, `site-explorer-metrics`,
`site-explorer-backlinks-stats`) were attempted directly and all returned
`{"error": "Insufficient plan"}` — Ahrefs account does not have backlink-data
access, confirmed, not retried further.

## Data availability caveat (read first)

**Domain Authority, Page Authority, and Spam Score are UNAVAILABLE.** These
metrics require a paid Moz, Ahrefs, or DataForSEO key. No numeric DA/PA/DR is
estimated or hallucinated anywhere in this report. Any DA/PA figure quoted
elsewhere for this site did not come from this audit.

**Toxic-link ratio is UNASSESSED, not "clean."** A real toxic-link audit
requires a paid backlink index (Moz Spam Score, Ahrefs, or DataForSEO). The
absence of visible spam signals in this free-tier check is not evidence of a
clean profile — it simply means we have no visibility into it.

## Common Crawl Web Graph

| Query | Result | Confidence |
|---|---|---|
| `ojonquecortou.com.br` (apex) | Not found in Common Crawl (`in_crawl: false`) | 0.50 |
| `www.ojonquecortou.com.br` | Not found in Common Crawl (`in_crawl: false`) | 0.50 |

Source: Common Crawl release `cc-main-2026-jan-feb-mar`, queried 2026-07-03.
No PageRank, harmonic centrality, in-degree, or referring-domain list is
available — the domain has not yet been picked up in a CC crawl snapshot.
CC data is domain-level and refreshed roughly quarterly, so this is expected
for a small, relatively new local-business site rather than a red flag. It
does mean CC contributes **zero data points** to scoring this profile, not
just low-confidence ones.

## Verified inbound/outbound signals (from live homepage fetch)

Fetched `https://www.ojonquecortou.com.br/` directly (HTTP 200, confirmed via
curl, 2026-07-03).

| Link | Status | Note |
|---|---|---|
| `https://www.wikidata.org/wiki/Q140387726` (entity, "O Jon que Cortou") | Live, HTTP 200 | Verify (0.95). Confirmed via Wikidata Special:EntityData JSON. Entry has only 2 claims: P31 (instance of) and P856 (official website → `https://www.ojonquecortou.com.br`). This is a legitimate citation from a high-authority domain, but Wikidata links are `nofollow`/no direct ranking weight — value is citation/entity-graph, not link equity. |
| `https://www.google.com/maps?cid=16629671607593282841` (GBP/Maps) | Live, HTTP 200 | Verify (0.95) |
| `https://www.instagram.com/ojonquecortou` | Live, HTTP 200 | Verify (0.95) |
| `https://www.facebook.com/ojonquecortou/` | Live, HTTP 200 | Verify (0.95) |
| `https://linktr.ee/ojonquecortou` | **Broken — HTTP 404** | Verify (0.95), confirmed with two separate requests/user-agents. Referenced inside the Person `sameAs` array in the site's own JSON-LD (prerender.js output). |

Homepage outbound `<a href>` links otherwise consist only of `wa.me` (WhatsApp
CTA), Google Fonts CDN, and internal navigation — no outbound "as seen in,"
press-mention, or partner-directory links found in the body HTML.

## Site-side citation readiness (qualitative, not data-sourced)

- No `/imprensa` or `/na-midia` path exists (both return HTTP 404, verified
  directly). There is no press/media page for journalists, bloggers, or
  directory editors to reference or pull assets from.
- A genuine differentiator story already exists on-site and is
  well-articulated: `/metodo` (dedicated page) and
  `/blog/leitura-de-fio-metodo-exclusivo-studio-do-jon` both describe the
  proprietary 7-step "Método Leitura de Fio" diagnostic in detail. This is
  usable, citable IP for outreach — it is currently not packaged for external
  pickup (no downloadable asset, infographic, or "quote us" media kit).
- `sitemap.xml` responds HTTP 200 and is reachable, so any future press/
  citation pages would be discoverable once added.

## Findings

**1. Broken link inside structured data — `linktr.ee/ojonquecortou` returns 404**
- Severity: **High**
- Evidence: The Person entity's `sameAs` array (injected by `prerender.js`
  into the homepage JSON-LD, both schema blocks) lists
  `https://linktr.ee/ojonquecortou`. Direct verification (curl, two user
  agents, 2026-07-03) confirms this URL returns HTTP 404. Source: Verify
  crawler (confidence 0.95).
- This degrades entity-graph/`sameAs` credibility signals search engines use
  to consolidate the business's identity across platforms, and it's a
  citation-consistency red flag if any directory or crawler follows it.
- Recommendation: Either restore the Linktree page, or remove the dead URL
  from `sameAs` in `prerender.js` (per existing note: edit the outer repo's
  `localBusinessSchema`, not `index.html`).

**2. Wikidata entry exists but is not reciprocally linked from the site**
- Severity: **Medium**
- Evidence: Wikidata Q140387726 (created 2026-06-30, confirmed live) has
  `P856` pointing to `https://www.ojonquecortou.com.br`. The site's own
  `sameAs` arrays (both JSON-LD blocks on the homepage) do **not** include
  the reverse link to `https://www.wikidata.org/wiki/Q140387726`. Source:
  direct HTML inspection + Wikidata API (confidence 0.95).
- Recommendation: Add the Wikidata URL to the `sameAs` array in
  `prerender.js`'s `localBusinessSchema` (both blocks) to close the loop and
  strengthen entity disambiguation for Google's Knowledge Graph.

**3. No referring-domain visibility — Common Crawl has no data for this domain**
- Severity: **Info**
- Evidence: `commoncrawl_graph.py` returned `in_crawl: false` for both
  `ojonquecortou.com.br` and `www.ojonquecortou.com.br` (release
  cc-main-2026-jan-feb-mar). Confidence 0.50 (domain-level, and in this case
  a null result rather than a low-confidence one).
- This is expected for a small, newer local-business domain and is not
  itself evidence of a weak or strong profile — it means this audit has no
  quantitative referring-domain count, PageRank, or centrality data at all.
  Do not treat the absence of CC data as a negative signal; treat it as no
  signal.
- Recommendation: Re-run this same Common Crawl check quarterly as new CC
  snapshots release; the domain may appear once it accumulates more external
  links and crawl coverage.

**4. No press/media page; differentiator story is not packaged for outreach**
- Severity: **Medium**
- Evidence: `/imprensa` and `/na-midia` both return HTTP 404 (verified
  directly). `/metodo` and the "Leitura de Fio" blog post exist and clearly
  articulate a genuine differentiator (7-step proprietary hair diagnostic
  method) but there is no dedicated page bundling founder bio, high-res
  photos, method explainer, and boilerplate for journalists/bloggers/
  directories to pick up.
- Recommendation: Build a lightweight `/imprensa` (or `/na-midia`) page with:
  founder headshot + bio, salon photos, a 2-3 sentence "what makes Leitura de
  Fio different" pitch, and contact info for interview requests. This is the
  single highest-leverage low-cost asset for earning beauty-press and local
  directory backlinks, since currently there is nothing to point to or
  quote.

**5. Toxic-link risk is unassessed, not confirmed clean**
- Severity: **Low** (as a finding; treat the *gap in knowledge* as
  something to close, not the site's fault)
- Evidence: No paid backlink index (Moz Spam Score, Ahrefs, DataForSEO) is
  configured. Tier 0 tools have no spam/toxicity signal at all.
- Recommendation: Before doing aggressive outreach/link-building, get a Moz
  free-tier API key (2,500 rows/month, no cost) at minimum to get baseline
  DA/PA/Spam Score visibility. Do not report or imply "no toxic links found"
  anywhere downstream — the correct status is "not evaluated."

## Low-cost backlink-building recommendations (single-location BH hair salon)

1. **Local business directories (Brazil-specific):** Google Business Profile
   (already has Maps citation, confirmed live), Guia Mais, Apontador,
   TeleListas, ContaAzul-style local listing aggregators, and
   Belo Horizonte/Caiçaras neighborhood association or bairro business
   listings if any exist. Each is free and gives a legitimate local citation.
2. **Beauty/hair-niche blog and press outreach:** Pitch the "Método Leitura
   de Fio" as a story angle (proprietary diagnostic process, visagismo
   specialist) to BH-focused lifestyle blogs and national curly-hair
   communities (comunidades de cabelo cacheado/crespo are active on
   Instagram and blogs in Brazil). Requires the press page from Finding 4 to
   be effective.
3. **Instagram-to-Wikidata/Wikipedia `sameAs` completion:** Fix Finding 2
   (add Wikidata URL to site's `sameAs`) and consider expanding the Wikidata
   item itself (currently only 2 claims) with more properties (P17 country,
   P159 headquarters location, P452 industry, image) to make it a richer,
   more crawlable entity — increasing the odds it surfaces in Knowledge
   Panel-adjacent contexts.
4. **Partner/complementary local businesses:** Reciprocal or one-way links
   from complementary Caiçaras/BH businesses (barbershops that refer curly
   hair clients out, product brands used in-salon, the metrô Gameleira
   area's local business associations) — low effort, high relevance, matches
   the site's existing local-proximity content angle (metrô Gameleira
   mentioned in on-page copy).

## Metadata

- Sources used: Common Crawl (`cc-main-2026-jan-feb-mar`), local Verify
  crawler (curl-based direct fetch), Wikidata Special:EntityData API, direct
  homepage HTML fetch.
- Sources unavailable: Moz API, Bing Webmaster API, DataForSEO, Ahrefs
  (insufficient plan tier — confirmed via 3 direct MCP calls, not retried).
- Data freshness: Common Crawl ~quarterly (current release: 2026 Jan-Mar);
  Verify crawler results are real-time as of 2026-07-03; Wikidata queried
  live 2026-07-03.
