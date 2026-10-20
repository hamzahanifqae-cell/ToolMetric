# ToolMetric

Image tools, everyday calculators, unit converters, and electrical calculators — fast, free, and mostly client-side.

## Stack

- **Web app:** Astro + TypeScript, Tailwind CSS v4, React islands for interactive tools.
- **API service:** Node.js + Fastify + TypeScript, image processing via [Sharp](https://sharp.pixelplumbing.com/).
- **Shared package:** framework-agnostic calculation, validation, and image-operation types used by both.
- No database, no user accounts, no paid APIs or third-party conversion services.

## Monorepo layout

```
apps/
  web/        Astro + React site (all pages, calculators, converters, image UI)
  api/        Fastify API service (server-side image processing with Sharp)
packages/
  shared/     Pure calculation/validation functions + shared image-operation types,
              used by both the browser bundle and the API — unit-tested in isolation.
```

## Requirements

- Node.js 20+ (developed and tested on Node 26).
- npm 10+ (uses npm workspaces — no other package manager is required).

## Install

```bash
npm install
```

This installs dependencies for the root, `apps/web`, `apps/api`, and `packages/shared` in one pass (npm workspaces).

## Configuration

Copy the example env files and adjust as needed:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

- `apps/web/.env` — site name, production domain (`PUBLIC_SITE_URL`), operator contact info (`PUBLIC_OPERATOR_NAME`/`PUBLIC_OPERATOR_EMAIL`), staging indexing policy (`PUBLIC_ROBOTS_POLICY`), AdSense toggle. See [Launch checklist](#launch-checklist). Read consistently by `astro.config.mjs`, `src/config/site.ts`, and `scripts/launch-check.mjs` — all three see the same values, whether set in `.env` or exported directly (e.g. CI secrets).
- `apps/api/.env` — port, CORS origins, upload/concurrency/queue/timeout limits, temp file retention, shutdown deadline.

Neither example file contains secrets — there are none to configure in this initial version (no database, no third-party API keys).

## Commands at a glance

| Purpose | Command | Requires real config? |
|---|---|---|
| Development | `npm run dev` | No |
| Local/staging preview build | `npm run build:local` | No (uses localhost fallback) |
| Release validation | `npm run launch-check` | Yes — fails loudly if not |
| Release build | `npm run build` | Yes — fails loudly if not |

## Develop

Single command to run both services together, with the web dev server proxying `/api/*` to the Fastify service on the same origin:

```bash
npm run dev
```

- Web app: http://localhost:4321
- API service: http://localhost:8787 (proxied under `/api` from the web app; also reachable directly for debugging)

Run them independently if you prefer: `npm run dev:web` / `npm run dev:api`.

## Test

```bash
npm run test
```

Runs the shared package's unit tests (100: calculators, converters, electrical formulas, date math, image-op/encoder validation, production-URL validation, operator-email validation) and the API's tests (58: Sharp-based image processing, upload signature validation, real worker-thread timeout/cancellation/crash handling, bounded concurrency/queue saturation, graceful-shutdown worker termination, and end-to-end Fastify route tests via `app.inject`, including live 503/504 scenarios). 158 tests total as of this writing.

The web app doesn't have a separate browser-level test suite in this initial version; its logic is covered indirectly through the shared package's tests (the same pure functions power both the UI and the API) plus `astro check` for type safety across all `.astro`/`.tsx` files.

## Type check

```bash
npm run typecheck
```

## Production build

```bash
npm run build
```

Builds `packages/shared` first (both other workspaces depend on its compiled output), then `apps/api` (TypeScript → `apps/api/dist`), then `apps/web` (`astro check` + `astro build` → `apps/web/dist`, a static site).

**This is the release build, and it enforces release configuration.** `apps/web`'s build fails — with a nonzero exit code and a clear list of what's wrong — if `PUBLIC_SITE_URL`, `PUBLIC_OPERATOR_NAME`, or `PUBLIC_OPERATOR_EMAIL` are missing or invalid (see validation rules in `apps/web/.env.example`). It never silently substitutes the localhost fallback for a release the way it used to; the check runs inside `astro.config.mjs` itself, so it applies even if you run `astro build` directly instead of through npm. Configuration is read the same way whether it comes from `apps/web/.env` or from variables already exported in your shell/CI.

For a **non-release build** — previewing `dist/` output locally, or any case where you don't yet have real domain/operator info configured — use the separate, explicitly-named:

```bash
npm run build:local
```

This produces a real static build using the `http://localhost:4321` fallback and a safety-net `robots.txt` that disallows all crawling. It is not suitable for a public deployment — don't point a real domain at output from this command.

`npm run dev` (and `astro dev`) are never affected by any of this — local development stays usable with zero configuration either way.

## Production deployment

This is the generic (VPS + nginx) deployment path. **Deploying to cPanel
specifically (e.g. a Node.js Selector / Phusion Passenger host)?** See
[DEPLOY_CPANEL.md](./DEPLOY_CPANEL.md) instead — cPanel's architecture
differs enough (no raw nginx config access, native-binary cross-platform
installs, npm workspaces not natively supported by its UI) that it needs
its own walkthrough.

This generic path ships as two processes behind a single reverse proxy:

1. **Build both:** `npm run build`.
2. **Web app:** `apps/web/dist` is a static site — serve it with any static file server, CDN, or your reverse proxy directly.
3. **API service:** a persistent Node.js process. From `apps/api`, run `node dist/index.js` (after `npm run build -w @toolmetric/api`), under a process manager (systemd, pm2) or in a container. A minimal approach:
   ```bash
   cd apps/api
   npm run build
   NODE_ENV=production PORT=8787 node dist/index.js
   ```
4. **Reverse proxy:** route `/api/*` on your public domain to the API service, and everything else to the static web build, on the **same origin** — this is what lets the browser call `/api/...` without CORS. Example nginx sketch:
   ```nginx
   location /api/ {
     proxy_pass http://127.0.0.1:8787/api/;
     proxy_read_timeout 30s;
   }
   location / {
     root /var/www/toolmetric/apps/web/dist;
     try_files $uri $uri/ /404.html;
   }
   ```
5. **HTTPS:** terminate TLS at the reverse proxy (e.g. nginx + a certificate from your CA of choice); the API service itself speaks plain HTTP behind it. Set `TRUST_PROXY=true` in the API's environment once it's genuinely behind a trusted proxy, so rate limiting sees real client IPs.
6. **Resource limits:** the API enforces its own bounds (see `apps/api/.env.example`): upload byte limit, decoded-pixel limit, output-dimension limit, bounded concurrency (`MAX_CONCURRENT_JOBS`), a bounded wait queue (`MAX_QUEUE_LENGTH`), and per-IP rate limiting. Each image-processing request is bounded from the moment it starts reading the upload — not just during the Sharp call — so concurrent memory use from buffered uploads is capped by the same limits as processing itself. Tune these to your server's actual CPU/memory; also consider OS-level limits (systemd `MemoryMax`, a container memory limit) as a second line of defense.
7. **Enforceable per-job timeouts:** each image operation runs in an isolated Node `worker_threads` worker, not just a same-process `Promise.race`. If a job exceeds `JOB_TIMEOUT_MS` (default 20s), the API calls `worker.terminate()` and **awaits** that termination before freeing its concurrency slot or responding — a slow/hung job can never hold capacity past its timeout, and a client disconnecting mid-request (detected via the response socket closing before completion) cancels its job and frees capacity the same way.
8. **Temporary storage and cleanup:** uploaded files and processing results are held only in memory, inside that isolated worker, for the duration of a single request — nothing is written to disk during normal operation. The buffer and its worker are discarded as soon as the request finishes, fails, times out, or is cancelled. A startup and periodic sweep (`CLEANUP_INTERVAL_MS`, default 5 minutes) of the configured temp directory is still in place purely as a defensive safety net in case a future change ever leaves a stray file there — it is not the normal cleanup mechanism, since there normally is no file to clean up.
9. **Health checks:** `GET /health` (liveness) and `GET /ready` (readiness — reflects whether the processing queue is currently saturated) are available for your load balancer/orchestrator.
10. **Graceful shutdown:** on `SIGINT`/`SIGTERM`, the API stops the cleanup timer, calls `app.close()` (stops accepting new connections, lets in-flight requests finish normally — each of which already awaits its own worker's termination before responding), and as a backstop, force-terminates any still-running worker after `SHUTDOWN_TIMEOUT_MS` (default 10s) so shutdown can't hang on a stuck connection.

## AdSense

**Current state of the code — read this before assuming anything is wired up:** `AdSlot` (`apps/web/src/components/AdSlot.tsx`) is a disabled placeholder that is not currently imported or rendered on any page. Advertising is disabled by default (`PUBLIC_ADSENSE_ENABLED=false`), and even when enabled with a real client ID, the component still renders nothing but an empty, non-interactive placeholder `<div>` — no ad network script is loaded anywhere in this codebase, and no live ad request can happen. Flipping `PUBLIC_ADSENSE_ENABLED` to `true` alone does **not** complete monetization; it is not a "switch ads on" flag, because there is no ad integration behind it yet. Turning this into a real placement later requires writing actual integration code (loading Google's script, real ad units) and placing `<AdSlot />` somewhere in the layout — neither of which exists today.

This section documents what AdSense itself requires, as distinct from this project's own engineering release checks (`npm run launch-check`, covered below). `launch-check` verifies domain/operator configuration; it does not and cannot verify your Google account status, policy compliance, or consent setup.

**Before applying to AdSense, you will need to, outside this codebase:**
- Own/control a real, publicly reachable domain with substantive, original content (this site's tool pages) — already true once `PUBLIC_SITE_URL` is set and deployed.
- Create and verify a Google AdSense account, and complete Google's site-ownership verification for your domain.
- Publish a Privacy Policy that accurately discloses ad-related data collection *once ads are actually enabled* — the current draft at `/privacy` correctly states that advertising is disabled, and must be updated again before you enable it (see "Finalize trust and privacy infrastructure" in this README's history, or just re-read `/privacy` yourself).
- Review AdSense's current Program Policies and Publisher Policies directly on Google's site — they change, and nothing in this repo substitutes for that.

**Before serving *personalized* ads to visitors in the EEA, UK, or Switzerland**, Google requires publishers to use a Google-certified Consent Management Platform (CMP) that integrates with the IAB's Transparency & Consent Framework (TCF) — this has been required for the EEA/UK since January 16, 2024, and for Switzerland since July 31, 2024, with CMPs expected to support TCF v2.3 ahead of the IAB's February 28, 2026 deadline. Google explicitly does **not** check a CMP for full legal compliance with the TCF or applicable privacy law — that responsibility stays with the publisher, not with Google and not with this codebase. A custom, hand-rolled consent banner does not by itself satisfy this requirement; it needs to either be a certified CMP or go through Google's own certification path. This codebase does not implement a consent banner of any kind, certified or otherwise — building and verifying one is separate, future work, not something a config flag can fake. *(Sources: [Google Ad Manager — European regulations messages](https://support.google.com/admanager/answer/10076805), [Google AdSense/AdMob Help — EU User Consent Policy updates](https://support.google.com/adsense/answer/13554020).)*

**Nothing about this tech stack, the number of tools, the amount of content, or passing `npm run launch-check` guarantees AdSense approval or ongoing compliance.** Those are Google's decisions, made against policies this project does not control.

## Launch checklist

Run the automated check first:

```bash
npm run launch-check
```

This is the exact same check `npm run build` enforces (see Production build above) — run it on its own to see what's wrong without attempting a build. It reads your environment (or `apps/web/.env` if present, via the same loading used everywhere else) and exits non-zero if any release blocker remains — safe to wire into CI before a deploy step. It currently checks:

- [ ] **`PUBLIC_SITE_URL`** — must be a well-formed **HTTPS** URL pointing at the site root (no path/query/fragment/credentials), with a registered domain-name hostname — not an IP address of any kind (loopback, private, link-local, or public), not `localhost`, and not a reserved documentation/example domain (`example.com`, `*.test`, `*.invalid`, `*.localhost`, or any subdomain of those). This is syntax validation only — it does not confirm you own the domain, that DNS resolves it, or that HTTPS is actually served there. Until this passes, `robots.txt` deliberately disallows all crawling and every page carries a `noindex` meta tag, as a safety net against indexing the wrong URL.
- [ ] **`PUBLIC_OPERATOR_NAME`** — no business name is invented anywhere in this codebase; the About page explicitly says it's unset until you configure it.
- [ ] **`PUBLIC_OPERATOR_EMAIL`** — must be a syntactically valid address (exactly one `@`, valid local part and domain, no whitespace/control characters) and not an obvious placeholder like `you@example.com`. This, too, is syntax validation only — it does not confirm the mailbox exists or receives mail.

`launch-check` also prints (non-blocking) advisories, e.g. if `PUBLIC_ROBOTS_POLICY=noindex` is set (fine for a staging deploy; remove it for the real public launch) or if AdSense is enabled without a client ID — a missing AdSense client ID is never a release blocker for an ad-free launch.

Separately, resolve before a real public launch (not checked by the script, because they aren't things code can verify):

- [ ] **Legal review** — `/privacy` and `/terms` are factual drafts describing what the code actually does. Read them yourself (or have a lawyer review them) before relying on them; nothing in this codebase has reviewed or approved their content.
- [ ] **Terms of Use governing law/jurisdiction** — left intentionally blank in `/terms`; only the operator can supply this.
- [ ] **Domain/DNS, HTTPS certificate, and reverse proxy** configured per the Production deployment section above.
- [ ] **AdSense account/consent setup** (only if/when you enable advertising) — see the AdSense section above; this is entirely separate from, and not covered by, `launch-check`.
- [ ] **Hosting/bandwidth/domain costs** — no paid conversion APIs are used, but ordinary hosting, bandwidth, and domain costs still apply and aren't covered by this checklist.

### Verdicts

Given everything above, here is what is and isn't actually ready right now, in this repository, unmodified:

1. **Private staging deployment** (e.g. a password-protected or unlisted URL, for your own review): ready today. Set a real HTTPS `PUBLIC_SITE_URL` (and real `PUBLIC_OPERATOR_NAME`/`PUBLIC_OPERATOR_EMAIL` — staging still needs these to pass `npm run build`) for that staging host plus `PUBLIC_ROBOTS_POLICY=noindex`, deploy per the Production deployment section, and run `npm run launch-check` to confirm. If you just want to inspect built output locally with no real config at all, use `npm run build:local` instead — not for deploying anywhere real.
2. **Public, ad-free launch**: ready once you set `PUBLIC_SITE_URL`, `PUBLIC_OPERATOR_NAME`, `PUBLIC_OPERATOR_EMAIL`, get `npm run launch-check` to exit 0, and have actually read `/privacy` and `/terms` yourself as the operator. No code changes are required for this tier — advertising stays off.
3. **Applying to AdSense**: not started. Requires the public launch above to exist first, plus the account creation, domain verification, and updated-privacy-policy-for-ads steps listed in this section — none of which this codebase can do for you.
4. **Live ad serving**: not implemented at all. Requires AdSense approval (tier 3) *and* writing real ad-integration code (there is none today) *and* a verified, Google-certified consent setup if you'll serve personalized ads in the EEA/UK/Switzerland. Do not consider this tier reachable by configuration alone.

## Implemented features (summary)

- 18 working tools across 4 categories (image, everyday calculators, unit converters, electrical calculators) — see `apps/web/src/content/tools.ts` for the registry.
- Image tools default to local, in-browser processing (Canvas/OffscreenCanvas, off the main thread via a Web Worker where supported, with a main-thread fallback) and offer an explicit, separately labelled "upload to server" option backed by the Fastify + Sharp API. Both paths verify the *actual* encoded output format against what was requested — a browser silently falling back to PNG (which both Canvas and OffscreenCanvas do when an encoder isn't supported) is detected and surfaced as a clear error, never relabeled as the requested format.
- All calculators/converters are pure, independently unit-tested functions in `packages/shared`, with explicit handling of zero/negative/invalid inputs, division-by-zero cases, leap-day birthdays, and date/timezone edge cases — see that package's tests for the specific documented behaviors. Percentage change at original=0 is documented as an explicit product convention (reports 0%/"no change" only when the new value is also 0), not a mathematical requirement — 0÷0 is genuinely indeterminate.
- Electrical calculators correctly distinguish DC, single-phase AC, and balanced three-phase AC real-power formulas, label RMS assumptions, and don't conflate resistance with AC impedance.
- The API processes each image job in an isolated `worker_threads` worker so a timeout can actually stop a hung job (`worker.terminate()`, awaited before capacity is released) — not just abandon a reference to it. Request-level concurrency/queue bounds cover upload buffering too, not just the Sharp call; client disconnects and graceful shutdown both terminate in-flight workers rather than leaking them. See `apps/api/tests/workerJob.test.ts` and `imageJobRunner.test.ts` for tests that prove this against real worker threads.
- API enforces upload size/pixel/dimension limits, validates real file signatures (rejecting SVG and spoofed extensions), and rate-limits per IP.
- `npm run launch-check` validates `PUBLIC_SITE_URL` (HTTPS, root path only, no credentials/query/fragment, no IP literal of any kind, not a reserved example/localhost domain) and `PUBLIC_OPERATOR_EMAIL` (real syntax check, not just "is it set" — rejects malformed addresses and obvious placeholders like `you@example.com`), exiting non-zero if a release blocker remains. `npm run build` enforces the identical check itself (inside `astro.config.mjs`), so the standard release build cannot silently fall back to localhost — a separate, explicitly-named `npm run build:local` exists for non-release builds that don't need real config.
- A staging deployment (`PUBLIC_ROBOTS_POLICY=noindex`) produces both a disallow-all `robots.txt` *and* a `noindex` meta tag on every page — not just one or the other.
- No ads, no tracking/analytics, and no third-party conversion services anywhere in this initial version.

## Known limitations

- The web app has no browser-level (e.g. Playwright) test suite yet — see the Test section above for what is actually covered. The encoder-fallback detection logic is unit-tested as a pure function in `packages/shared` (same technique used for every other pure-logic test in this project); the actual Canvas/OffscreenCanvas encoding behavior it guards against has been verified by code review against the published spec, not by running it in a real browser in this session.
- Client-side image processing depends on `createImageBitmap`/`OffscreenCanvas`; very old browsers fall back to a main-thread canvas path, and if that also fails, the explicit server option is the way forward (the app never silently uploads a file after a local failure).
- A client socket disconnecting mid-request is handled via the standard `reply.raw` "close before writableEnded" pattern and is covered by a lower-level `AbortSignal` test; it was not separately verified against a real dropped TCP connection in this session.
- Legal pages (`/privacy`, `/terms`) are drafts describing what the code actually does — read them yourself before relying on them (see Launch checklist).
- `AdSlot` is an unused, disabled placeholder component — it is not imported or rendered on any page yet. See the AdSense section.
- No automated accessibility or Lighthouse CI is configured yet; accessibility was addressed through semantic markup, labels, keyboard operability, and focus styles reviewed manually, not through an automated audit tool.
