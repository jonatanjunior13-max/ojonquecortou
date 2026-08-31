# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Production marketing site + booking system + admin CRM for **O Jon Que Cortou / Studio do Jon**, a curly-hair specialist salon in Belo Horizonte, Brazil. React 19 + Vite SPA, Firebase (Auth/Firestore/Storage) as the database, Vercel for hosting + serverless API routes + cron jobs. Public content is in Portuguese (pt-BR); keep new user-facing copy in Portuguese matching the existing tone (see `.agents/AGENTS.md`).

There is also a Capacitor wrapper (`ios/`, `capacitor.config.json`) that loads the deployed site (`https://www.ojonquecortou.com.br`) inside a native shell — it does not have its own JS bundle to edit.

## Commands

```bash
npm run dev       # vite dev server, localhost:5173
npm run build     # vite build -> dist/, then postbuild runs automatically:
                   #   node scripts/generate-merchant-feed.js  (Google Merchant product feed)
                   #   node scripts/prerender.js               (static HTML + SEO meta per route)
npm run preview   # serve the production build locally
npm run lint      # eslint .
npm run index     # node scripts/submit-indexnow.js (manual IndexNow ping)
```

There is no test suite/runner configured in this repo (no `test` script, no test files). Don't invent one unless asked.

`npm run build` is the real correctness check for anything touching routing, SEO meta, or blog/service data — `scripts/prerender.js` reads `dist/index.html` and generates a pre-rendered `index.html` per route (required for Vercel to serve correct `<title>`/meta per URL, since this is a client-rendered SPA). If prerender errors, the build output says so — do not push a build that failed prerender.

## Architecture

### Routing & page structure (`src/App.jsx`)
Single `react-router-dom` tree. Every page is `React.lazy`-loaded. Two layouts:
- **Public site** (`PublicLayout`): `Navbar` + `<Outlet/>` + `Footer` + `WhatsAppButton`, wraps all `/`, `/servicos/*`, `/blog/*`, `/agendar`, etc.
- **Admin app** (`/admin/*`): `AdminLayout` (in `src/components/admin/AdminLayout.jsx`), each child route additionally wrapped in `AdminErrorBoundary`. `/admin` redirects to `/admin/hoje`.
- `/cachos` is a standalone landing page (no Navbar/Footer) for paid social traffic; `PaidSocialRedirector` auto-redirects `/` and `/agendar` to `/cachos` when `utm_source` is `facebook`/`instagram`.

Adding a new public page = add lazy import + `<Route>` in `App.jsx`, plus a matching Vercel rewrite in `vercel.json` if it needs its own pretty URL and pre-rendered HTML (see the `handle: filesystem` block and the per-path rewrites above it — most static pages route through `/index.html` and get their content injected by `scripts/prerender.js`).

### Admin app (`src/pages/admin/`, `src/components/admin/`)
`AdminLayout.jsx` is the data root: it opens Firestore `onSnapshot` listeners for the core collections (bookings, clients, services, products, financial_transactions, settings, coupons, giftcards, packages, client_packages, salon_products) into one `globalData` state object, and passes `{ globalData, setGlobalData, handleAcceptBooking }` down via `useOutletContext()`. Admin pages consume that context rather than fetching their own data.

Admin pages are large, single-file "screens" (`AdminDashboard.jsx`, `AdminMobileApp.jsx`, `AdminFinancial.jsx`, etc. — several are 50k-300k+ chars). This is the existing pattern; don't reflexively split them unless the task is specifically a refactor.

Design system: **Obsidian Bronze**, tokens in `src/styles/admin-tokens.css` (`--adm-*` custom properties, dark theme), scoped to `.admin-app`, imported by `AdminLayout.jsx`. Do **not** reuse the public site's `--ink`/`--surface`/`--accent` vars from `src/index.css` inside admin code — those are light-theme vars and render invisible on the dark admin background. Reusable admin primitives live in `src/components/admin/ui/` (`Card`, `KpiCard`, `Button`, `Badge`, `Input`, `Select`, `Tabs`, `DataTable`, `Modal`, `EmptyState`, `Skeleton`, and the `useToast`/`ToastProvider` toast system — use `useToast()`, not `alert()`).

`AdminLayout.jsx` also runs a `isDemoMode = !db` check; every Firestore write in the admin app branches on demo mode vs real Firebase (`if (isDemoMode || !db) { localStorage... } else { Firebase... }`) so the app is browsable without configured Firebase env vars. Preserve that branch when adding new writes.

### Firebase (`src/config/firebase.js`)
Client SDK init guarded by `isConfigValid` (falls back to "Demo Mode" — `app`/`auth`/`db`/`storage` stay `null` — if `VITE_FIREBASE_*` env vars are missing/placeholder). Two custom helpers exist because the PWA's service worker interferes with the Firestore SDK's normal gRPC/WebChannel transport:
- `fetchCollectionRest(collectionPath, idToken)` / `fetchDocRest(...)` — read Firestore via plain HTTPS REST instead of the SDK.
- `getRefreshedToken()` — force-refreshed ID token, needed because Capacitor iOS can serve a stale cached token.

Auth persistence prefers `indexedDBLocalPersistence`, falling back to `browserLocalPersistence`.

Firestore security rules (`firestore.rules`) intentionally leave several collections world-readable/writable (`bookings`, `settings`, `services`, `products`, `coupons`, `giftcards`, `client_profiles`) because both the public booking flow and unauthenticated Vercel serverless functions need access without a signed-in admin user. `financial_transactions` and `automation_logs` require `request.auth != null`. When adding a new collection, decide deliberately whether public/serverless callers need unauthenticated access — this isn't an oversight, it's load-bearing for the booking flow and the cron/webhook API routes.

### Serverless API (`api/*.js`, deployed as Vercel functions)
Each file is a standalone handler using `req`/`res` (Node/Vercel convention, not Express) and initializes its own Firebase Admin/client SDK instance from `process.env.VITE_FIREBASE_*` (note: same `VITE_`-prefixed var names as the frontend, reused server-side). Notable ones:
- `api/cron.js` — dispatches to `api/_crons/{reminders,automations,daily-digest,blog,indexnow}.js` based on a `?task=` query param; `vercel.json` maps friendly cron paths (`/api/cron-reminders`, etc.) to it and schedules them under `crons` in `vercel.json`.
- `api/gcal.js` / `api/gbp.js` — Google Calendar / Google Business Profile OAuth + sync integrations.
- `api/whatsapp-webhook.js`, `api/mailgun-webhook.js` — inbound webhooks for WhatsApp (Evolution API) and transactional email (Mailgun).
- `api/send-email.js` (64k) / `src/utils/emailTemplate.js` / `src/utils/emailTemplates.js` — transactional + marketing email templates.
- `api/media-proxy.js` — proxies `/api/media/:file` (routed via `vercel.json`).

Routing/headers/redirects/cron schedule for everything above live centrally in **`vercel.json`** — check it before assuming a new API route "just works"; it needs an explicit `routes` entry (and often a redirect entry when a URL is renamed, per the many `301` blocks already there).

### Data files (`src/data/`)
Content — not code — lives here as JS/JSON modules and is imported directly by pages and by the build scripts (`vite.config.js`, `scripts/prerender.js`):
- `posts.js` — blog posts (large; see the blog-publishing workflow below).
- `seedServices.js` / `expandedServiceBodies.js` — service catalog + long-form SEO body content per service.
- `galleryImages.js`, `glossary.json`, `serviceComparison.json`, `blogLinkMap.js`.

### SEO / build pipeline
- `vite.config.js` has an inline `seoLinksPlugin` that injects a visually-hidden nav of all page/blog links into `index.html` for crawlability, plus `VitePWA` config (service worker must `NetworkOnly` all Firebase/Firestore/Auth/Storage hosts — already configured — don't let workbox cache those or the PWA desyncs from Firestore).
- `scripts/prerender.js` post-processes `dist/` after `vite build`, generating per-route `index.html` files with correct `<title>`, meta description, canonical URL, and structured data (schema.org) so each public/blog/service URL is crawlable despite being an SPA.
- `scripts/generate-merchant-feed.js` builds the Google Merchant Center product XML feed from `src/pages`/product data, served at `/products-feed.xml` via `api/products.js`.

## Publishing a blog post

Follow `.agents/workflows/postar-no-blog.md` exactly — skipping a step is a known source of bugs (post disappearing, 404 on the URL, broken cover image). Summary: pick the next sequential `id` in `src/data/posts.js`, generate/copy the cover image to `public/blog-[slug].webp`, add the post object to the **top** of the `posts` array in `src/data/posts.js` with a unique `slug` matching the image filename, run `npm run build` and confirm it logs successful pre-rendering (verify `dist/blog/[slug]/index.html` exists — if the build failed, do not push), then commit and push (Vercel auto-deploys from `git push`; don't run `vercel --prod` manually).

## Conventions

- **Commit messages**: Conventional-commit-style prefixes are the norm (`fix:`, `feat:`, `perf:`, `seo:`, `content:`, `chore:`, `style:`, `docs:`), scoped area in parens when relevant (`fix(admin): ...`). Written in a mix of English and Portuguese — match whichever fits the surrounding history for the area you're touching.
- **Brand voice** for any customer-facing copy (Google Business posts, review replies, CRM/WhatsApp messages) is documented in `.agents/AGENTS.md` — informal, warm Brazilian Portuguese, technical framing around hair health/geometry ("Leitura de Fio" method), no marketing clichés (`"Agradecemos o seu feedback"`, `"cachos perfeitos"`, etc.).
- **Env vars**: `VITE_FIREBASE_*` (see `.env.example`) are used both client-side (via `import.meta.env`) and inside `api/*.js` serverless functions (via `process.env`, same names). Never commit real values — `.env*` is gitignored.
- Repo root is cluttered with one-off debug/migration scripts (`check_*.js`, `clear_*.js`, `search_*.cjs`, `print_*.cjs`, `update_*.cjs`) and generated artifacts (`email_*.html`, `extracted*.html`, opaque UUID-named `.js` dumps, `build_log.txt`, `structure.html`, `layout_info.txt`). These are historical debugging output, not part of the app — don't treat them as reference architecture, and prefer the `scratch/` directory (gitignored) for new throwaway scripts rather than adding more to the root.
- `STATUS.md` / `PENDENCIAS.md` / `ADMIN_REDESIGN_HANDOFF.md` / `GEO-AUDIT-REPORT.md` / `docs/superpowers/specs/*` are point-in-time handoff/status notes from prior work sessions, not living docs — useful for archaeology on *why* something looks the way it does, but don't assume they reflect current `main`.
