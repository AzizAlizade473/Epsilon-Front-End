# Current client data inventory

This records the implemented mobile client through STEP 23. Backend retention,
access policies and production vendor configuration require owner verification;
the client does not invent retention periods or account-deletion consequences.

| Data                                                              | Purpose and client storage                                                                                 | Cleanup and protection                                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access/refresh tokens                                             | Backend authentication; SecureStore plus session memory; storage read at boot                              | Cleared on logout/deletion; HTTPS in live production; never logged or placed in URLs                                                                                       |
| Name, phone, email, birth date, linked identity descriptions      | Account/onboarding screens; authenticated query/context memory                                             | Queries and context cleared on logout/deletion; no provider user IDs exposed                                                                                               |
| Language                                                          | Immediate UI preference in SecureStore and validated profile PATCH                                         | Known SecureStore keys cleared on logout/deletion; failed sync remains visible with retry                                                                                  |
| Raw purchase reference                                            | Resolve a purchase; transient scanner memory and POST body                                                 | Never parsed/opened, logged, persisted or placed in navigation URLs; released on cancellation/unmount                                                                      |
| Receipt and wallet ledger                                         | Display validated server purchases, balances and transactions; query memory                                | Cleared on logout/deletion; integer qepik; no client balance/reward calculations                                                                                           |
| Rating, reasons, optional comment, item/receipt IDs and retry key | Durable feedback outbox in account-scoped AsyncStorage                                                     | Maximum 20, seven-day pruning; removed on accepted/duplicate/validation response; all feedback keys cleared on logout/deletion                                             |
| Review history                                                    | Read-only authenticated server projection in query memory                                                  | Cleared on logout/deletion; no public posting or restaurant analytics implemented here                                                                                     |
| Notification preferences                                          | Two server-confirmed switches in query memory                                                              | Cleared on logout/deletion; enabling requires explicit explanation/permission flow                                                                                         |
| Expo push token                                                   | Obtained after opt-in and sent in authenticated POST body to `/devices`; not persisted by application code | No PII notification payloads; late token results ignored after logout. Backend must remove account/device associations on logout/deletion; production verification pending |
| Crash-report consent                                              | Account-scoped boolean in AsyncStorage, default off                                                        | Cleared on logout/deletion; opt-in required before deferred SDK load; opt-out disables reporting immediately                                                               |
| Copied transaction/receipt reference                              | OS clipboard only after an explicit tap                                                                    | Only the selected server reference is copied; clipboard is an OS-managed surface                                                                                           |

Native token infrastructure and permission settings are OS/SDK-managed. The
JavaScript checks do not verify native storage encryption, merged manifests,
backend deletion/retention, push credentials or real-device behavior.

Scrubbed JavaScript crash reports contain only generic error type/value, normalized
bundle frames/debug IDs and build metadata (release, dist, environment, app version).
Arbitrary messages, user identities, headers, request bodies, URLs with queries,
breadcrumbs, screenshots and feedback payloads are discarded. Native crashes and
native caching, tracing, replay and profiling are disabled. No report is sent with
an empty DSN, without account consent, or in default development configuration.
An already permitted in-flight request cannot be unsent. Vendor retention/access
settings and hosted privacy-policy disclosure require owner verification before
production enablement; no retention duration is invented here.

Feedback created before a trusted server clock exists stores a null timestamp.
The bounded queue retains it across process restarts and anchors its seven-day
expiry at the first trusted server observation, rather than using the device
date to discard unsent work.
