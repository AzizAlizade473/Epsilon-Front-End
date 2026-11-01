# Android release procedure

Prepared 2026-11-01. **NO-GO for public submission/launch.** This is an owner
runbook; no native build, store upload, OTA publication or credential operation
was performed in the final engineering batch. Read RELEASE_GATE.md first.

## Identity and private configuration

1. Owner verifies the Play developer account, creates/confirms the app and approves
   its immutable application ID. The development fallback `com.epsilonup.app`
   and version `0.1.0` are not evidence of an approved production identity/version.
2. Associate the real Expo/EAS project privately; confirm owner/project identity,
   remote Android version code and environment access. Record the exact Git SHA,
   app version, version code, runtime version, build ID and artifact digest.
   `appVersionSource: remote` and production `autoIncrement: true` prevent
   deliberate version-code reuse; verify the actual resulting code in Play.
3. Configure separate development, preview and production EAS environments.
   Production requires live mode, approved HTTPS API/legal URLs, support email,
   explicit `EXPO_PUBLIC_ANDROID_PACKAGE`, no E2E/dev crash flags, and approved
   minimum age. `guard:production -- --environment` runs during production EAS
   post-install and fails on missing/unsafe configuration. Syntactic URL validation
   does not verify domain ownership, hosted content or backend identity.
4. Put upload/signing credentials, Play service-account JSON and Sentry upload
   tokens in EAS/CI credential storage. Never add these files to the repository or
   use `EXPO_PUBLIC_` names. Assign the Google service-account key to this app on
   EAS servers; `submit.production` intentionally omits a repository key path.
   Restrict Play API permissions to the intended app and required release work.
5. Enable Play App Signing. Register the **Play app-signing SHA-1**, exact package
   and Web OAuth client in Google Cloud; upload-key, local debug and EAS preview
   certificates are distinct. Register each intended testing identity separately.
   Enable Google only after a native rebuild and real installed-build validation.
   Do not commit OAuth secrets or reviewer accounts.

## Candidate build and store preparation

The manual protected EAS workflows already in `.github/workflows/` require main
and an environment approval. Merge this final branch only after review. They are
not automatically invoked. Do not run builds/submission merely to finish a checklist.

After separate owner authorization and prerequisites, use the approved pinned
EAS CLI version from the existing workflows. Build the production AAB from the
reviewed SHA, without automatic submission. Before sharing, inspect the signed
artifact's application ID, version code, Hermes/native libraries, merged manifest
(backup disabled, no cleartext, only justified permissions), target API, supported
ABIs and 16 KB page compatibility. `npm run android:audit -- --manifest PATH --require-native`
reads the actual merged AndroidManifest.xml (see ANDROID_AUDIT.md);
configuration checks alone do not inspect an AAB.

As checked on 2026-11-01, new apps/updates need Android 16 / API 36 or higher;
re-check the [current Play target API policy](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
at submission. Do not infer artifact compliance from the Expo SDK number.
Validate native compatibility using [Android's 16 KB guide](https://developer.android.com/guide/practices/page-sizes).

Complete STORE_READINESS.md and LEGAL_TODO.md: approved app identity/assets,
AZ/EN/RU listing and legal translations, real-build screenshots, content rating,
target audience/minors assessment, Data safety answers, live Privacy/Terms/Rewards
resources, public deletion URL and private reviewer access. Counsel/owner must
approve program terms, restaurant agreements and personal-data/financial wording.
No existing draft or example domain is treated as approved or deployed.

## Internal Play verification first

Follow [Expo Android submission guidance](https://docs.expo.dev/submit/android/).
Google may require the initial upload to be done manually before API submissions.
`submit.production.android` defaults to **internal** / **draft**; this avoids a
public production default, but an upload still requires explicit authorization.
Confirm the chosen artifact, app and track before any submission. Never use
automatic production submission for a first candidate.

Install via the Play internal-testing invitation, not a sideloaded APK. Record
tester/device/OS/build and evidence for Google sign-in -> staging purchase QR ->
exact purchased dishes -> one rating per dish -> server reward -> universal wallet.
Also test OTP, account switching, expiry/refresh, denied/revoked permissions,
malformed/claimed QR, manual code, duplicate taps, server-committed/lost response,
offline kill/relaunch/reconnect, deletion, update gate and logout cleanup. No real
customer purchase or money should be used without an approved pilot protocol.

Run QA_MATRIX.md / PERF_REPORT.md on small, normal, large and low-end Android
devices, including Aziz's phone. Verify Back, keyboard, safe areas, large fonts,
TalkBack, reduced motion, camera teardown, notifications and a ten-minute session.
Attach backend authorization/restaurant-isolation, atomic-ledger/replay,
refund/reconciliation/fraud, backup-restore and deletion evidence separately.

Personal Play accounts created after 2023-11-13 require a closed test with at
least 12 opted-in testers continuously for 14 days before applying for production
access, per [Google's account-specific testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
Internal testing does not satisfy that closed-test requirement. Verify account
type, actual Console eligibility and current policy before scheduling a launch.

## Promotion, staged rollout and incident response

Before public submission/promotion, run `npm run release:gate`; it deliberately
fails until all P0 evidence is PASS with reviewer, timestamp, build, full Git SHA
and proof references. Retain evidence privately if sensitive. The tool checks
attestation structure, not the truth of external evidence or legal approval.
Even a conditional result requires independent owner/legal release authorization.

Owner and operations must name a release commander, support/financial/security
owners, escalation contacts and a staffed observation window. Choose a small
owner-approved initial cohort/percentage and explicit observation duration,
then expand only after checking crash/ANR, auth, duplicate claims/rewards,
reconciliation, failed writes and support signals against approved thresholds.
Do not invent business thresholds in the client. First production releases may
have different Console rollout controls; use controlled testing until those are
confirmed. See [Google staged rollout controls](https://support.google.com/googleplay/android-developer/answer/6346149?hl=en).

On security exposure, wrong money, lost writes or critical crashes: halt further
rollout, disable affected mutations on the server under incident authority,
preserve audit/ledger evidence and follow INCIDENT_RESPONSE.md. Halting does not
remove already installed versions. Prepare a corrected, signed AAB with a higher
version code; do not attempt to downgrade native code or erase ledger entries.
Verify server compatibility, backup restoration, reconciliation and the rollback
drill before reopening. Record owners, times, artifacts and recovery evidence.

## OTA safety

OTA is currently **unconfigured/unverified**; channels in eas.json alone do not
activate updates. Keep delivery disabled until the real EAS project/update URL,
runtime mapping, preview test and rollback drill are approved. With appVersion
runtime policy, every native dependency/permission/config change requires a new
binary and app-version/runtime boundary. Never deliver incompatible native
changes over JS updates or use an OTA to bypass store review/security gates.

For future enabled OTA: test on preview first, record channel/runtime/update
group, stage the approved compatible JS/assets, observe, halt on regression and
use the documented [Expo rollout](https://docs.expo.dev/eas-update/rollouts/) and
[rollback](https://docs.expo.dev/eas-update/rollbacks/) mechanisms. Re-test recovery
on the installed candidate, including offline startup. Source-map uploads stay
private in EAS/CI. No OTA or rollback action was run here.
