# ToolMetric SEO notes

ToolMetric (https://toolmetric.online/) is a static Astro site of free browser tools. This file records the November 2026 audit, the changes in this repository, and the checks that still need a person in Google Search Console or cPanel. Nothing here was deployed.

These notes do not predict rankings. Search Console queries below are the ones already observed. Other phrases are hypotheses based on what each tool actually does, not on search volume or difficulty.

## What the site offers

Eighteen tools, grouped by task. URLs were left unchanged.

| Task | Page |
| --- | --- |
| Turn a PNG into a JPG | `/tools/image/png-to-jpg/` |
| Turn a JPG or PNG into WebP | `/tools/image/to-webp/` |
| Turn a WebP into a PNG | `/tools/image/webp-to-png/` |
| Turn a WebP into a JPG | `/tools/image/webp-to-jpg/` |
| Compress an image | `/tools/image/compressor/` |
| Resize an image | `/tools/image/resizer/` |
| Percentage, including increase and change | `/tools/calculators/percentage/` |
| Age from a date of birth | `/tools/calculators/age/` |
| Days between two dates | `/tools/calculators/date-difference/` |
| Percent-off discount | `/tools/calculators/discount/` |
| Length (cm, inches, feet, meters, and related units) | `/tools/converters/length/` |
| Area (acres, square feet, square meters, hectares) | `/tools/converters/area/` |
| Mass (kg, lb, g, oz, stone, tonne) | `/tools/converters/mass/` |
| Temperature (Celsius, Fahrenheit, Kelvin) | `/tools/converters/temperature/` |
| Current from Ohm's law, and the other two quantities | `/tools/electrical/ohms-law/` |
| Watts (DC, single-phase, three-phase) | `/tools/electrical/power/` |
| Series and parallel resistance | `/tools/electrical/resistance/` |
| Electricity cost from watts, hours, and a rate the user types | `/tools/electrical/energy-cost/` |

Hub pages: `/`, `/tools/`, `/tools/image/`, `/tools/calculators/`, `/tools/converters/`, `/tools/electrical/`. About, privacy, and terms are indexable supporting pages. Calculators and converters run in the browser. Image tools run in the browser by default, with an explicit server upload. That is what the privacy page says.

## Confirmed before editing

Checked against the live site on 4 November 2026, and against the repository:

- Each tool already has its own URL, title, description, H1, formula or method, and a visible FAQ where a FAQ schema is emitted.
- Canonicals use `https://toolmetric.online` and the trailing-slash form. `/tools/converters/length` returns HTTP 301 to `/tools/converters/length/`.
- `sitemap-0.xml` listed 27 URLs, all HTML pages, with no `lastmod`. `robots.txt` allows `/`, disallows `/api/`, and points at the sitemap.
- `/tools/` already contains the tool links in the server-rendered HTML. Site search filters that list in the browser and does not create `?q=` URLs.
- An unknown path returns HTTP 404. `/404` and `/404/` also return HTTP 404.
- `www.toolmetric.online` returns HTTP 200 with the same pages. Canonicals point at the apex. A 301 is not in the repository because a shipped `.htaccess` can overwrite the Passenger rules that serve `/api`.
- Live `https://toolmetric.online/ads.txt` returned HTTP 200 with the body `Not found`. The homepage HTML did not include the AdSense script. The last production build was made without AdSense enabled, and Astro still wrote that endpoint body into `dist/ads.txt`, which Apache then served as a normal file.

Google Search Central, checked for this audit: [build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [lastmod](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping), and [consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). Google ignores `changefreq` and `priority`. `lastmod` should be omitted when it is not the real content date. A redirect is a stronger duplicate signal than `rel=canonical`. Blocking a URL in `robots.txt` does not remove it from the index.

## Changes in this repository

- Sitemap output is location-only. `changefreq` and `priority` are gone. Non-HTML `.txt` routes and the 404 page stay out. No `lastmod` was added.
- A release build with AdSense disabled deletes `dist/ads.txt` when its body is `Not found`, and prints a warning. Copying `dist/*` will no longer replace a good ads.txt with that placeholder. It also will not create a correct ads.txt unless `PUBLIC_ADSENSE_ENABLED=true` and `PUBLIC_ADSENSE_CLIENT_ID` are set in `apps/web/.env` before the build.
- The keywords meta tag is no longer rendered. The keyword lists remain for on-site search.
- Open Graph and Twitter cards now point at `/og.png` (1200×630), which says “ToolMetric” and “Free calculators, converters, and image tools.”
- Breadcrumbs include Home, and the visible trail matches `BreadcrumbList` JSON-LD on tool pages, category hubs, the tool index, about, privacy, and terms. Those JSON-LD URLs now use the same trailing slash as the canonical and the sitemap.
- The homepage sentence and the current-calculator shortcut now name length, area, and current. The large homepage H1 is still “Free tools. Sorted.” so the existing layout stays intact. The title element carries the descriptive wording.
- Mass and temperature pages gained reference tables taken from the converter code. Length and area pages link to each other. Mass links to length and temperature. The homepage processing section links to the privacy policy.
- The about page and the all-tools description name the same tools the pages actually offer.

No URLs were changed. No new tool pages were added. No ratings, reviews, authors, or statistics were invented.

## Page-to-query map

Search Console, about seven days ending near 2 November 2026: 0 clicks, 60 impressions, 0% CTR, average position 29.2. Queries with impressions, all with 0 clicks:

| Query actually seen | Page that should rank |
| --- | --- |
| current calculator | `/tools/electrical/ohms-law/` |
| length converter | `/tools/converters/length/` |
| area converter, converter area | `/tools/converters/area/` |

Hypotheses from the tool behavior, with no volume attached:

| Likely query | Page |
| --- | --- |
| png to jpg / png to jpeg | `/tools/image/png-to-jpg/` |
| jpg to webp / png to webp | `/tools/image/to-webp/` |
| webp to png | `/tools/image/webp-to-png/` |
| webp to jpg | `/tools/image/webp-to-jpg/` |
| compress image / image compressor | `/tools/image/compressor/` |
| resize image online | `/tools/image/resizer/` |
| percentage calculator | `/tools/calculators/percentage/` |
| age calculator | `/tools/calculators/age/` |
| days between dates | `/tools/calculators/date-difference/` |
| discount calculator / percent off | `/tools/calculators/discount/` |
| kg to lbs / lbs to kg | `/tools/converters/mass/` |
| celsius to fahrenheit | `/tools/converters/temperature/` |
| watts calculator | `/tools/electrical/power/` |
| series parallel resistance | `/tools/electrical/resistance/` |
| electricity cost calculator / kwh calculator | `/tools/electrical/energy-cost/` |

Do not create a second URL for “current calculator.” It already lives on the Ohm's law path. Do not generate a page per unit pair or per keyword variant.

## Remaining issues

1. **www duplicate (manual, cPanel).** Add a permanent redirect from `https://www.toolmetric.online/*` to `https://toolmetric.online/*`. Do this in cPanel → Domains → Redirects, not by copying a new `.htaccess` over the domain document root. Confirm `/api` still responds after the redirect.
2. **AdSense file and script (manual, next build).** On the server, `apps/web/.env` needs `PUBLIC_ADSENSE_ENABLED=true` and `PUBLIC_ADSENSE_CLIENT_ID=ca-pub-4998739298306378` before the next build, if ads should return. After deploy, `https://toolmetric.online/ads.txt` should be the `google.com, pub-4998739298306378, DIRECT, f08c47fec0942fa0` line, and the homepage source should include `adsbygoogle.js`. Until that build, the live file can stay `Not found` because this change stops publishing the placeholder; it does not repair the file already on the server.
3. **Homepage H1.** The visible H1 is a short brand line. Changing it to a long keyword sentence would break the hero type size. Leave it unless the layout is redesigned.
4. **Fonts.** Inter 400, 500, 600, and 700 are self-hosted. Each Latin woff2 is about 24 KB, and the design uses all four weights. They were left as they are. No Core Web Vitals score was measured.
5. **No conversion event.** GA4 only loads the config tag. Completing a calculation is not recorded.
6. **Indexing and performance scores** were not checked in Search Console or Lighthouse for this change, because it is not deployed.

## Manual Search Console steps

Property: `https://toolmetric.online/`. Verification file `googlef5680b860a624f88.html` must stay in the site root.

After the next deploy:

1. Open [Search Console](https://search.google.com/search-console) → Sitemaps. Submit `sitemap-index.xml` again (the field already prefixes the host).
2. Use URL inspection on `/`, `/tools/converters/length/`, `/tools/converters/area/`, `/tools/electrical/ohms-law/`, and `/tools/converters/mass/`. Request indexing only for those URLs after the new HTML is live.
3. In Page indexing, watch for “Duplicate, Google chose different canonical” on the `www` host. That should fall after the 301. “Crawled – currently not indexed” on a tool page is a content/demand signal, not something a sitemap ping fixes.
4. Leave Performance on Web, date range compared with the previous equal-length period. Do not expect the position near 29 to move in the first few days.
5. Settings → Associations, if you want the GA4 property linked. The measurement ID already in the server `.env` is `G-Y976V5STB6`.

## Measurement plan

Compare the same length of time with the previous period (28 days vs the prior 28 days). Also compare the same calendar stretch a year later once a year of data exists, because calculator traffic can move with school terms and year-end. A single week that includes a holiday is not a baseline.

| Signal | Where | What a useful change looks like |
| --- | --- | --- |
| Impressions | Search Console → Performance | More impressions on the three known queries, and impressions appearing for the hypothesis queries on the matching page |
| Clicks and CTR | Same report | CTR rising from 0% once average position is near the first page. Position around 29 explains zero clicks by itself |
| Average position | Same report, per query and per page | Movement for one page, not a blended site average only |
| Indexed pages | Page indexing, and the sitemap discovered-page count | The 27 HTML URLs indexed. Discovered pages can stay 0 right after a successful sitemap fetch |
| Landing page | GA4 → Reports → Engagement → Landing page, filter Session source = google / organic | Organic sessions on the tool URL, not only the homepage |
| Conversion | Not collected yet | A later event could be “result shown” on a calculator or “file downloaded” on an image tool. Add it only together with a privacy-page update. Do not treat ad impressions as the SEO conversion |

Exclude branded queries (`toolmetric`) when judging whether a tool page is earning non-brand clicks.

## Content and promotion backlog

Do these in order. Do not buy links, trade links in bulk, or submit the site to directory lists.

1. Redirect `www` to the apex, then rebuild with AdSense env vars set and confirm `ads.txt`.
2. After four weeks of the new Search Console data, expand only the query that gained impressions and still has a thin explanation. Keep the expansion on the existing URL.
3. One short guide, only if a real question keeps showing up, such as “how to calculate current from voltage and resistance,” linking to the existing current calculator. Do not publish a guide per synonym.
4. Share a specific tool when answering a real question in a forum or community you already participate in. One useful link, not a signature campaign.
5. If a teacher, tradesperson, or documentation site cites a formula you publish, that citation is the kind of mention worth having. Ask only where there is a genuine reason they would link.

## Deploy

Not run from this change. On the server, after pulling, with the Node 22 virtualenv activated and `apps/web/.env` containing the site URL, GA ID, and AdSense values:

```bash
cd ~/ToolMetric
source /home/techshakerco99/nodevenv/ToolMetric/22/bin/activate
cd apps/web
RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 PUBLIC_SITE_URL=https://toolmetric.online npx astro build
cd ~/ToolMetric
deactivate
cp -r apps/web/dist/* ~/public_html/toolmetric.online/
```

Copy into `/home/techshakerco99/public_html/toolmetric.online`, which is the domain document root. Do not use a root `npm run build` on that host (it runs `astro check` and has been killed), and do not copy onto `~/public_html`.

## What was verified locally

On this machine, after the edits:

- `npm test`: 108 shared tests and 59 API tests passed.
- `astro check`: 0 errors, 0 warnings, 0 hints.
- `PUBLIC_SITE_URL=https://toolmetric.online npx astro build` completed. 28 files were generated. `dist/ads.txt` was removed because AdSense is off in this environment. The warning about that was printed.
- Built HTML for the homepage, length, area, mass, temperature, current calculator, and the tool index has a distinct title, description, self-canonical on `https://toolmetric.online`, `index, follow`, and `og:image` pointing at `https://toolmetric.online/og.png`. The keywords meta tag is absent.
- The current-calculator canonical, breadcrumb `item` URLs, `WebApplication` URL, and sitemap location are all `https://toolmetric.online/tools/electrical/ohms-law/`. Every sitemap URL ends with `/`. There are 27 locations, no `lastmod`, `changefreq`, or `priority`, and no 404 or `.txt` URL.
- The FAQ questions in the current-calculator JSON-LD are the same questions in the visible HTML.
- Mass-page figures match `convertMass`: 1 lb = 0.45359237 kg, 1 kg = 2.20462 lb rounded from 2.2046226218487757, 1 oz = 28.349523125 g, 1 stone = 6.35029318 kg, 1 tonne = 1000 kg.
- `404.html` is `noindex, follow` and is not in the sitemap.
- `robots.txt` allows `/`, disallows `/api/`, and lists the sitemap.

This local build did not include the GA4 tag or the AdSense script, because those values are not set in the environment used here. Do not copy this machine's `apps/web/dist` to the server. Build on the server so its `.env` supplies `PUBLIC_GA_MEASUREMENT_ID` and, if ads should return, the AdSense variables.

Not measured: Lighthouse or Core Web Vitals scores, and Search Console indexing after this change. The live site still has the previous deploy until you build and copy it.

## Second pass, 5 November 2026

Page totals supplied without page-filtered queries. Query intent below is a hypothesis except where an earlier site-wide query is named. Titles were left unchanged.

| URL | Evidence | Change |
| --- | --- | --- |
| `/tools/calculators/date-difference/` | 18 impressions, 0 clicks, position 7.72. The calculator counts elapsed days. 1 January 2024 to 31 December 2024 is 365 days, 52 weeks and 1 day, or 0 years, 11 months, 30 days. | The line under the heading now states that rule. The example matches the dates the tool opens with. |
| `/tools/converters/area/` | 13 impressions, position 46.54. No query list for this URL. The converter supports nine units; the old table showed five conversions. | The table now lists every unit and its square-meter factor. The example uses the six-decimal display: 1 m² = 10.76391 ft². |
| `/tools/electrical/power/` | 19 impressions, position 75.21. “Current calculator” is a site-wide query, not confirmed for this URL. `calculatePower` returns watts from voltage and current. It does not solve for current. | The page says current is an input and links to `/tools/electrical/ohms-law/`. The opening example is the DC default, 230 V and 10 A = 2,300 W. |

Checked live on 5 November 2026: each non-slash URL returns 301 to the slash URL, and the slash URL returns 200. Canonicals and the sitemap already use the slash form. No new redirect was added.

## AdSense readiness, 8 November 2026

The site has 18 tools. The tool directory, the 18 tool routes, the navigation, the homepage count, and the sitemap all match. Git history has no deleted tool page, so the earlier figure of 21 was not a set of retired routes. Category pages are separate from that count. Publisher on the About and Contact pages is Hamza Hanif. The brand name remains ToolMetric. The approved public email is hamzahanifadsense@gmail.com, shown as text and a mailto link on Contact and About.

Contact is `/contact/`. There is no form and no success message. Privacy stays at `https://toolmetric.online/privacy/` and is linked from the footer. The policy states that third-party vendors, including Google, use cookies to serve ads based on prior visits, and that Google's advertising cookies allow Google and its partners to use those visits to select ads. The only ad service in the project is Google AdSense. Personalized-ad controls: https://myadcenter.google.com/

The European regulations message "ToolMetric European regulations" was published in AdSense on 8 November 2026 for toolmetric.online, with the privacy policy URL above. Pages that load AdSense also load Google's Funding Choices script for that same publisher. The script uses `ers=2` and, only when the page URL contains Google's test parameters, forwards `fc` and `fctype`. The footer shows "Privacy and cookie settings" only after `googlefc.showRevocationMessage` exists, and the click does nothing when that function is absent. Do not add a second CMP. The privacy page does not load the AdSense script, the Funding Choices script, or the Analytics tag.

Menus, cards, breadcrumbs, and in-content links now use the trailing-slash canonical path. Non-slash addresses still 301.

A fresh visit to the homepage, then "Find your tool", stays on `/tools/` and lists all 18 tools. The age calculator is one of those links. No service worker is registered, and the tools page has no refresh redirect. The unintended jump to the age calculator was not reproduced.
