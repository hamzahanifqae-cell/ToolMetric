# Deploying ToolMetric to cPanel (toolmetric.online)

You have terminal/SSH access to cPanel, so this guide builds and installs
directly on the server via `git clone` — no manual zip/upload bundling
needed. Everything (TypeScript compilation *and* `npm install`, which
resolves Sharp's native binary) runs natively on the actual Linux server,
which is both simpler and more correct than building locally and uploading.

**I have not executed any of this.** I don't have your cPanel/SSH
credentials. Everything below is for you to run in your cPanel terminal
and dashboard. Nothing is deployed, no accounts are connected, and
advertising stays disabled.

## Architecture

- **Web app** (`apps/web`): a static site. Built on the server, then its
  `dist/` output is copied into `public_html/` — served directly by
  Apache, no Node.js app needed for this part.
- **API service** (`apps/api`): a persistent Node.js process, managed by
  cPanel's Node.js Selector (Phusion Passenger), mounted at
  `toolmetric.online/api` so the browser can call `/api/...` same-origin.

## Before you start

- [ ] **DNS**: toolmetric.online must already point at this cPanel
      account (check under cPanel's "Domains" page).
- [ ] Confirm which Node.js versions "Setup Node.js App" offers — pick the
      highest 20.x+ LTS available.
- [ ] Know what's currently in `~/public_html` — the steps below copy
      files into it; if anything's already there that you need, back it
      up first (`cp -r ~/public_html ~/public_html.bak`).

## 1. Clone the repo

In your cPanel terminal:

```bash
cd ~
git clone https://github.com/hamzahanifqae-cell/ToolMetric.git
cd ToolMetric
```

## 2. Create the Node.js app in cPanel (do this before installing)

In cPanel, open **Setup Node.js App** → **Create Application**:

- **Node.js version**: the highest 20.x+ LTS offered.
- **Application mode**: Production.
- **Application root**: `ToolMetric` (the directory you just cloned into).
- **Application URL**: select `toolmetric.online`, path `/api` (so
  `https://toolmetric.online/api/...` routes here; everything else on the
  domain stays static via `public_html`).
- **Application startup file**: `apps/api/dist/index.js` (doesn't exist
  yet — that's fine, you'll build it next).

Click **Create**. On the app's detail page, copy the `source
/home/<user>/nodevenv/ToolMetric/<version>/bin/activate` command shown
there — you need the *exact* path it gives you (it encodes your username
and the Node version you picked).

## 3. Install and build, inside that app's own environment

Back in the terminal — activating this first matters: it makes `npm
install` use the same Node/npm version Passenger will actually run the
app with, so Sharp's native binary matches.

```bash
cd ~/ToolMetric
source /home/<user>/nodevenv/ToolMetric/<version>/bin/activate   # the exact command from step 2

npm install   # installs all three workspaces (shared, api, web) — npm
              # workspaces resolves @toolmetric/shared correctly on its own

PUBLIC_SITE_URL=https://toolmetric.online npm run build
# Operator name/email are optional — add
# PUBLIC_OPERATOR_NAME="..." PUBLIC_OPERATOR_EMAIL="..." to the line above
# only if you decide later you want them published.

deactivate
```

This is the real release build — it fails loudly (and `apps/web/dist`
won't be produced) if `PUBLIC_SITE_URL` is missing or invalid. Confirm it
worked:

```bash
grep -o 'canonical" href="[^"]*"' apps/web/dist/index.html
cat apps/web/dist/robots.txt
```

Expect `https://toolmetric.online/` and `Allow: /` (not a disallow-all
`robots.txt` or a `localhost` URL).

If you'd rather not retype the env vars on every rebuild, create
`apps/web/.env` on the server instead (copy from `apps/web/.env.example`,
fill in `PUBLIC_SITE_URL`) — it's already `.gitignore`d, so `git pull`
later won't touch or overwrite it.

## 4. Deploy the static site

```bash
rm -rf ~/public_html/*          # only if you've confirmed it's safe to clear (step "Before you start")
cp -r ~/ToolMetric/apps/web/dist/* ~/public_html/
```

## 5. Configure the Node.js app's environment variables and start it

Back in cPanel's **Setup Node.js App** page for this app, add **Environment
Variables** (see `apps/api/.env.example` for what each does):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://toolmetric.online` |
| `TRUST_PROXY` | `true` |
| `MAX_CONCURRENT_JOBS` | `2` (lower to `1` if your plan's CPU/RAM is limited) |
| `MAX_QUEUE_LENGTH` | `10` |
| `JOB_TIMEOUT_MS` | `20000` |
| `SHUTDOWN_TIMEOUT_MS` | `10000` |
| `RATE_LIMIT_MAX` | `20` |
| `RATE_LIMIT_WINDOW_MS` | `60000` |
| `LOG_LEVEL` | `info` |

Don't set `PORT`/`HOST` — Passenger manages those. Click **Restart App**.

## 6. Enable HTTPS

cPanel → **SSL/TLS Status** → run **AutoSSL** for `toolmetric.online` (and
`www.toolmetric.online` if used). Wait a few minutes for it to issue.

## 7. Verify

- `https://toolmetric.online/` — homepage loads, nav dropdowns/search work.
- `https://toolmetric.online/api/health` — should return `{"status":"ok"}`.
  **This is the acid test for the `/api` subpath mount** — if it 404s, see
  Troubleshooting below.
- `https://toolmetric.online/tools/image/compressor` — pick an image,
  choose "Upload to our server for processing," confirm it converts and
  offers a download.
- View source on any page — confirm there's **no**
  `<meta name="robots" content="noindex">` tag.
- After you set `PUBLIC_GOOGLE_SITE_VERIFICATION` and rebuild, view source
  on the homepage and confirm `<meta name="google-site-verification">` is
  present, then verify the property in [Search Console](https://search.google.com/search-console)
  and submit `https://toolmetric.online/sitemap-index.xml`. See the README.

## Troubleshooting

**`/api/health` 404s.** Your host's Passenger config isn't passing the
`/api` prefix through. Switch the Node app's Application URL to a
subdomain instead (e.g. `api.toolmetric.online`, created under cPanel's
**Domains** page first), rebuild the web app with
`PUBLIC_API_BASE_URL=https://api.toolmetric.online` added to the build
command in step 3, redo step 4, and re-run AutoSSL for the new subdomain.
The API's CORS is already set up for this via `CORS_ORIGIN` in step 5.

**Sharp fails to load / "Could not load the sharp module."** You likely
ran `npm install` without activating the app's virtual environment first
(step 3) — redo it with the `source .../activate` command first.

**Uploads time out or the app restarts under load.** Lower
`MAX_CONCURRENT_JOBS` to `1`.

**Where are the logs?** The Node.js app's detail page in cPanel links to
its log file.

## Redeploying after a code change

```bash
cd ~/ToolMetric
git pull
source /home/<user>/nodevenv/ToolMetric/<version>/bin/activate
npm install   # only needed if package.json changed
PUBLIC_SITE_URL=https://toolmetric.online npm run build
deactivate
cp -r apps/web/dist/* ~/public_html/
```
Then click **Restart App** in cPanel (only needed if `apps/api` changed —
the web app's static files don't need a restart).

## What's intentionally not covered here

- Legal review of `/privacy` and `/terms` — read them yourself first.
- AdSense setup — advertising stays disabled.
- Any actual execution of these steps, DNS changes, account connections,
  or SSL issuance — all of that is yours to do.
