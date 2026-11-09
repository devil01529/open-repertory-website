# Independent single-origin website server

This implementation does not require ChatGPT, Apper sessions or the APK. It serves login, account approval, owner management and clinical assets under one HTTPS origin.

Status: deployed and verified on Railway at https://open-repertory-production.up.railway.app on 2026-11-09. This independent origin replaces the old workflow; the old chatgpt.site address retains its original authentication. See docs/WEBSITE_OWNER_GUIDE.md for first owner sign-in.

## Runtime and storage

Node.js 24 with node:sqlite; HTTPS-capable hosting/reverse proxy; persistent disk for the SQLite database and the website's private clinical asset copy. An ephemeral free disk will lose accounts, so it is not a suitable deployment.

Set PUBLIC_ORIGIN to the exact HTTPS website origin, DATABASE_PATH to a persistent SQLite path, CLINICAL_ASSETS to the built website output, and OWNER_EMAIL/OWNER_PASSWORD securely in hosting settings. The initial owner password must have at least 16 characters. No credentials go in Git. Existing owners are never silently overwritten or escalated on later restarts. Run node standalone/server.mjs.

Website credentials are independent; old Apper passwords and grants are not imported automatically. Self-service password changes and owner approval/revocation/deletion are available. There is no email verification or automated forgotten-password reset service yet. Broader monitoring, recovery drills and independent security review remain future work. This is not a claim of security certification.

## Behavior

New accounts are members with pending status. Sign-in sets an HttpOnly, Secure, SameSite session cookie. Session tokens are stored only as hashes in SQLite and expire in eight hours by default, or 30 days when the user explicitly chooses “Stay signed in” on a private device. Approval and revocation are checked on every protected request, regardless of cookie lifetime. Passwords use salted scrypt hashes. Same-origin JSON checks apply to writes; basic auth throttling is present.

Pending users see approval status. The page polls every five seconds and redirects to /workspace/ after approval. All workspace files, including data and scripts, require server-side approved status. Owners alone can approve, reject or revoke member accounts at /account; revocation blocks subsequent file requests even for existing sessions. Data already downloaded into a browser cannot be retroactively erased.

The clinical Account control returns to /account on the same origin. Legal access remains in Settings. Browser records remain separate from the APK; no automatic synchronization is implemented.

Tests cover registration, pending-data denial, member denial for owner operations, CSRF origin rejection, approval, revocation and logout. Live HTTPS browser checks passed for owner/member approval, redirect, cookie flags, session persistence, protected content, revocation, deletion and clinical navigation. Real physical-device testing and full clinical-function certification remain outside that check.

## Hosting requirement

Railway is connected. The service uses its supplied HTTPS domain and a persistent 500 MB volume mounted at /data. Clinical files were transferred through a token-protected, checksum-pinned, one-time installer; the endpoint is disabled and upload variables cleared. No paid upgrade or purchased domain was added. Current Railway plan/trial limits still apply.

## Release gate

See `docs/REQUIREMENTS_AND_ROLLOUT.md` for the agreed scope and unresolved production gates. Cases use account-specific browser storage and do not import legacy patient records. This is UI/account separation, not local encryption or protection against someone controlling the browser profile. Do not claim browser records have Android Keystore encryption.

## Initials-only website mode

The website now adapts the private APK asset snapshot at delivery time. It disables patient, visit, legacy recovery/import and patient backup modules, removes patient entry/navigation, supplies an initials-only Today form and retains repertory/analysis/library functions. The account's case store uses a fresh local-browser namespace; old patient stores remain untouched and are not imported. Five cases are retained per account per browser, with explicit confirmation before the oldest is replaced by a new case or restored snapshot. There is no cross-device case synchronization or claim of encrypted local storage. Someone controlling the browser profile can inspect its local data.

Run `node tests/test_case_policy.mjs` and `node tests/test_standalone.mjs`. Real-asset browser checks additionally need the private `dist` snapshot. Normally runtime requires `CLINICAL_ASSETS/index.html`. During a configured first-time private transfer, only health and the authenticated installer run; login returns 503 until verified assets are installed. The installer cannot overwrite an existing clinical directory.
