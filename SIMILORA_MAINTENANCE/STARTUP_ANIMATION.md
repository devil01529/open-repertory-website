# Startup animation — 12 November 2026

The owner supplied a 10-second portrait video and requested it as the startup screen. The derivative keeps the Similora emblem/name/caption, crops the bottom watermark area (720 × 1080 from the original 720 × 1280), scales to 480 × 720 and removes audio. H.264 baseline/yuv420p with fast-start metadata supports older mobile players. The encoded clip is approximately 858 KiB. A still from the cropped clip supplies the fallback.

Files: standalone/similora-startup.mp4 and similora-startup-poster.jpg; startup.js/css manage web playback. The APK keeps matching media in android-rebuild/res/raw and drawable-nodpi in its separate repository.

Account session requests and clinical startup are independent of media playback. Account loading offers Skip and a timeout fallback; clinical loading remains gated by privacy consent and actual readiness. Reduced-motion mode does not download/play the web video. Hidden tabs pause it. Failure/retry and auth approvals retain their existing authority; the animation cannot unlock a workspace. There is no mandatory ten-second wait.

Browser regression tests: tests/test_startup_browser.py. Run after building cloudflare/.build/assets. Native playback and regression evidence are in the corresponding APK release report.

## 2.0.3 correction

Footage edges are feathered into the exact screen background to remove the pasted rectangle. The intro plays once to completion before content is revealed. If initialization is still running after the intro, the animation disappears and loading controls appear. Media completion and authenticated readiness are separate gates. Account-to-workspace navigation carries an ephemeral completion marker so it does not replay the intro twice. The native account screen uses a cosmetic query flag after the bundled intro; approval requirements are unchanged.

## 2.0.4 logo-only design

Replaces the video entirely with a transparent, clean recreation of the reference emblem. No footage panel, particles, sparkle effects or bokeh is used. Website Web Animations and native Android property animations reveal the emblem/name/caption on the full-screen gradient. The entire ten-second intro completes before revealing ready content; loading controls follow if necessary. System reduced motion skips movement.

The APK launcher and clinical brand image use the same emblem. Native completion is remembered for the current Android task: background/resume and same-task Activity recreation do not replay a completed intro. A new task/process resets the intro. The web remembers completion per browser tab and hands off without duplicate animation. Owner approvals and clinical records are independent of animation state.

Login styling uses rounded translucent panels/inputs with a blur fallback and readable light/dark colors. No authentication or approval policy changes.
