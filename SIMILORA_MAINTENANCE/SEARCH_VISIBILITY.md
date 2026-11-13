# Similora search discovery

Canonical public website: https://similora.similora-167bde6ed1.workers.dev/

The public homepage describes the real web and Android workflow using static HTML, a canonical URL, description, social preview metadata and WebSite/WebPage/SoftwareApplication JSON-LD. It is usable without JavaScript and does not query account data. Public assets remain on the same free Cloudflare domain. No new subscription is needed.

## Private boundaries

Only the homepage is in `/sitemap.xml`. `/robots.txt` disallows account, login, workspace, API and migration routes. Private responses carry `X-Robots-Tag: noindex, nofollow, noarchive`; account HTML also has a noindex meta tag. Authentication and server-side approval still protect clinical assets. Robots directives are discovery controls, not access control.

The homepage accurately distinguishes browser-local clinical content from server-side account/security records. No patient data, user list or owner functions appear on the public page.

## Automated notification

`cloudflare/search-config.json` holds the canonical origin and an intentionally public IndexNow ownership proof key (not an API secret). `cloudflare/search.mjs` serves its matching text file. After deployment, `scripts/submit_search.py` validates live public routes and submits only the canonical homepage to IndexNow when public content changes. Manual workflow dispatch forces resubmission. HTTP 200 or 202 means accepted, not indexed. The workflow summary records the result; failures must be checked rather than interpreted as successful submission.

Google discovers the sitemap through robots.txt. Its former sitemap ping endpoint is deprecated; the general Indexing API is not appropriate for this software homepage. Direct Search Console submission needs an authorized owner account, which is not connected in this environment. Existing verification file `google779fa91694e4480f.html` is preserved, without claiming that this establishes an authorized Search Console session.

Search engines choose whether and when to crawl, index and rank pages. No deployment guarantees appearance for every query, browser or engine. Search engines power browser results; browser-specific registration is unnecessary. Do not add keyword stuffing, fake reviews, private workspace URLs or automatic repeated submissions.

## Validation

Build clinical assets, then run `node tests/test_search.mjs` for public GET/HEAD, canonical/schema, sitemap, robots, ownership proof and DB independence. Existing `node tests/test_cloudflare_worker.mjs` covers authentication, approval/revocation, owner access, cookies and CSRF. Test the public page at mobile and desktop widths without JavaScript. Check production responses after deployment.

References: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap and https://www.indexnow.org/documentation

## Deployment receipt — 2026-11-13

Source commit `13af6e3` deployed successfully via [Cloudflare workflow run 43357677620](https://github.com/devil01529/similora-website/actions/runs/43357677620). IndexNow accepted the canonical homepage with HTTP **202** at 03:15:35 UTC, meaning accepted pending ownership verification, not proof of indexing. Public key retrieval was validated before submission.

Live checks passed for public HTML, canonical metadata, structured data, phone layout, sign-in navigation, GET/HEAD responses, sitemap and robots. Googlebot and Bingbot user-agent requests received HTTP 200. Unauthenticated clinical assets remain HTTP 401 and noindex. Local auth/approval/revocation/CSRF regression tests passed.

Updating the GitHub repository About/homepage field was attempted but the connected integration returned HTTP 403 for repository-settings changes. The README already links to the canonical website, so search discovery does not depend on that optional setting.
