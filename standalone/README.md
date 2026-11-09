# Independent single-origin website server

This implementation does not require ChatGPT, Apper sessions or the APK. It serves login, account approval, owner management and clinical assets under one HTTPS origin.

Status: implemented and tested locally; NOT deployed. The existing chatgpt.site address still uses its prior authentication. Do not advertise that URL as migrated.

## Runtime and storage

Node.js 24 with node:sqlite; HTTPS-capable hosting/reverse proxy; persistent disk for the SQLite database and the website's private clinical asset copy. An ephemeral free disk will lose accounts, so it is not a suitable deployment.

Set PUBLIC_ORIGIN to the exact HTTPS website origin, DATABASE_PATH to a persistent SQLite path, CLINICAL_ASSETS to the built website output, and OWNER_EMAIL/OWNER_PASSWORD securely in hosting settings. The initial owner password must have at least 16 characters. No credentials go in Git. Existing owners are never silently overwritten or escalated on later restarts. Run node standalone/server.mjs.

Website credentials are independent; old Apper passwords and grants are not imported automatically. There is no email verification or password-reset service yet. Account recovery, production monitoring and independent security review remain before general rollout. This is not a claim of security certification.

## Behavior

New accounts are members with pending status. Sign-in sets an HttpOnly, Secure, SameSite session cookie. Session tokens are stored only as hashes in SQLite and expire in eight hours. Passwords use salted scrypt hashes. Same-origin JSON checks apply to writes; basic auth throttling is present.

Pending users see approval status. The page polls every five seconds and redirects to /workspace/ after approval. All workspace files, including data and scripts, require server-side approved status. Owners alone can approve, reject or revoke member accounts at /account; revocation blocks subsequent file requests even for existing sessions. Data already downloaded into a browser cannot be retroactively erased.

The clinical Account control returns to /account on the same origin. Legal access remains in Settings. Browser records remain separate from the APK; no automatic synchronization is implemented.

Tests cover registration, pending-data denial, member denial for owner operations, CSRF origin rejection, approval, revocation and logout. A deployed HTTPS login/cookie flow and real-device navigation remain untested.

## Hosting requirement

Connect an independent hosting account supporting Node 24 and persistent disk, then configure the private assets and runtime secrets there. No deployment credentials are currently connected. A custom domain requires ownership/DNS control, or the host can supply a subdomain. GitHub source access alone cannot provision an independent server or domain.
