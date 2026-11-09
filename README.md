# Similora website

Independent website project for the approved Clinical Glass design.

Website code, tests, design assets and future hosting configuration belong exclusively in this repository. APK releases, signing, Android source, repertory audits and their checkpoints remain outside this project. Audits are paused at the owner's request.

## Current state

- Approved Glass design and desktop adaptation.
- Website-owned local copy of the complete clinical web assets and data, isolated under ignored .private/clinical-assets.
- Repeatable local build into ignored dist, with SHA-256 checks on every clinical data file.
- Design interaction and build-preservation tests.
- Live owner-private website: https://open-repertory-clinical.pastelsiren16.chatgpt.site
- Hosting publication succeeded for commit 96c5c9c1caece5927474c4b0faff3ce05862dcb3. Hosting sign-in is separate from Apper.
- Hosting enforces owner-private access. Apper member browser approval remains under implementation; sharing is not enabled for other users. The source dist directory is not suitable for public unauthenticated static hosting.
- Existing Apper accounts are intended to provide identity continuity with the APK. Website patient records, browser settings and data changes are separate; no automatic app/website record synchronization is implemented.
- Owner-only controls must use authenticated server-side role enforcement. No owner menu for ordinary members. Neutral provider display labels retain required legal credits.

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
