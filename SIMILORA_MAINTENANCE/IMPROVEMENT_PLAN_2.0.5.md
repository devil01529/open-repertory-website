# Similora 2.0.5 improvement plan and implementation

## 1. Launcher identity

Use a rounded-square pale glass tile, as in the owner's home-screen reference. Keep the transparent emblem for the startup scene so no boxed animation returns. Supply a rounded-square PNG fallback and Android API 26+ adaptive icon with a full background and safe-zone emblem. The device launcher determines the final adaptive mask. Use the square tile for website favicons/touch icons.

## 2. Sign-in usability

Add a Show/Hide password action with an accessible pressed state and retain password autocomplete. Conceal it when the page is backgrounded or after successful login. Add Retry connection when session discovery fails; keep error details readable and prevent duplicate retry requests. No role or approval-policy changes.

## 3. Glass and accessibility

Keep translucent rounded panels, crisp focus rings, comfortable controls and light/dark contrast. Preserve reduced-motion support and add an opaque fallback for reduced transparency. Keep narrow screens free from horizontal overflow and maintain keyboard navigation.

## 4. Verification and release

Verify mobile/desktop login, password toggle, failed-session retry, startup duration and no replay, adaptive icon loading, Android encrypted storage/clinical startup, signed updates and release retention. Deploy website through Actions and publish the APK with the same package and certificate. Preserve clinical data/algorithms. Store public recovery information here; private signing keys remain outside GitHub.

All implementation changes are in this release. Test outcomes are recorded in the corresponding TEST_REPORT.md.

Owner-panel reliability was also improved: refresh and approval feedback are serialized, deletion controls are disabled during refresh, and list reloads wait for mutation completion. A browser regression test holds a refresh request open, verifies deletion is disabled, completes it, then deletes a synthetic account and verifies controls recover.
