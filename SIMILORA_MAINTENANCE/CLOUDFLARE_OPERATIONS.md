# Production hosting and approvals — 11 November 2026

Website: https://similora.similora-167bde6ed1.workers.dev
Account & owner access: https://similora.similora-167bde6ed1.workers.dev/account

## Public recovery identity

- Website repository: devil01529/similora-website, main
- Worker: similora
- Cloudflare account ID: 167bde6ed1e730cc23b9075fc2a42eb4
- D1: similora-accounts, ID 2f2ce676-6f9e-419c-ba5c-ccd7a1d6877d
- Schema/source/assets builder: cloudflare/ in the website repository
- GitHub Actions deployment workflow: .github/workflows/cloudflare-deploy.yml
- GitHub Actions secret NAME: CLOUDFLARE_API_TOKEN. Its value must never be committed.
- Existing account IDs, password hashes, owner role and approval states were migrated through signed requests and encrypted export. The import is permanently sealed after success. No sessions or clinical records were uploaded.

## Owner's daily use

Install Similora 2.0.1 or newer. Open Menu → Account & access. Sign in with the existing independent Similora website email/password (not Apper or ChatGPT). Select Stay signed in on a private device. Owner-only account requests appear there: approve, reject, remove access, and delete a revoked/rejected account. Approval applies to both website and the rebuilt APK. Members cannot access owner APIs. No console or copy/paste administration is needed.

A one-time sign-in is necessary after the hosting address changes. Remembered sessions last up to 30 days. Startup/resume still verifies approval; revocation is not bypassed. Clinical data and API keys remain in the Android encrypted vault, keyed by the unchanged account ID. Do not uninstall or clear app data to migrate.

## Automation and cost

Push reviewed website changes to main: Actions tests, prepares the hash-verified clinical bundle, provisions the existing Worker/D1 if needed, applies the additive schema and deploys. The endpoint health check must pass. This needs no repeated credential copying while the token remains valid.

Workers + D1 use free-tier quotas, not a 30-day trial. Dynamic requests, password operations, database reads/writes and storage consume quotas. Protected assets run through the Worker and count toward dynamic limits. Quota exhaustion can pause access; no paid upgrade has been enabled. Provider pricing may change. A live scrypt roundtrip and signup/login checks passed on this deployment without weakening hashes.

APK release upload and retention are automated after preparing a signed release. Private Android/update signing keys are held outside Git, not configured in GitHub Actions. Fully unattended APK signing is not enabled. Keep the private owner signing backup securely; never regenerate the keys.

## Transition and browser cases

The prior Railway service is retained temporarily as a compatibility route for 2.0.0. Its /api routes use Cloudflare as the sole account authority; old local account tables are not the approval authority. Migration export is disabled. New APK 2.0.1 directly uses Cloudflare and does not depend on Railway.

Browser-local cases are tied to the origin. They do not automatically appear at the new address. The old /workspace/ remains available while Railway runs, with Cloudflare approval checks, to access those local cases. Do not clear the browser's old-site data before retaining any needed records. The APK's encrypted vault is unaffected by the origin change.

## Recovery rules

Never recreate the D1 database, clear the migration marker, re-import over live accounts, or replace account IDs. Never publish users, password hashes, tokens, vault files, keystores or migration private keys. Use Cloudflare's private D1 recovery/export tools for account disaster recovery. The one-time migration key is not needed for routine deployment.

## Verification evidence

- Deployment Actions run 42944894037: success, public endpoint ready.
- Live browser check: existing owner login, synthetic signup/pending gate, owner approval, automatic workspace navigation, secure 30-day cookie, member owner-API denial, revocation and deletion. Zero JavaScript errors observed. Synthetic accounts are removed after checks.
- Public asset requests are checked against approval before ASSETS is invoked.
- Source tests cover case policy, standalone authentication, signed migration export, Cloudflare password/import validation and legacy compatibility relay.
