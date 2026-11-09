# Responsive website and complete startup surface

## Implemented

- High-specificity viewport rules preserve space beside the 224 px desktop navigation rail and above phone/tablet bottom navigation.
- Brand, current page and menu have stable header positions; the extra Account header button is hidden on small screens, with Account & access still in the menu.
- Account requests use compact responsive cards, wrapping email labels and touch-sized actions. Desktop cards use two columns.
- A privacy notice is presented before clinical startup. It states that clinical cases remain in the browser while login accounts, approvals, security records and repertory content occupy server storage.
- The complete initial workspace stays hidden behind a solid startup surface until the chosen repertory, remedies, controls, fonts and brand artwork are ready. Failures retain a Retry screen. Other books load on demand; downloading every volume before first use would add unnecessary transfer and delay.
- Cases remain browser-local. No clinical-case upload endpoint was added. No existing patient data was erased or migrated.

## Verification

`python3 tests/browser_responsive.py` checks 360, 412, 768, 1024, 1366 and 1920 px viewports in light/dark mode, side/bottom navigation overlap, form widths, header wrapping, long account emails, the privacy entry gate and delayed first-repertory loading. `tests/browser_initials.py` retains five-case, cancellation, reload, library/repertory and session-exit checks. Unit/API checks retain account authorization and one-time installer checks.

## APK parity

Shared CSS and implementation instructions are staged under integration/website-parity in the separate Openrepertory-update repository. These are reviewable integration files, not a signed APK release. Full Android source, original signing configuration and native validation remain required. Apper's daily tool limit blocked backend inspection/edits. No updater metadata or production APK was altered.

## Published verification

Published at https://open-repertory-production.up.railway.app with Railway deployment c64f4af9-6292-441c-81f2-d50eaff37d8f (SUCCESS), application commit 42d9600b572650646190f014194b7b8ef625cc42. Live health returned service ready and clinicalReady true. GitHub checks passed. Live Chromium owner/member checks passed after the new notice: login, signup/request, approval, cookie flags, case form, clinical navigation, revocation, account deletion and no JavaScript errors. Only synthetic verification accounts were created and deleted; existing member approvals were not changed.

Shared APK overlay/guide commit: e5d0a83 in Openrepertory-update. This is source preparation, not an APK version or release. Apper reported DAILY_LIMIT_REACHED again during continuation; no Apper write or owner-identity bridge was deployed.
