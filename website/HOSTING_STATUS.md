# Owner-private first deployment

All clinical data files in this website-owned snapshot are packaged with reversible gzip compression, preserving exact JSON bytes. Browser and search-worker fetches decode the payload; grades and clinical algorithms are retained.

Hosting is owner-private. The hosting sign-in is separate from Apper. The existing Apper owner portal is linked from Account & access. Member browser approval is not implemented in this deployment; do not open sharing to other users until backend browser authorization is completed. No public sharing is enabled.

Native APK update and API-key controls are hidden on the website. Offline phrase search remains available. Browser records are separate from Android records and do not have Android Keystore encryption. Keep browser exports securely.

Syntax, dataset byte preservation, compression round-trip, fetch denial handling, build tests and design interaction tests passed. Current Sites environment lacks its browser-control helper, so rendered browser/live-owner acceptance was not verified here. A successful hosting deployment verifies publication, not every clinical interaction.

The website source remains in devil01529/open-repertory-website. A hosting-source mirror is required by the Sites platform. No clinical data or keys are committed to either public source GitHub repository. The generated deployment archive contains the clinical assets for private hosting only.
