# Independent website deployment — 2026-11-09

Live URL: https://open-repertory-production.up.railway.app
Account management: https://open-repertory-production.up.railway.app/account
Owner guide: ../docs/WEBSITE_OWNER_GUIDE.md

Railway project: e8796254-9b10-41db-a2e6-b3118d21b302
Production environment: d647bce3-eb0e-4921-94b6-22ec8ccf18d2
Service: 59d41cf3-ecf2-4dc6-a7f0-b6acae24148e
Verified code deployment: 1302ecb1-b8ce-44ec-a214-355f5e5a552c, SUCCESS, commit ed39bde6a473e2e9c135596f2ccfe080400ee1a2.

The website runs on Node 24 with SQLite accounts and private clinical assets on its persistent 500 MB volume. Accounts and assets survived redeployment. A verified private archive supplied the data; no raw clinical dataset or credential was pushed to public GitHub. The one-time transfer endpoint is disabled and its credentials removed from service configuration.

Live Chromium checks passed: independent HTTPS login, registration/request visibility, owner approval, automatic member entry, Secure/HttpOnly/SameSite cookie and 30-day opt-in lifetime, member denial of owner APIs, initials form, repertory/library/analysis navigation, reduced-motion mode, revocation redirect and account deletion. Synthetic test accounts were removed. No JavaScript errors remained and no requests to ChatGPT or Apper occurred in these flows. A layout-observer error during revocation was found and fixed before this final pass.

Local unit/API/browser tests additionally cover the five-case limit, cancellation before oldest replacement, reload persistence, invalid initials, patient-write denial, password changes, CSRF and the private installer. GitHub source checks passed for the deployment's preceding tested source changes; later documentation commits do not alter runtime code.

Limits: browser cases are local, account-separated and not encrypted; no cross-device synchronization or remote erasure. No email verification or automated forgotten-password reset. Physical-device testing, comprehensive clinical regression, backup recovery drills and external security review remain future work. No paid plan upgrade or domain purchase was made; Railway plan/trial/usage limits still apply. Source is connected to main, but automatic push-triggered deploys were not independently verified—check commit and deployment SUCCESS after changes.

The prior ChatGPT-hosted site and Apper request prototype are historical and do not grant access to this domain. They were not made public or altered as part of this cutover. APK signing, releases and data audits remain separate.
