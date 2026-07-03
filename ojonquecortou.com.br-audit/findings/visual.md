# Visual + Mobile Rendering Audit — ojonquecortou.com.br
Date: 2026-07-03
Tool: Playwright (Chromium), custom capture script (networkidle failed due to persistent
analytics/CSP-blocked connections; switched to `load` + 1.5-3s settle wait)

## Pages audited
- Homepage: https://www.ojonquecortou.com.br (desktop 1440x900, mobile 390x844) — captured
- /servicos (desktop, mobile) — captured
- /agendar (desktop, mobile) — captured
- /blog/cronograma-capilar-cabelo-cacheado (desktop, mobile) — captured

All 4 pages x 2 viewports = 8/8 captures succeeded on the second attempt (first attempt timed
out entirely on `networkidle` because the page never goes network-idle — GTM/GA/Meta/Google Ads
tags fire continuously and several are blocked by the site's own CSP, generating a long tail of
failed background requests. This does not affect real users' visual rendering, only the
`networkidle` heuristic used by automation.)

## Screenshots saved
Location: `C:\Users\jonat\.gemini\antigravity\scratch\ojonquecortou\ojonquecortou.com.br-audit\screenshots\`

- home-desktop.png, home-desktop-full.png
- home-mobile.png, home-mobile-full.png, home-mobile-blogsection.png (attempted scroll-to-section shot, imprecise)
- servicos-desktop.png, servicos-desktop-full.png
- servicos-mobile.png, servicos-mobile-full.png
- agendar-desktop.png, agendar-desktop-full.png
- agendar-mobile.png, agendar-mobile-full.png
- blog-cronograma-capilar-desktop.png, blog-cronograma-capilar-desktop-full.png
- blog-cronograma-capilar-mobile.png, blog-cronograma-capilar-mobile-full.png

Raw instrumentation data (DOM queries for tap targets, font sizes, broken images, fold
visibility) saved to: `C:\Users\jonat\.gemini\antigravity\scratch\ojonquecortou\ojonquecortou.com.br-audit\audit_data.json`

## Above-the-fold analysis — mobile homepage (390x844)
Confirmed via home-mobile.png and DOM measurement:
- Salon name "O JON QUE CORTOU" + sticky "AGENDAR" pill button: visible in header, top: 16-60px.
- Location line "STUDIO DO JON · CAIÇARAS · BELO HORIZONTE": visible.
- H1 "Especialista em Cabelo Cacheado em Belo Horizonte.": visible, top 168-288px.
- Value prop paragraph: visible below H1.
- Primary CTA "AGENDAR CORTE E AVALIAÇÃO" (pink pill): visible at top 442-486px, well within the
  844px viewport.
- No hero photo pushes content down on mobile (the desktop hero photo of Jon is not shown in the
  same position on mobile — text-first layout keeps CTA high).
- No overlapping text or cut-off elements observed above the fold.
- Result: value proposition, salon name, and booking CTA are all visible without scrolling. This
  is a genuine strength.

## Tap target sizing
Threshold used: 44x44px (Apple HIG minimum; WCAG 2.5.5 recommends 44px, AA baseline is lower but
44px is the practical UX standard).

- Homepage mobile: only 1 sub-44px target detected — the "O JON QUE CORTOU" logo/wordmark link
  (153x30px). Low risk since it's a single non-critical link (goes home) and has generous
  horizontal width.
- /servicos mobile: the category filter pills (TODOS/ANÁLISE/MISTO/CORTE/COR/TRATAMENTO/COMBO)
  are 43px tall — 1px under the 44px threshold, essentially fine in practice, well spaced
  horizontally. The "Ver mais ▼" expand link is 73x29px — genuinely small and could be a
  mis-tap risk given the surrounding block of body text.
- /agendar mobile (the priority conversion flow): the "← Início" back link is 52x21px — small,
  though non-critical. More importantly, **every** service card's "Ver descrição completa ▼"
  toggle is 151x23px — well under the 44px height guideline. These sit directly above the
  "+ Adicionar" primary action buttons, so a mis-tap opens/closes a description instead of
  progressing the booking. Screenshot `agendar-mobile.png` also shows the "+ Adicionar" button on
  the first visible card visually clipped/overlapped by the fixed WhatsApp bubble in the bottom
  right corner — the button reads "+ Adiciona[r]" with the last character occluded, and the
  bubble sits directly on top of the tap area, which is a functional risk (tapping there may hit
  the WhatsApp widget instead of "Adicionar").
- Blog post mobile: sticky footer bar "Agende seu corte com o Jon / AGENDAR" (visible in
  blog-cronograma-capilar-mobile.png) also sits adjacent to/behind the WhatsApp bubble in the
  bottom-right — same overlap pattern as /agendar.

## Text readability
- Font-size sampling (computed styles) on mobile shows body copy mostly at 14.5-16px, with
  smaller UI labels at 10.5-13px (badges, meta text, category tags). No 8-9px body copy was
  found in primary reading content; the smallest sizes (8px, 9.5px) appear to be a single
  incidental element each (likely a decorative/utility class), not paragraph text.
- Contrast: dark theme (near-black background, white/light-gray text, pink #ec... accent) reads
  cleanly in screenshots; no low-contrast gray-on-black body text was visually observed on the
  captured pages.
- One inconsistency: on /agendar (both viewports), the page header renders "Studio do Jon" in a
  serif typeface while the rest of the site (nav, homepage, blog) uses a sans-serif/mono display
  font. This looks like an unintended font-family mismatch on this one page/component rather
  than a deliberate brand choice — worth a design QA pass, not a functional bug.

## Layout / broken images / CLS-type issues
- Horizontal scroll check: `scrollWidth === clientWidth` on every page/viewport tested (no
  horizontal overflow on either 1440px or 390px viewports).
- Broken images: DOM instrumentation flagged 3 `<img>` elements on the homepage (both desktop and
  mobile) as not-loaded (`complete: false`, `naturalWidth: 0`) after a 1.5-3s settle wait:
  `blog-leitura-fio-capa.webp`, `blog-por-que-saloes-falham-cabelo-texturizado.png`, and
  `blog-frizz-em-cabelo-cacheado.webp`. These are the "related articles" blog card thumbnails,
  located deep in the page (~y=7700-8950px on mobile, roughly the "AGENDAR MEU HORÁRIO" /
  blog-teaser section). Follow-up: a direct `curl -I` to all three URLs returned HTTP 200 with
  correct content-type and non-trivial file sizes, so the files themselves are NOT missing/404.
  The most likely explanation is a lazy-loading/intersection-observer implementation that hadn't
  fired for these specific images within the wait window, or a slow-resolving image component.
  This should still be verified manually by a human scrolling to that section, since it's the
  kind of thing that can also indicate a flaky lazy-load trigger for real users on slower
  connections. I was not able to get a clean cropped screenshot of this exact section before
  wrapping up — see home-mobile-full.png (full page, very tall/low-res when scaled) for a rough
  reference.
- /servicos and /agendar and the blog post showed zero broken images.
- No obvious overlapping-element or cut-off-text issues observed in the captured above-the-fold
  or full-page screenshots, aside from the WhatsApp-bubble/CTA overlap noted above.
- CLS: not measured with a real performance trace (no CDP Layout Instability API sampling was
  wired up in this run) — this is a gap, not a "no issues found" result. Recommend a follow-up
  Lighthouse/PageSpeed Insights pass for real CLS numbers.

## Not completed / gaps
- No true CLS metric (layout-shift score) was captured — only a static horizontal-scroll check.
- Tablet (768x1024) and laptop (1366x768) viewports were not tested (out of scope per task, but
  noting for completeness).
- The booking flow was only captured at step "1. Serviço" (service selection) — steps 2 (Horário)
  and 3 (Seus Dados) were not walked through/screenshotted due to time constraints.
- No interaction testing (actually tapping small targets to confirm mis-tap behavior) — sizing
  assessment is based on computed bounding boxes only.
- The precise blog-card broken-image crop was not obtained (coordinator directed wrap-up before
  this was refined); only full-page and computed-position evidence is available.
