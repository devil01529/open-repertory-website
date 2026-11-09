# Application login and browser requests

The current clinical address is hosted by Sites and remains protected by its ChatGPT-hosting access policy. Apper grants are separate; changing them cannot grant Sites access. The previous Account links were not a login integration.

An actual browser-request flow has now been added to the existing Apper application at /website-access. It uses the same app account, records requests with platform_c Website and a per-account browser installation ID, and reads the existing owner-managed grants. Android grants cannot be reused through this browser flow. Owners see their existing request dashboard inside the page; members do not mount it. Approve/reject/revoke continue through the existing role-protected request pages and backend rules. No schema or native Android route changes were made.

Website integration source is tracked in apper-integration in this website-only GitHub repository. The Apper application requires its own deployed mirror to use its native login/session and database APIs.

This does NOT yet authorize clinical asset delivery. The Sites address remains private; no data was made public to remove the sign-in prompt. A provider-hosted clinical frontend or a supported external-auth server is still required. Do not mark this migration complete or represent /website-access as the clinical app.

Tests use mocked SDK responses and check account-scoped identifier persistence, Website-labelled writes, rejection of Android request reuse and rejection of anonymous calls. Live owner/member login and database permission tests require actual sessions and have not been run. The browser identifier is not a hardware identity or authentication credential.

Existing claim corrected: granting APK or browser access in Apper does not change the Sites hosting policy. Publishing only a local login form or disabling that policy would not safely solve the problem.
