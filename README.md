# Similora website

Independent website project for the approved Clinical Glass design.

Website code, tests, design assets and future hosting configuration belong exclusively in this repository. APK releases, signing, Android source, repertory audits and their checkpoints remain outside this project. Audits are paused at the owner's request.

## Current production

- Website: **https://similora.similora-167bde6ed1.workers.dev**
- Account and owner approvals: `/account` on the same domain. No ChatGPT or Apper account is required.
- Cloudflare Workers + D1 on free-tier quotas. The approved glass UI, protected clinical assets and initials-only browser-local case policy are retained.
- Existing independent website accounts were migrated with the same IDs, password hashes and approval states. Similora APK 2.0.1 uses the same approval service.
- Owner APIs enforce role and approval server-side. Members cannot list or approve accounts. Clinical records are not stored in D1; account/security records are.
- Website deployment is automatic on reviewed main-branch source changes using `.github/workflows/cloudflare-deploy.yml`. The required token is an Actions secret, never a repository file.
- See [operations and recovery](SIMILORA_MAINTENANCE/CLOUDFLARE_OPERATIONS.md) for exact resource IDs, limits and migration details.
- The prior Railway service is a temporary compatibility route for APK 2.0.0 and old-origin browser cases. It is not the account authority. New deployments are pinned to Cloudflare.

The local clinical copy is a deliberate import snapshot. It is not a shared folder or a live link to Android development files. Editing the website copy does not modify the APK. Clinical datasets are not uploaded to this public repository.

## Build

Python 3:

    python scripts/build_clinical_website.py .private/clinical-assets dist

The output directory must not already exist. Clinical inputs must be restored securely on a new machine; they are not reconstructed from this public Git repository alone. Production data hosting/access control is a separate deployment step.

## Tests

    python tests/test_website_build.py
    node --check designs/app.js
    node tests/test_website_samples.js

The design test uses a DOM harness, not browser rendering. No login credentials or live grants are used.

## Project boundaries

Only this repository receives future website work. Do not write website changes to the APK update repository. Do not put Android signing keys, patient records, passwords or audit dumps here. Backend changes needed for the website must preserve the existing Android login/approval contract and be tracked as an explicit integration change.

No deployment automation is enabled. Committing website source does not publish a website.
