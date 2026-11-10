# One-time Cloudflare connection

Status: account created by owner; credential connection and deployment are not yet verified. The Railway site remains the current service. This setup does not purchase a plan or domain.

## Owner action, once

1. Open https://dash.cloudflare.com/profile/api-tokens and select **Create Token**, then **Create Custom Token**.
2. Name it `Similora GitHub deployment`.
3. Add these **Account** permissions: **Workers Scripts: Edit**, **D1: Edit**, and **Account Settings: Read**. Restrict **Account Resources** to your specific Cloudflare account. No zone/DNS, billing, user-management or Global API Key access is needed.
4. Create the token. Keep it private. Do not paste it into ChatGPT, source files, issues or workflow inputs.
5. Open https://github.com/devil01529/similora-website/settings/secrets/actions/new and add a repository secret named **CLOUDFLARE_API_TOKEN** with the token as its value.
6. Tell the assistant the secret is saved, without including its value. The assistant can run **Check Cloudflare connection** through GitHub Actions and inspect its safe result. If the token can see multiple accounts, scope it more narrowly or set the nonsecret repository variable `CLOUDFLARE_ACCOUNT_ID` explicitly.

This is the one-time credential connection. Routine releases must use workflow secret bindings; never repeatedly copy credentials. Revoke/replace the token if compromised or expired. The checker only reads token/account/Workers/D1 metadata; it does not assert that deployment permissions or the Free plan's runtime limits have already passed.

## Migration work still required

- Port and test the server to Workers/D1; validate secure password verification against Workers Free limits without weakening password protection.
- Preserve account IDs and approval state, using a private transfer; no user list, password hash, session or clinical record in public GitHub.
- Retain the initials-only local browser case policy. Serve approved clinical content with authorization on the backend.
- Configure automatic tested deployments, a free workers.dev address, rollback and free-tier limits. No paid upgrade without user authorization.
- Test owner approval/removal from the APK, member denial of owner APIs, remembered sessions and revocation on the new service.
- Keep Android package `org.similora.app` and its existing signing keys; increment versionCode, test an installed upgrade, and publish the signed update through the existing GitHub channel only after the replacement service is working.

The current Android identity and recovery guide live at https://github.com/devil01529/similora-update/tree/main/SIMILORA_MAINTENANCE . Signing secrets are separate from this Cloudflare token and must never be published.
