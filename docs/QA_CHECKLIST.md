# Critical regression evidence

STEP 24 source/test review, 2026-11-01. Jest assertions and authored Maestro
flows differ from actual installed-device/backend verification. Maestro has
not executed on this PC; see `.maestro/README.md` for prerequisites.

| Risk / scenario                            | Automated protection                                                                   | External evidence still required                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Login → logout → login / account isolation | auth-journey, profile-auth-cleanup, bootstrap-storage, auth-refresh-isolation          | Real OTP/Google and another account on a device             |
| Same account on two devices                | refresh-client and resilience-ui                                                       | Backend session/refresh policy on two devices: NOT VERIFIED |
| Kill during feedback submission            | feedback-outbox restart tests; Maestro 04 authored                                     | Installed process death / actual backend delivery           |
| Server commits, response lost              | feedback-replay-integrity: persistent server double, same key/result, one ledger entry | Real backend idempotent replay: NOT VERIFIED                |
| Same receipt scanned twice                 | scan-machine locking and core-feedback-ui ratings                                      | Backend ownership and repeated claims                       |
| Two users claim one receipt                | core-feedback-http/UI claimed errors                                                   | Backend atomic ownership: NOT VERIFIED                      |
| Simultaneous redemption                    | No redemption mutation introduced                                                      | Future backend feature, not implemented/verified            |
| Negative / huge / malformed money          | contracts, money-amount, wallet-profile-http, wallet-history                           | Backend signed integer ledger semantics                     |
| Invalid JSON / missing server fields       | http-client, contracts, core-feedback-http                                             | Live deployed API contract                                  |
| Old app vs new backend                     | resilience-clock semver, resilience-ui update gate                                     | Preview store link and backend minimum-version enforcement  |
| Delete with pending rewards                | account-deletion warnings, confirmation, failure, cleanup                              | Backend retention/settlement/deletion: NOT VERIFIED         |
| Wrong device clock                         | resilience-clock, feedback-outbox undated-draft anchoring                              | Real Android clock skew / lifecycle                         |
| Camera denied / granted                    | scan-screen, scan-machine; Maestro 03 authored                                         | Physical camera and OS permission UI                        |
| Notifications denied / revoked             | notification-device, profile-settings                                                  | Real credentials/channel/token registration                 |
| Malformed deep link                        | deep-link, bootstrap-redirect                                                          | Android dispatch                                            |
| Monitoring failures / payload privacy      | crash-privacy, crash-runtime, e2e-boundaries                                           | Actual consent/ingestion/symbolication: NOT VERIFIED        |
| Multi-dish feedback / universal wallet     | core-feedback-ui, feedback-provider, feedback-replay-integrity, wallet-history         | Server eligibility/reward issuance; no client calculation   |

Coverage collects every source file in `src/lib/`, `src/services/`, scan
machine/hook and auth challenge store, including unimported files. Enforced
minimums protect each risk group independently; percentage alone does not prove
correctness. No runtime module is excluded to raise the numbers. Native SDK
adapter validation still requires preview/dashboard checks.

New tests target account-switch refresh overlap, committed-but-lost mutations,
actual wallet query invalidation, test-seam release exclusion, monitoring failures
and production/license/workflow guard rejection. Existing phone/age/date/plural,
fixtures, transaction and deletion coverage is retained rather than duplicated.
Tests use local network/clock/storage/SDK doubles, with no live credentials.
