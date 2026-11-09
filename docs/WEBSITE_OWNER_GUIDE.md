# Open Repertory website guide

Website: https://open-repertory-production.up.railway.app
Account & access: https://open-repertory-production.up.railway.app/account

## Owner's first sign-in

The owner account is **ruturajc09@gmail.com**, as specified earlier in the project. Its initial password was generated privately; it is not your Apper, Firebase, Google or ChatGPT password.

For first sign-in only, open the Railway project → open-repertory service → Variables → reveal `OWNER_PASSWORD` in your own authenticated dashboard:
https://railway.com/project/e8796254-9b10-41db-a2e6-b3118d21b302/service/59d41cf3-ecf2-4dc6-a7f0-b6acae24148e?environmentId=d647bce3-eb0e-4921-94b6-22ec8ccf18d2

Sign in at the website, open Account → Change password, and choose your own password. Save it in your password manager. Changing it invalidates other existing sessions. The Railway variable is only an initial bootstrap credential and does not overwrite your changed password on restarts. There is no automated email reset service yet; do not lose your password. Never send it in chat.

## Approve and remove members

1. Give members the website URL. They select Create account and choose an email/password; they are signed in to a waiting page and their request is created automatically.
2. Open Account & access as the owner. New requests appear in Account requests; it refreshes automatically and also has a Refresh requests button.
3. Select Approve. The member's waiting page checks every five seconds and opens the clinical workspace automatically.
4. Select Remove access to revoke an account. Subsequent server requests are denied; an already-open workspace checks periodically and when it regains focus. Previously downloaded browser data cannot be remotely erased.
5. Rejected or revoked accounts can be permanently deleted using Delete account and its confirmation. They must register again to return. Owner accounts cannot be deleted using this interface.

Members do not see owner controls and the server denies their requests to owner APIs. Approval decisions are recorded on the server. Email addresses are account identifiers; email verification messages are not configured. No ChatGPT account, APK installation or Apper session is needed to use this website.

## Staying signed in

Select Stay signed in for 30 days only on a private device. Otherwise the session expires after eight hours. Sign out on shared devices. Website accounts are separate from existing APK/Apper accounts; previous credentials and approvals are not automatically migrated.

## Clinical workspace

Use one to four initials, symptom totality and a remedy considered. Do not enter patient names, addresses, phone numbers or identifying history. Open Repertory to select rubrics; Analysis shows grading, ranking and the matrix; Library opens materia medica. Analysis ranks recorded rubric matches; remedy selection remains a clinical decision.

Up to five cases are retained per account in each browser. Creating a sixth case or restoring a snapshot into a sixth case prompts before deleting the oldest case and its contents. Cancel preserves all five. Cases are browser-local, do not sync across devices and are not visible through the owner's account-management page. Clearing browser storage can erase them. Local storage is not encrypted; someone controlling the browser profile can inspect it. Initials and free text are not guaranteed anonymous.

## Loading and movement

Sign-in, requests, approval decisions and account navigation show progress messages. Clinical loading shows a small status indicator; page transitions use a short fade and movement without delaying navigation. Reduced-motion settings disable animated effects. Slow network requests show a retry message rather than waiting indefinitely on account forms.

## Hosting and updates

Railway deploys main from the website GitHub repository automatically. Accounts and private clinical assets are on a persistent 500 MB volume, separate from the application image. The clinical file transfer endpoint is disabled after successful installation, and bootstrap upload credentials have been cleared from the service configuration. Raw clinical assets and account credentials are not in public GitHub.

Railway account limits and any trial/usage pricing still apply. No paid plan upgrade or custom-domain purchase was performed. This is a Railway-provided HTTPS domain, not a separately purchased domain.

Keep a consistent SQLite backup and test recovery before expanding usage. Browser-local cases need their own deliberate export; server backups do not contain them. External security review and automated email/password recovery remain future work; this deployment is not a security certification.
