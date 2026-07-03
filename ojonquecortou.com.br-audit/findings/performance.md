# Performance / Core Web Vitals Audit — ojonquecortou.com.br
Date: 2026-07-03
Method: Lab measurement only (no PageSpeed/CrUX API key configured on this machine). Lighthouse 13.4.0 (mobile, simulated throttling) via `npx lighthouse`, curl timing, raw HTML inspection, and `render_page.py`/`preload_check.py` from the SEO scripts toolkit.

## Category Score: 32/100

Lighthouse mobile performance score for the homepage was **39/100**. Score is pulled down further for the audit-wide rating because /galeria has a confirmed, more severe LCP/render failure (CSP-blocked media, client-fetched gallery data) than the homepage, and third-party/analytics weight is uniform across all three page types.

## What Works

- **TTFB is excellent everywhere**: 40–186ms across homepage, /galeria, and the blog post (Vercel edge + Cloudflare, `X-Vercel-Cache: HIT`, `Cf-Cache-Status: DYNAMIC` on HTML). Server response time is not a bottleneck.
- **CLS is good on the homepage**: Lighthouse measured 0.024 (well under the 0.1 "good" threshold), score 1.0.
- **Prerendering for SEO crawlers works as designed**: raw HTML (Googlebot-equivalent fetch) contains a full noscript article with real content, headings, NAP, and internal links for the homepage — good for crawlability even though it doesn't help real-user CWV since browsers execute JS.
- **HTTP/2+H3, compression (zstd), security headers (HSTS, CSP present, X-Content-Type-Options) are correctly configured** at the edge.
- **JS bundles are code-split** (react-vendor, icons-vendor, firebase-vendor, index, rolldown-runtime as separate chunks with content-hashed filenames) — the architecture supports caching and incremental loading, it's just not tuned yet.

## Findings

### 1. [CRITICAL] LCP fails badly — homepage measured 8.4s, /galeria likely worse
Lighthouse: `largest-contentful-paint` displayValue "8.4 s", score 0.02 (Poor threshold is >4.0s). Root cause chain, confirmed via raw HTML inspection: the entire homepage is a client-rendered React SPA — `<div id="root">` ships empty from the server except a hidden noscript fallback and visually-hidden nav. The real hero/LCP element cannot paint until: (a) `index-w9mZfY6z.js` + 4 vendor chunks download and parse, (b) React hydrates, (c) whatever hero image/component mounts. No `fetchpriority="high"` or `<link rel="preload">` exists for any LCP candidate (confirmed via `preload_check.py`: `preload_lcp_candidate: false`, `fetchpriority_high: 0`, score 50/100).
**Recommendation**: Identify the actual homepage hero visual and either (a) inline/prerender it as a real `<img>` tag server-side (the prerender.js pipeline already exists for SEO — extend it to emit real hero markup, not just noscript text) with `fetchpriority="high"` and explicit width/height, or (b) at minimum add `<link rel="preload" as="image" fetchpriority="high">` for the hero asset and eliminate JS as a blocking dependency for first paint.

### 2. [CRITICAL] Total Blocking Time 2,820ms — main thread saturated by third-party scripts
Lighthouse TBT score 0.03 (2820ms; "poor" is >600ms), `max-potential-fid` (used here as an interactivity proxy) 740ms, `mainthread-work-breakdown` shows ~16s "Other" + ~4.3s rendering + ~3.8s style/layout + ~3.8s script evaluation over the trace window. `bootup-time` breakdown attributes real scripting cost: react-vendor.js 733ms, gtag.js (AW-666534146) 686ms, gtm.js 611ms, gtag.js (G-BC8WXZKTLL) 481ms, Facebook Pixel signals config script also contributes. This directly threatens INP (this TBT/main-thread pattern is the classic precursor to poor INP on first interactions, e.g., tapping "Agendar").
**Recommendation**: Consolidate analytics — running GTM *and* two separate gtag.js configs (G-BC8WXZKTLL, AW-666534146) *and* Meta Pixel *and* Ahrefs simultaneously is redundant; route conversions through GTM tags instead of hardcoded gtag/fbq snippets to cut duplicate script loads. Defer all analytics/marketing scripts until after `requestIdleCallback` or a user interaction/scroll signal, since none are needed for first paint. Facebook Pixel alone reports 94% unused bytes (see #4).

### 3. [HIGH] Unused JavaScript — 504 KiB of estimated waste, mostly third-party
Lighthouse `unused-javascript` audit: est. savings 504 KiB. Breakdown: `gtag.js` (G-2HCS01RSP2) 184KB total/120KB wasted (65%), Facebook `fbevents.js` 101KB/95KB wasted (94%), `firebase-vendor` bundle 119KB/69KB wasted (58%), `gtag.js` (G-BC8WXZKTLL) 167KB/65KB wasted (39%), `gtm.js` 137KB/57KB wasted (42%), `gtag.js` (AW-666534146) 184KB/57KB wasted (31%). Note there appear to be **two separate GA4 stream IDs** (G-BC8WXZKTLL and G-2HCS01RSP2) loading simultaneously plus an Ads conversion ID — likely a duplicate/legacy tag not cleaned up.
**Recommendation**: Audit GTM container for duplicate GA4 config tags (pick one stream ID); lazy-load `firebase-vendor` only on pages that actually need Firestore/Storage reads (galeria, booking) rather than shipping it globally; confirm Facebook Pixel is not double-loaded (both inline `fbq('init', ...)` calls for two pixel IDs fire on every page load).

### 4. [CRITICAL] /galeria: gallery media blocked by CSP + client-side data fetch waterfall
`render_page.py --mode always` against `/galeria` timed out after 15s (total render attempt 26s) with console errors including: `Loading media from 'https://firebasestorage.googleapis.com/...gallery%2F...mp4' violates ... "default-src 'self'"` — a gallery **video is being hard-blocked by CSP** because no `media-src` directive is set (falls back to `default-src 'self'`, which forbids the Firebase Storage origin). Additionally, raw HTML for `/galeria` contains **zero `<img>` tags** anywhere, including in the noscript fallback — confirming gallery images/video are fetched from Firestore/Storage entirely client-side after JS boot, meaning LCP on this page is gated behind: JS bundle load → hydration → Firestore query → Storage URL resolution → image/video fetch. This is a multi-hop waterfall with no server-rendered fallback, materially worse than the homepage's already-poor 8.4s LCP.
**Recommendation**: (a) Add `media-src 'self' https://firebasestorage.googleapis.com` to the CSP immediately — this is a functional bug, not just a performance one (the video literally cannot play for any visitor). (b) Prerender the first 2-4 gallery images as real `<img>` tags server-side (via prerender.js, same pipeline used for SEO text) with explicit dimensions and `fetchpriority="high"` on the first one, so LCP doesn't depend on a client-side Firestore round-trip. (c) Serve gallery images via a CDN/image-optimization layer (Cloudflare Images, Firebase + `?alt=media` is not resizable) rather than raw Storage URLs to control format/size.

### 5. [HIGH] Hashed static assets cached only 4 hours, not immutable
Checked `Cache-Control` headers directly on production JS/CSS bundles (all have content hashes in filenames, e.g. `index-w9mZfY6z.js`, `react-vendor-DSSGIuTi.js`): all return `Cache-Control: public, max-age=14400, must-revalidate` (4 hours). Since the filename hash changes on every deploy, these assets are safe to cache for a year — the current config forces repeat visitors to re-validate/re-download bundles every 4 hours unnecessarily, adding avoidable latency to every return visit, especially relevant for the 47-post blog's repeat readers.
**Recommendation**: Set `Cache-Control: public, max-age=31536000, immutable` for everything under `/assets/*` (hashed filenames only). Leave HTML at `max-age=0, must-revalidate` as currently configured (correct for HTML).

### 6. [MEDIUM] Render-blocking Google Fonts request, no font-display control at delivery
`<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">` is a synchronous, render-blocking stylesheet request to a third-party origin (two DNS/TLS round trips even with preconnect) loading 3 font families / 5 weights. `display=swap` is set (good — avoids FOIT), but the request itself blocks first paint until the Google Fonts CSS resolves, and network-requests trace shows this CSS fetch completing at ~360ms, after which font files still need to download.
**Recommendation**: Self-host the font files (download woff2, serve from `/assets/` alongside other hashed static assets) to eliminate the extra origin round-trip and gain the same 1-year immutable caching as the JS/CSS bundles. If keeping Google Fonts, at minimum add `<link rel="preload" as="font" crossorigin>` for the two weights actually used above the fold.

### 7. [MEDIUM] Third-party script sprawl: 4 independent analytics/marketing vendors on every page
Confirmed in CSP and network trace: Google Tag Manager, two Google gtag.js configs (GA4 + Google Ads), Meta/Facebook Pixel (two pixel IDs), and Ahrefs Analytics all load on every page including blog posts and galeria — none deferred or consolidated. Combined this is the single largest contributor to TBT (see #2) and unused-JS waste (see #3).
**Recommendation**: Move all non-essential tags into GTM with trigger conditions (e.g., fire only after scroll/engagement or via a consent-gated/idle-loaded trigger), removing the hardcoded inline gtag/fbq snippets from the HTML `<head>`. This alone is expected to be the highest-leverage TBT/INP fix available.

### 8. [INFO] Blog post page weight and TTFB reasonable in isolation
The sampled blog post (`/blog/curvatura-4c-cabelo-crespo-guia-completo`) returned in 185ms total (curl) for the raw HTML document (45KB), consistent with the homepage's fast edge delivery. Full Lighthouse run for this page did not complete within the audit's time budget; given identical head-of-document script/font loading to the homepage (same GTM/gtag/Pixel/Ahrefs/font block confirmed via shared HTML template), it is reasonable to expect a similar LCP/TBT profile to the homepage (Poor) rather than a materially different one — no blog-specific optimization (e.g., hero/featured image) was verified in this pass and should be re-checked with a dedicated Lighthouse run.

## Priority Order (expected impact)
1. Fix CSP `media-src` block on /galeria (functional bug, trivial fix, ships broken content otherwise)
2. Reduce/consolidate third-party scripts + defer off critical path (addresses TBT #2, unused-JS #3, and third-party sprawl #7 together)
3. Prerender real LCP element (hero image on home, first gallery images on /galeria) with fetchpriority=high instead of depending on full JS hydration
4. Fix static asset cache-control to `immutable, max-age=31536000`
5. Self-host fonts / preload critical font weights
