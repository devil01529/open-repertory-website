# Startup animation — 12 November 2026

The owner supplied a 10-second portrait video and requested it as the startup screen. The derivative keeps the Similora emblem/name/caption, crops the bottom watermark area (720 × 1080 from the original 720 × 1280), scales to 480 × 720 and removes audio. H.264 baseline/yuv420p with fast-start metadata supports older mobile players. The encoded clip is approximately 858 KiB. A still from the cropped clip supplies the fallback.

Files: standalone/similora-startup.mp4 and similora-startup-poster.jpg; startup.js/css manage web playback. The APK keeps matching media in android-rebuild/res/raw and drawable-nodpi in its separate repository.

Account session requests and clinical startup are independent of media playback. Account loading offers Skip and a timeout fallback; clinical loading remains gated by privacy consent and actual readiness. Reduced-motion mode does not download/play the web video. Hidden tabs pause it. Failure/retry and auth approvals retain their existing authority; the animation cannot unlock a workspace. There is no mandatory ten-second wait.

Browser regression tests: tests/test_startup_browser.py. Run after building cloudflare/.build/assets. Native playback and regression evidence are in the corresponding APK release report.
