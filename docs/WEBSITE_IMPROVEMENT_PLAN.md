# Website improvement plan — 9 November 2026

Scope: the independent Railway website. Android remains a separate project. Clinical data and grading stay unchanged; clinical case content remains in the browser, with the existing five-case limit and confirmed replacement. Accounts and security records necessarily remain on the server.

## Phase 1 — dependable interaction (implemented in this release)

- Give owners searchable accounts, status filtering and visible pending/total counts.
- Coalesce overlapping account-list fetches. Avoid rebuilding unchanged lists so polling preserves focus and scroll position.
- Replace the invisible, inert workspace on connection failure with an accessible modal explaining the interruption. Provide retry, automatic online recovery, a bounded session-check timeout and focus restoration.
- Preserve the existing responsive layout, privacy entry cover, reduced-motion behavior and loading gate until the active repertory is ready.

Acceptance: desktop/tablet/mobile layouts stay within the viewport; filters match the expected accounts; unchanged refresh preserves focus; simulated server outage recovers without rebuilding the clinical workspace.

## Phase 2 — backend resilience and access protection (implemented in this release)

- Reject null, array and other non-object JSON requests before route processing.
- Apply per-account login limits, a broader socket-peer ceiling and a bounded in-memory limiter. Do not trust arbitrary forwarded-IP headers. Shared hosting proxies no longer put every user into a 20-attempt bucket.
- Limit password-change attempts, return Retry-After on throttling, and reject noncanonical encoded asset paths before selecting website adapters or denying private scripts.
- Bound request/header durations and drain HTTP connections on deployment termination.
- Retain owner-only decisions, same-origin checks, secure cookies, account-scoped browser storage and immediate server-side approval checks.

Limits: rate limits are process-local and reset on deployment. A shared proxy still has an aggregate ceiling of 200 authentication attempts per five minutes. Multi-instance deployment requires a shared limiter. These measures are not a penetration-test certification.

## Phase 3 — regression checks and release (required before publication)

Run API access-control and lifecycle tests, case-limit and bootstrap tests, real-asset responsive and clinical browser suites, syntax checks and build checks. Verify Railway reaches SUCCESS for the application commit; check the live service. Use synthetic accounts for live tests and remove only those fixtures. Do not change real members' approval decisions.

## Subsequent improvements, in priority order

1. Case editing: dirty-form navigation warnings, conflict detection between browser tabs and local export/recovery. Explicitly explain that browser data is not encrypted or synchronized. Test before changing the existing save workflow.
2. Recovery and operations: a documented, tested private backup/restore procedure for account records, retention policy, monitoring and capacity alerts. Never publish database backups or add clinical upload endpoints.
3. Account recovery: configure a verified email delivery provider before offering email verification or password-reset links; add expiring, one-use recovery tokens and audit events. Do not claim email recovery exists until delivery and abuse tests pass.
4. Clinical navigation: keyboard shortcuts, clearer selected-rubric feedback, preserved reading position and comparison workflows; retain source grades and interpretation limitations.
5. Performance: measure first usable screen, book-switch latency and input responsiveness on a modest Android device. Optimize measured bottlenecks; avoid layered blur or preloading every book just to conceal an unfinished startup.
6. Security review: session inventory/revoke-other-devices, owner second-factor authentication and external penetration testing before broader rollout.

These subsequent items are a roadmap, not claims of implemented functionality. Any external paid provider or expanded data collection needs an explicit product decision.
