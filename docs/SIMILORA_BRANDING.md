# Similora identity

Product name: **Similora**. Mark: a glass S formed from flowing sage and champagne ribbons on midnight teal. The image was generated for this identity and is bundled locally; no third-party image host is needed. The master lives in `standalone/similora-mark-v1.png`.

Website account, browser title/favicon, clinical header, desktop navigation, report labels and neutral provider labels use Similora. Original repertory names, source documents, attribution, rights notices and dataset contents remain intact. Similora is the product and presentation brand, not a replacement claim of authorship for imported books.

The web server adapts only an explicit list of presentation files. It does not rewrite clinical JSON, notices, browser storage keys, account IDs or private clinical assets on disk. Existing accounts, sessions and browser cases keep their identity. The deployment address remains https://open-repertory-production.up.railway.app; a domain move needs a separate browser-data migration decision because local cases are bound to the origin.

Android branding assets and an application script are prepared separately in the update repository under `integration/similora/`. They are not a new signed APK. A complete retained Android source project and original signing setup are still needed to build and verify the upgrade. Keep the existing package ID, encrypted storage keys and update verification keys.

After the owner renames the GitHub repositories, resolve their new canonical names, update the Railway source mapping and maintainer remotes, and verify old installed Android update URLs continue to resolve. Historical version notes and signed release metadata are not rewritten for cosmetic branding.
