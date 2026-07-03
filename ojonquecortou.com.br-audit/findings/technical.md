# Technical SEO Audit — www.ojonquecortou.com.br
Audit date: 2026-07-03

## Scope confirmed
- Sitemap fetched live: https://www.ojonquecortou.com.br/sitemap.xml → 200 OK, 78 URLs.
- Lastmod dates span 2026-03-30 through 2026-07-03 — NOT a blanket-fake single date. The 2026-07-02 fix is holding. CONFIRMED FIXED.
- robots.txt (200 OK): `Allow: /`, `Disallow: /admin`, `Disallow: /cliente`, explicit allow rules for GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, GoogleOther, CCBot, cohere-ai, OAI-SearchBot, Applebot-Extended, Bytespider. References `Sitemap:` and `License:` (license.xml). Spot-checked, matches prior verification.
- Security headers spot-checked on homepage via render_page.py JSON headers dump: CSP, HSTS (max-age=63072000), X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy present, Server: cloudflare. Matches prior verification.
- Known redirects /sobre-o-jon → /sobre and /blog/rotina-basica-cabelo-cacheado-cronograma → /blog/cronograma-capilar-cabelo-cacheado both confirmed working (301, single hop).
- IndexNow key file: CONFIRMED STILL 404 at both `/indexnow.txt` and `/.well-known/indexnow.txt`.

## 1. Canonical tags
- Homepage: `<link rel="canonical" href="https://www.ojonquecortou.com.br/">` — self-referencing, www, https. Correct.
- /servicos: canonical → `https://www.ojonquecortou.com.br/servicos` (no trailing slash). Correct, self-referencing.
- /servicos/ (with trailing slash) serves byte-identical HTML to /servicos (no trailing slash), and canonical still points to the no-trailing-slash version — so no duplicate-content risk despite both URLs resolving with 200. No redirect exists from trailing-slash to canonical form, but since canonical is consistent, impact is low.
- Blog post (curvatura-4c-cabelo-crespo-guia-completo): canonical self-referencing, correct, https/www consistent.
- No mixed http/non-www canonical instances found in the pages sampled.

## 2. Indexability
- Meta robots on all sampled pages (home, /servicos, blog post, /agendar, /faq): `<meta name="robots" content="index, follow">`. Correct for public pages.
- No `X-Robots-Tag` HTTP header present on any sampled response (checked home, /admin, /cliente, blog post) — not a problem since meta robots handles it, but note for completeness.
- **CRITICAL FINDING**: `/admin` and `/cliente` — both disallowed in robots.txt — return **HTTP 200** and serve **byte-identical HTML to the homepage** (confirmed via `diff`, both files exactly 21,341 bytes, identical content). This includes `<meta name="robots" content="index, follow">` and `<link rel="canonical" href="https://www.ojonquecortou.com.br/">`. There is no client-side redirect or distinct "admin login" shell being served at the HTTP/prerender level — it's a full SPA-fallback that happens to match the homepage prerender snapshot.
  - Because canonical self-corrects to `/`, duplicate-indexing risk is low IF Google ever crawls these (robots.txt should prevent that for compliant crawlers).
  - However: this reveals the routing layer has no real distinction between "known route" and "unknown route" at the edge/prerender level — see soft-404 finding below, same root cause.
- **Soft-404 confirmed**: A deliberately invalid URL, `https://www.ojonquecortou.com.br/this-page-does-not-exist-xyz123`, returns **HTTP 404** correctly (good — this is NOT a soft-404 in the classic sense, actual 404 status code is returned). However the 404 response body is byte-identical to the homepage HTML (same 21,341 bytes, same canonical tag pointing to `/`, same `index, follow` meta robots). This is a "soft" content mismatch: correct status code, but wrong content/canonical for a 404 page. Recommendation below.
- Uppercase path variant (`/Servicos`) correctly returns a real 404 (not case-folded to a 200), consistent with the wider 404 handling.

## 3. URL structure & redirects
- Domain-variant redirect chains traced via `curl -D -`:
  - `http://ojonquecortou.com.br` → 308 → `https://ojonquecortou.com.br/` → 307 → `https://www.ojonquecortou.com.br/` (200). **2-hop redirect chain.**
  - `http://www.ojonquecortou.com.br` → 308 → `https://www.ojonquecortou.com.br/` (200). 1 hop. Good.
  - `https://ojonquecortou.com.br` (non-www, https) → 307 → `https://www.ojonquecortou.com.br/` (200). 1 hop, but uses **307 (Temporary Redirect)** instead of 301 for a permanent canonical host redirect.
  - `/sobre-o-jon` → 301 → `/sobre` (200). 1 hop, correct status code.
  - `/blog/rotina-basica-cabelo-cacheado-cronograma` → 301 → `/blog/cronograma-capilar-cabelo-cacheado` (200). 1 hop, correct.
- Trailing slash: `/servicos` and `/servicos/` both 200, identical content, no redirect normalizing one to the other (relies on canonical tag only — see above).
- Status sweep (18 URLs: homepage, /servicos, /blog, /agendar, /faq, 3 service subpages, 6 blog posts, /admin, /cliente, domain variants, IndexNow files, 2 known redirects): all in-sitemap URLs returned clean 200s with zero redirect hops. No 404s found within actual sitemap URLs.

## 4. Mobile-friendliness
- Viewport meta present and consistent across all sampled page types: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`
- **Issue**: `user-scalable=no` + `maximum-scale=1.0` disables pinch-to-zoom. This is a known mobile-usability anti-pattern — WCAG 1.4.4 (Resize Text) and Google mobile-friendly guidance both flag disabling zoom as an accessibility issue for low-vision users. Not a ranking penalty by itself today, but worth fixing since it's a one-line change with only upside.
- No tap-target or font-size issues detectable from static CSS inspection (44.8KB CSS bundle, not deeply parsed for computed touch-target sizes — would need rendered/visual check).

## 5. JS rendering dependency
- `render_page.py --mode auto` classified the homepage and the sampled blog post as `is_spa: false`, `mode_used: raw` — the raw HTTP fetch was judged sufficient without invoking Playwright.
- Raw HTML inspection shows the actual mechanism: `<div id="root">` contains a `<noscript>`-wrapped `<article>` with full page copy (H1, paragraphs, service list, NAP, method description) — this is prerendered content built at build time by `prerender.js`, present in raw HTML for any client that does NOT execute JavaScript. Confirmed present and consistent in structure across home, /servicos, and the blog post sample.
- Also inside `#root` (outside the noscript block, so present in the live DOM even for JS-executing clients before hydration replaces it) is a visually-hidden `<nav>` (CSS clip-to-1px technique) containing a full internal link list — every blog post + core nav pages. This is a common SPA crawl-discoverability pattern, not disguised/cloaked content (it matches the real site nav), but it is borderline for "hidden text" scrutiny since it uses the `clip: rect(0,0,0,0)` technique rather than modern `sr-only`-with-focus patterns or a `<template>`. Low risk given content matches genuine navigation, but flagging for awareness.
- `trafilatura`'s `extracted_text` field came back **empty (length 0)** for the blog post render, because trafilatura's boilerplate-stripping treats `<noscript>`-wrapped content as non-primary content and skips it. This is a signal that automated content-extraction tooling (which approximates how some AI-crawler pipelines and reader-mode tools process pages) may see this page as contentless, even though a full browser/Googlebot's Web Rendering Service (which executes JS and evaluates the final hydrated DOM, not the raw noscript wrapper) should have no trouble.
- Forced Playwright render (`--mode always`) **timed out after 15s** on the homepage, with the console log flooding with CSP violation errors from ad/analytics scripts (Cloudflare Insights beacon, Google Ads conversion pixels, Meta CAPI script) being blocked by the page's own Content-Security-Policy `connect-src`/`script-src` allowlist. This is a tooling-timeout data point, not proof of a Googlebot rendering failure (Googlebot's WRS budget differs from this script's 15s default), but it does confirm the CSP is actively blocking several of the site's own configured third-party marketing/analytics scripts (Cloudflare Insights beacon in particular — likely auto-injected by the Cloudflare zone setting "Web Analytics", not by the app), which may cause analytics undercounting. Recommend the dev team check whether GA4/Ads conversion tracking data looks complete, since several conversion-adjacent pixels were CSP-blocked in this trace.

## 6. Core Web Vitals (lab/source estimate — no PageSpeed API key configured)
- JS payload (gzip, via curl Accept-Encoding: gzip): index bundle 9.3KB, vendor 22.4KB, react-vendor 56.6KB, CSS 9.2KB. Total critical-path JS+CSS ≈ 97KB compressed — reasonably lean for a React SPA, low INP/TBT risk from bundle size alone.
- No explicit `width`/`height` attributes or `fetchpriority` hints could be verified on the LCP-candidate hero image because it lives inside the JS-rendered tree (not in the static noscript snapshot) — could not confirm CLS mitigation for the hero image from source alone. Recommend a rendered-DOM (Lighthouse/PSI) pass to confirm actual CLS/LCP numbers; source inspection alone is inconclusive here.
- No `font-display` or `<link rel="preload">` hints found for the Google Fonts (Bricolage Grotesque, Inter, JetBrains Mono) loaded via `fonts.googleapis.com` — fonts are loaded via a render-blocking `<link rel="stylesheet">` in `<head>` with only `preconnect` (no `preload` of the actual font files, no `font-display: swap` parameter on the Google Fonts URL). This is a plausible FOIT/CLS and LCP-delay contributor since text using these fonts likely isn't visible until the stylesheet + font files round-trip completes. Recommend adding `&display=swap` to the Google Fonts URL at minimum.
- Playwright render timeout (see above) prevents a true rendered-page CWV trace from this environment; treat CWV section as directional only.

## 7. HTTP status sweep
All checked: homepage, /servicos, /blog, /agendar, /faq, /servicos/leitura-de-fio, /servicos/transicao-capilar, /servicos/masculino, and blog posts (cronograma-capilar-cabelo-cacheado, curvatura-4c-cabelo-crespo-guia-completo, frizz-em-cabelo-cacheado, leitura-de-fio-metodo-exclusivo-studio-do-jon, wolf-cut-cabelos-cacheados-tendencia) = clean 200, zero redirect hops. No 404s inside the sitemap set. Redirect-chain issues found only on domain-variant entry points (see Section 3) and are not sitemap URLs themselves, but they are common inbound-link/backlink targets (bare domain, http://) so still worth fixing.

## 8. hreflang
- No `hreflang` attributes found anywhere in the sampled homepage, /servicos, or blog post HTML (`grep -o hreflang` returned zero matches across all three).
- Confirmed N/A / no broken hreflang: single-market pt-BR site, no alternate-language versions exist, so absence is correct and expected. No action needed. (Full hreflang validation out of scope per this agent's charter — defer to `seo-hreflang` sub-skill only if multi-language plans emerge.)

## 9. Structured data presence (HTTP-level only, not deep validation)
- JSON-LD blocks present per page type (count of `application/ld+json` occurrences):
  - Homepage: 2 blocks (a static `HairSalon`/`LocalBusiness` block + a `dynamic-page-schema` block with `@graph` containing LocalBusiness + Person + WebSite w/ SearchAction).
  - /servicos: 2 blocks.
  - Blog post sample: 2 blocks.
  - /faq: 2 blocks (likely includes FAQPage schema — not deep-validated here).
  - /agendar: 1 block.
- Per known issue in memory (ojonquecortou-jsonld-two-blocks), home confirmed to carry two schema blocks as expected/by design (edited via prerender.js, not index.html) — consistent with what was found here, not a new bug.
- **New finding**: both JSON-LD blocks' `image`/`logo` fields reference broken image URLs (see Finding below) — this will likely cause Rich Results Test / Merchant validation warnings for missing images, separate from the schema-shape validation another agent covers.

## 10. Broken image assets referenced in SEO-critical metadata (new finding, not in known-issues list)
- `https://www.ojonquecortou.com.br/capa-studio.jpg` → **404 Not Found**. Referenced as: `og:image` meta tag (homepage + confirmed present 3x in /servicos HTML, 2x in blog post HTML — i.e., in both JSON-LD schema blocks' `image` field each occurrence), and Twitter Card fallback image.
- `https://www.ojonquecortou.com.br/logo.png` → **404 Not Found**. Referenced as the `logo` field in the `HairSalon`/`LocalBusiness` JSON-LD, present on every page type sampled.
- Working image alternates that DO exist: `/logo-app.png` (200, used for apple-touch-icon), `/jon-perfil.webp` (200, used as Person schema image).
- Impact: every social share (Facebook, WhatsApp, LinkedIn, Twitter/X) of any page on the site will show a broken/missing preview image. Google's Merchant Listings / Local Business rich result eligibility and Knowledge Panel image sourcing may also be degraded since the primary declared `logo` and `image` fields 404. This is low-effort, high-visibility to fix (either restore the files at those paths or update all references — home meta tags + prerender.js schema template — to point at `/jon-perfil.webp` or a new working hero/logo asset).

---

## Category Score: 76/100

Deductions: soft-404/homepage-fallback for /admin, /cliente and truly-invalid paths (-8), broken og:image + JSON-LD logo/image site-wide (-8), IndexNow key file still missing (-4), 2-hop redirect chain + 307 on bare-domain (-2), disabled pinch-zoom viewport (-1), unoptimized Google Fonts loading / no font-display (-1).
