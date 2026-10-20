# Deploying ToolMetric to cPanel (toolmetric.online)

This is a step-by-step guide for deploying to a cPanel host that has **Setup
Node.js App** (Node.js Selector, usually CloudLinux + Phusion Passenger)
available — confirmed for this deployment.

**I have not executed any of this.** I don't have your cPanel login, FTP
credentials, or SSH access, and haven't been given any to use. Everything
below is for you to run — on your own machine for the build/prepare steps,
and in your cPanel dashboard for the upload/configure steps. Nothing is
deployed, no accounts are connected, and advertising stays disabled.

## Architecture

- **Web app** (`apps/web`): a static site (plain HTML/CSS/JS). Served
  directly by Apache from `public_html/` — no Node.js app needed for this
  part.
- **API service** (`apps/api`): a persistent Node.js process, managed by
  cPanel's Node.js Selector (Phusion Passenger), mounted at
  `toolmetric.online/api` so the browser can call `/api/...` same-origin —
  no CORS configuration needed for the normal path.
- Both are built **locally** (plain TypeScript compilation — no native
  binaries involved, so it's fine to compile on your Mac and run the
  output on Linux). Only the API's `npm install` (which resolves Sharp's
  platform-specific native binary) needs to run **on the server**, via
  cPanel's own "Run NPM Install" button — this guide is structured so you
  never need SSH for that.

## Before you start

- [ ] **DNS**: toolmetric.online's nameservers or A-record must already
      point at this cPanel account/server. Check in cPanel under "Domains"
      — if toolmetric.online isn't listed as an active domain there yet,
      do that first (via your domain registrar's DNS settings or by
      pointing its nameservers at your host) before continuing. DNS
      propagation can take anywhere from minutes to ~48 hours.
- [ ] **Real operator details ready**: a real public operator/business
      name and a real contact email you control. I have not invented
      these for you — you'll supply them in the commands below.
- [ ] Confirm which Node.js versions "Setup Node.js App" offers in your
      cPanel (Node.js Selector page) — pick the highest 20.x or newer LTS
      available. If only something older than 20 is offered, say so before
      deploying; this project targets Node 20+.

## 1. Build everything locally, with your real configuration

From the repo root, on your own machine (replace the email — never commit
or reuse this as a placeholder elsewhere):

```bash
PUBLIC_SITE_URL=https://toolmetric.online \
PUBLIC_OPERATOR_NAME="Your Real Name or Business Name" \
PUBLIC_OPERATOR_EMAIL="you@toolmetric.online" \
npm run build
```

This is the real release build — it fails loudly if any of those three
values is missing or invalid (see `apps/web/.env.example` for the exact
rules). If you'd rather keep these in a file instead of retyping them, copy
`apps/web/.env.example` to `apps/web/.env`, fill in the three values there,
and just run `npm run build` (it reads `.env` automatically) — just don't
commit that file.

Confirm it worked:

```bash
grep -o 'canonical" href="[^"]*"' apps/web/dist/index.html
cat apps/web/dist/robots.txt
```

You should see `https://toolmetric.online/` and `Allow: /` (not
`Disallow: /`) — if you see the localhost fallback or a disallow-all
`robots.txt`, the build didn't pick up real config; stop and fix that
before uploading anything.

## 2. Prepare the API bundle for upload

`apps/api` depends on `@toolmetric/shared`, a workspace-local package (not
published to npm) — this step packages a self-contained, upload-ready copy
without `node_modules`, so Sharp's native binary gets installed **on the
server** (Linux) rather than on your Mac, where it would be the wrong
platform's binary.

```bash
rm -rf deploy-cpanel-api
mkdir -p deploy-cpanel-api/packages/shared deploy-cpanel-api/apps/api

# Trimmed root package.json — just enough for npm workspaces to link
# @toolmetric/shared correctly; doesn't touch your real root package.json.
node -e "
const pkg = require('./package.json');
require('fs').writeFileSync('./deploy-cpanel-api/package.json', JSON.stringify({
  name: pkg.name,
  private: true,
  version: pkg.version,
  workspaces: ['packages/shared', 'apps/api'],
}, null, 2));
"

cp packages/shared/package.json deploy-cpanel-api/packages/shared/package.json
cp -R packages/shared/dist deploy-cpanel-api/packages/shared/dist

cp -R apps/api/dist deploy-cpanel-api/apps/api/dist

# apps/api's package.json, with devDependencies stripped — cPanel's "Run NPM
# Install" button always runs plain `npm install` with no flags, so without
# this it would also install typescript/vitest/tsx on the server for no
# reason. Nothing at runtime needs them (pino-pretty is dev-only too; the
# app only uses it when NODE_ENV=development, which production isn't).
node -e "
const pkg = require('./apps/api/package.json');
delete pkg.devDependencies;
require('fs').writeFileSync('./deploy-cpanel-api/apps/api/package.json', JSON.stringify(pkg, null, 2));
"

cd deploy-cpanel-api && zip -r ../toolmetric-api-deploy.zip . -x ".*" && cd ..
```

You now have `toolmetric-api-deploy.zip` at the repo root — no
`node_modules` inside it; that gets installed on the server in step 4.

## 3. Upload both parts

Via cPanel's **File Manager** (or FTP, if you prefer):

- **Web app**: upload and extract the *contents* of `apps/web/dist/`
  directly into `public_html/` (so `public_html/index.html` exists, not
  `public_html/dist/index.html`).
- **API bundle**: create a folder outside `public_html` — e.g.
  `~/toolmetric-api` — and upload+extract `toolmetric-api-deploy.zip`
  there, so you end up with `~/toolmetric-api/package.json`,
  `~/toolmetric-api/packages/shared/...`, `~/toolmetric-api/apps/api/...`.

(Keeping the API bundle outside `public_html` is deliberate — it's source
code and compiled output, not something that should be directly web-
accessible as static files.)

## 4. Configure the Node.js app in cPanel

In cPanel, open **Setup Node.js App** → **Create Application**:

- **Node.js version**: the highest 20.x+ LTS offered.
- **Application mode**: Production.
- **Application root**: `toolmetric-api` (i.e. `~/toolmetric-api`, matching
  step 3).
- **Application URL**: select `toolmetric.online`, and set the path/URI to
  `/api`. (This is what makes `https://toolmetric.online/api/...` route to
  this app, while everything else on the domain is still served as static
  files from `public_html`.)
- **Application startup file**: `apps/api/dist/index.js`

Click **Create**. On the app's detail page:

1. Click **Run NPM Install**. This runs `npm install` on the server, inside
   this app's own Node environment — it resolves the `@toolmetric/shared`
   workspace link *and* downloads Sharp's Linux binary correctly, since it
   genuinely runs on the Linux server rather than your Mac. This can take
   a minute or two (Sharp's native dependency is sizeable).
2. Add **Environment Variables** (one per row) — see
   `apps/api/.env.example` for what each one does:
   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | `https://toolmetric.online` |
   | `TRUST_PROXY` | `true` |
   | `MAX_CONCURRENT_JOBS` | `2` (lower it to `1` if your plan's CPU/RAM is limited) |
   | `MAX_QUEUE_LENGTH` | `10` |
   | `JOB_TIMEOUT_MS` | `20000` |
   | `SHUTDOWN_TIMEOUT_MS` | `10000` |
   | `RATE_LIMIT_MAX` | `20` |
   | `RATE_LIMIT_WINDOW_MS` | `60000` |
   | `LOG_LEVEL` | `info` |

   Do **not** set `PORT` or `HOST` — Passenger assigns and manages these
   itself; the app already reads `process.env.PORT` with a sensible
   default, so leave whatever cPanel pre-fills (if anything) alone.
3. Click **Restart App**.

## 5. Enable HTTPS

In cPanel, under **SSL/TLS Status** (or **Security** → **SSL/TLS**), run
**AutoSSL** for `toolmetric.online` (and `www.toolmetric.online` if you use
that too). This is free (Let's Encrypt-based) on most cPanel hosts. Wait
for it to issue before testing — usually a few minutes.

## 6. Verify

From a browser (or `curl`), once DNS + SSL are live:

- `https://toolmetric.online/` — homepage loads, nav dropdowns and search
  work.
- `https://toolmetric.online/api/health` — should return `{"status":"ok"}`
  as plain JSON. **This is the acid test for the subpath mount** — if it
  returns a 404 or an Apache error page instead, see Troubleshooting below.
- `https://toolmetric.online/tools/image/compressor` — open it, pick an
  image, choose "Upload to our server for processing," and confirm it
  actually converts and offers a download. This exercises the full
  browser → Apache → Passenger → Fastify → Sharp path.
- `https://toolmetric.online/robots.txt` — should say `Allow: /` with a
  `Sitemap:` line pointing at `https://toolmetric.online/sitemap-index.xml`.
- View source on any page and confirm there's **no**
  `<meta name="robots" content="noindex">` tag — if there is, the build
  didn't pick up the real `PUBLIC_SITE_URL`; redo step 1.

## Troubleshooting

**`/api/health` 404s, but the app shows as running in cPanel.** Your
host's Passenger configuration isn't passing the `/api` prefix through to
the app the way this guide assumes. Switch to a subdomain instead:
1. In "Setup Node.js App," change Application URL to a subdomain, e.g.
   `api.toolmetric.online` (create that subdomain in cPanel's **Domains**
   page first if it doesn't exist), with no path suffix.
2. Rebuild the web app locally with `PUBLIC_API_BASE_URL=https://api.toolmetric.online`
   added to the same build command from step 1, and re-upload
   `apps/web/dist/*` to `public_html/`.
3. The API already has CORS support built in — `CORS_ORIGIN` set to
   `https://toolmetric.online` (step 4) is sufficient; no further API
   changes needed.
4. Re-run AutoSSL to cover the new subdomain too.

**Sharp fails to load / "Could not load the sharp module" in the app's
error log.** The `npm install` in step 4 didn't get a Linux-compatible
binary (rare, but can happen on unusual hosts). If your plan has a
**Terminal** feature in cPanel (or real SSH), open it, `cd
~/toolmetric-api/apps/api` isn't right — instead run, from
`~/toolmetric-api`:
```bash
source /home/<your-cpanel-username>/nodevenv/toolmetric-api/<node-version>/bin/activate
cd ~/toolmetric-api
npm install --omit=dev --platform=linux --arch=x64 --libc=glibc
deactivate
```
(cPanel's Node app page shows the exact `source .../activate` command for
your app — copy it from there rather than guessing the path.) Then restart
the app.

**Image uploads time out or the app restarts under load.** Lower
`MAX_CONCURRENT_JOBS` to `1` — shared hosting CPU allocations are often
much smaller than a dedicated server, and Sharp is CPU-intensive.

**Where are the logs?** The Node.js app's detail page in cPanel links to
its log file (commonly `~/toolmetric-api/logs/` or shown directly on that
page) — check there first for startup errors.

## Redeploying after a code change

Repeat steps 1–3 (rebuild locally, re-zip the API bundle, re-upload both
parts), then on the Node app's page click **Run NPM Install** again only
if `apps/api/package.json`'s dependencies changed, and **Restart App**
either way. The web app's static files just need re-uploading — no restart
needed.

## What's intentionally not covered here

- Legal review of `/privacy` and `/terms` — read them yourself before this
  goes live publicly; nothing in this process reviews them for you.
- AdSense setup — advertising stays disabled; see the README's AdSense
  section before touching that.
- Any actual execution of these steps, DNS changes, account connections,
  or SSL issuance — all of that is yours to do.
