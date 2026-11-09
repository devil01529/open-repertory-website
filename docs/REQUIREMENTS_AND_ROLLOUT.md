# Open Repertory: agreed requirements and implementation plan

Reviewed 2026-11-09 against the conversation and current website source. This is a consolidated specification, not a claim that every earlier request has been completed. New explicit user instructions take precedence. The active task is the independent website; data audits remain paused.

## Latest user change: initials-only website

This overrides earlier requests to migrate patient profiles to the website. Provide only initials (1–4 letters), symptom totality, remedy considered, rubric selection and analysis. No patient profiles, contact fields, patient linkage or legacy patient-record import. Keep up to five cases per signed-in account **in each browser**; a sixth creation or snapshot restoration requires confirmation to delete the oldest created case, including its snapshots and notes. Cancellation keeps all five. No cross-device case synchronization is implemented.

Implementation now uses website-only asset adapters, a fresh per-account browser-storage namespace and a case policy checked on writes. Legacy local records are not silently imported or erased. Accounts/approval remain in the server SQLite database; clinical cases are browser-local. Initials and free text are still potentially identifying: do not call this anonymous or encrypted patient storage. Local browser access/developer tools can read local storage; account separation in the application is not protection against another person controlling the same browser profile. No server account-management endpoint exposes clinical cases.

Local Chromium checks passed for login-to-workspace redirect, absent patient input, case form save, cancellation and confirmed oldest replacement, reload persistence, repertory and library navigation. Unit/API tests cover the case limit, invalid initials, patient-write denial, session gates, per-account bootstrap identifiers, owner permissions and revocation. Independent Railway hosting is now live; see website/HOSTING_STATUS.md and docs/WEBSITE_OWNER_GUIDE.md for verified status and operation.

## Architecture decision

Use the existing standalone Node 24 application to serve account pages, approval APIs and the clinical workspace from one HTTPS origin. Railway is one possible host, not a dependency. Any host must support a persistent volume, secure environment variables, backups and HTTPS. A provider subdomain is acceptable. No paid resource is authorized by this document and perpetual free hosting is not promised.

Do not make the existing private ChatGPT-hosted site public to bypass its login. Its hosting identity cannot be treated as an application approval. Do not redirect approved members to that site. Apper's approval does not create a session in this standalone application. The website's owner must have its own authenticated role, and the transition from existing Apper accounts requires an explicit account migration or invitation process. Passwords cannot simply be copied or assumed identical.

## Requirements retained from the conversation

| Area | Required behavior | Current implementation / remaining work |
| --- | --- | --- |
| Project separation | Website in devil01529/open-repertory-website; APK project, signing and releases stay separate | Separate source and private asset snapshot exist; no APK changes in this work |
| Public entry | One website URL; no ChatGPT subscription or login, APK installation or Apper dashboard required | Standalone application implemented locally; independent deployment pending |
| Accounts | Member signup creates a pending request visible to owner; approved members enter workspace automatically | Server endpoints and five-second pending-page polling implemented; deployed browser verification pending |
| Owner management | Account & access inside website; approve, reject and revoke there; no owner controls or APIs available to members | Role enforced server-side; local integration tests cover member denial and owner decisions |
| Sessions | Avoid daily login; clear short loading state; explicit sign-out; revocation must still work | Optional 30-day session added, eight-hour default. Device-lock behavior from APK does not automatically translate to browsers |
| Clinical content | Carry over verified website-owned copy of APK data, grades, hierarchy, references and chapter artwork | Build preserves 580 data files with hash inventory. This verifies migration bytes, not printed-book proofreading |
| Provider branding | Keep Kent, Boericke and other book names; neutral Open Repertory source labels in routine UI | Retain provenance and required legal notices centrally; do not erase source evidence or claim ownership of third-party works |
| Glass UI | Approved glass design, readable grades, compact spacing, smooth navigation, usable mobile and desktop | Existing website overlays retained; production device/contrast/keyboard testing remains |
| Repertory workflow | Illustrated chapters; scrollable drawer header; close drawer on chapter selection; reading controls local to repertory; global remedy visibility toggle | Preserve imported functionality; verify against real data in browser before release |
| Analysis | Clipboard-only floating shortcut; selected/ranking/matrix views; no overlapping controls; useful compact grading matrix | Preserve imported behavior and score semantics; regression scenario required |
| Patients and materia medica | Patient/case records, notes, library search, source sections and backups remain usable | Browser persistence exists; account isolation, backup/recovery and data-loss checks are release gates |
| AI | Keep only supported integrations; no bypass of paid services or authentication | Website currently hides native AI controls. Do not advertise AI parity until a supported website flow is implemented and tested |
| Repertory expansion | Audit one source at a time, report rubric/remedy/grade/hierarchy/reference differences; preserve Kent | Paused by later instruction. Do not silently add, replace or delete clinical entries during website migration |
| Copyright/source permissions | Existing stated OOREP permission covers English Kent, Boericke, BBCR and TPB | Does not establish permission for Synthesis, Complete or Murphy. No fabricated data or unlicensed redistribution |
| Publication | Provide usable independent URL after verification; keep secrets, raw private datasets and patient records out of public GitHub | Source only pushed; production host, private asset transfer and secrets are not configured |
| APK release history | Earlier request keeps latest five releases and deletes older chronologically | Separate APK release task, not an instruction to delete website source history or existing releases during this work |

## Phased implementation and acceptance gates

### 1. Stabilize the independent account flow

Completed locally: pending registration, owner-only list/decisions, protected asset delivery, approval redirect, revocation, logout, optional persistent cookie and preserved website controls. Password hashing runs asynchronously to avoid blocking all requests while deriving a password key. CI runs the authorization regression suite on Node 24.

Still required: owner password recovery/rotation, explicit account invitation or verification policy, decision audit history and abuse controls suitable for the host's proxy. Do not declare this security-certified.

### 2. Protect clinical records and active sessions

Before general rollout, isolate each authenticated account's browser records and prevent legacy shared records from being assigned to the next person who logs in. Provide explicit backup and migration. Recheck authorization when a tab resumes and hide the clinical UI after logout, revocation or expiry. Test multiple tabs and account switching. Namespacing browser storage alone is not encryption or protection from someone with local browser access; select and document the storage threat model and recovery design.

Revocation currently blocks subsequent server asset requests; it cannot erase data already delivered to a browser. This limitation must not be hidden.

### 3. Package and deploy privately

Choose a connected independent host, confirm plan limits/cost before provisioning, provision HTTPS and durable storage, configure owner secrets through secure hosting settings, and transfer clinical assets privately. Public GitHub contains application source, not the private database snapshot. Back up SQLite using a consistent SQLite backup mechanism, include WAL considerations, and perform a restore drill. Do not use an ephemeral disk for the only account database.

Use one origin for /login, /account, /api/* and /workspace/*. Keep owner controls on /account; members must not be sent to a provider dashboard. Establish rollback and uptime/error monitoring without logging passwords or patient data.

### 4. Verify the deployed clinical product

Use separate owner and member browser sessions. Check signup → pending → owner approval → automatic workspace redirect; member denial of owner APIs; revoke → denied subsequent access; logout and expiry; remember-me after browser restart; denied anonymous direct data URLs. Verify real HTTPS cookie flags and origin checks. Test account switching without exposure of another person's clinical data.

Check repertory search, chapter navigation/artwork, remedy hide/show, grades, adding/removing rubrics, weighted analysis and matrix, patient/case persistence, library sections, notes, printing and backup restore. Test small Android viewport, desktop, keyboard navigation, text enlargement, dark/light and reduced-motion settings. Report any unsupported feature explicitly.

### 5. Cut over and deliver the guide

Only after the gates pass, give the independent URL and owner/member instructions, document account migration and recovery, then update legacy links to the new origin. Existing app authentication and updates require a separate compatibility change; do not break them as an incidental website edit. Resume audits only after the user changes the current pause.

## Deployment update — 2026-11-09

Railway is connected and the standalone application is deployed at https://open-repertory-production.up.railway.app. Live owner/member browser checks passed, including approval, auto-entry, cookie flags, revocation and deleting the synthetic verification account. Accounts and clinical assets survived redeployment. No requests to ChatGPT or Apper occurred in the tested flows. The old Sites address remains separate.

Remaining limitations: no automated email verification or forgotten-password recovery; browser cases are not encrypted or synced; physical-device regression, full clinical-function review, disaster-recovery drills and independent security review are still future work. Railway's current account/usage limits apply. This update supersedes earlier hosting blockers in the phased plan but does not claim all future gates are complete.
