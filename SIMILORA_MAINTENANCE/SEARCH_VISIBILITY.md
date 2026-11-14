# Similora search discovery

Canonical public website: https://similora.similora-167bde6ed1.workers.dev/

The public homepage describes the real web and Android workflow using static HTML, a canonical URL, description, social preview metadata and WebSite/WebPage/SoftwareApplication JSON-LD. It is usable without JavaScript and does not query account data. Public assets remain on the same free Cloudflare domain. No new subscription is needed.

## Private boundaries

Only the homepage is in `/sitemap.xml`. `/robots.txt` disallows account, login, workspace, API and migration routes. Public CSS, logos, robots, sitemap, verification proof and Atom feed do not inherit private noindex/nofollow headers. Private responses carry `X-Robots-Tag: noindex, nofollow, noarchive`; account HTML also has a noindex meta tag. Authentication and server-side approval still protect clinical assets. Robots directives are discovery controls, not access control.

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

## Follow-up — 2026-11-14

Public search queries did not return this site at inspection time. Live HTTPS requests confirmed the public homepage responds 200 with index/follow, static content and correct canonical URL; private clinical files remain 401/noindex. This does not establish Google’s internal indexing status or a rejection reason. No Search Console account/session/API connection is available, so URL Inspection and a direct Google indexing request cannot be claimed.

Removed inherited noindex/nofollow headers from public supporting assets and discovery files. Their earlier headers were unnecessary; they were not proof that the homepage itself was blocked. Added `/updates.atom`, linked from the homepage, containing only the canonical public homepage. Its modification timestamp comes from the latest relevant Git commit, not build time. Checkout retains history for a stable timestamp on unrelated deployments.

The deployment notification script now validates all discovery resources and separately notifies both IndexNow and Google’s public WebSub hub. Results are recorded independently, and either failure remains visible. Hub acceptance is not a Search Console submission or a promise that Google Search subscribes to or indexes the feed. Do not repeatedly submit unchanged pages.

Google’s documentation notes that new sites commonly take days to weeks and inclusion is not guaranteed: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl . Its supported sitemap guidance describes WebSub for Atom/RSS updates: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap . Hub protocol: https://pubsubhubbub.appspot.com/ .

### Follow-up deployment receipt

Commit `1aa35d5` deployed successfully in [run 43575267862](https://github.com/devil01529/similora-website/actions/runs/43575267862). At 2026-11-14 08:19:52 UTC, IndexNow returned **200**, and Google WebSub hub returned **204**. Live GET and HEAD checks passed for homepage, CSS, sitemap, robots, feed and proof file; private clinical GET remained 401/noindex. Login remains noindex.

Hub debug showed the notification time but `Last successful fetch: n/a` immediately after deployment. Thus only notification acceptance is established, not a feed fetch or Google Search indexing. Search query `site:similora.similora-167bde6ed1.workers.dev/` returned no results at inspection time. Owner-authenticated Search Console URL Inspection is the remaining way to obtain Google's internal status and request indexing directly.
