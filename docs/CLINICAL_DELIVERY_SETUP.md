# Protected clinical delivery migration

An authenticated Apper server function named clinical-asset is deployed (id 6286, VITE_CLINICAL_ASSET). It runs with caller permissions, never administrator privileges. Before retrieving an allowlisted file it verifies a readable Website request, internally consistent ownership, matching browser ID, exactly one approved grant and a valid grant revision. Android approvals are rejected. Private-host access uses a server-only credential. No public website-sharing change was made.

The CLINICAL_ASSET_SERVICE_TOKEN secret field is registered but its value has NOT been configured or verified. Apper's tools register secret names only; the owner must enter values in the dashboard:
https://apper.integrately.com/projects/54be7eef4ac24f7c907d0576b168ccff/manage/dev/secrets

The required value is service access for the private clinical hosting, not an Apper password, ChatGPT password, API key or user session cookie. It must never be put in Git, browser code, chat, screenshots or a URL query. Secret setup needs a supported secure transfer from the hosting credential controls. Do not invent a token or mark setup complete without verifying that transfer. Where the hosting UI does not expose service access, this remains a provisioning blocker.

The function fails closed while configuration is missing. Deployment is not evidence that authenticated asset delivery works end-to-end. Ten mock-runtime scenarios cover rejected/revoked/pending access, Android-grant reuse, unreadable requests, duplicate grants, traversal, method checks, missing configuration and successful fixture transport. Live credentials and the real cross-service request have not been tested.

Remaining before clinical migration: configure the server credential securely, implement the clinical asset client/host transport, connect the clinical UI inside the authenticated Apper application, test sign-in/owner/member/revocation in real sessions, then hand over the application URL. The old clinical Site still requires hosting sign-in. No assertion is made that merely setting this secret completes the website migration.
