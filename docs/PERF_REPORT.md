# Hardening performance report

Recorded 2026-11-01. Android Hermes release exports use Expo SDK 58 and the pinned
dependencies. Bundle size measures the generated `.hbc`, not APK download size.

| Export                                        | Hermes bytes |    Change from STEP 17–20 |
| --------------------------------------------- | -----------: | ------------------------: |
| STEP 17–20 baseline (`dist/wallet-profile`)   |    5,922,377 |                  baseline |
| Full Sentry entry (`dist/hardening`)          |    7,675,166 | +29.60% — fails 10% guard |
| Full entry + experimental Expo optimizer      |    6,822,208 |     +15.19% — still fails |
| Modular error client, standard compiler       |    7,304,568 |           +23.34% — fails |
| Modular error client + Expo optimizer (final) |    6,104,882 | +3.08% — passes 10% guard |

Reproduce with `npm run export:android -- --output-dir dist/hardening-verified --max-workers 2`
after supplying the documented environment. The wrapper, source-map workflow and
preview/production EAS profiles enable Expo's experimental graph optimization
and tree shaking. No modules are stubbed and SDK code is included regardless of
DSN/consent. These compiler flags require preview regression testing; a standard
unoptimized export still exceeds the guard and is not the release configuration.
The previous baseline used the standard compiler; these are actual artifact
sizes across that documented build change, not an isolated SDK-size estimate.

The modular adapter uses the pinned SDK's ReactNativeClient, core initAndBind,
official fetch transport, default stack parser and three explicit error
integrations. It avoids the full entry point's unused feature imports. SDK
upgrades must revalidate this adapter and bundle/source-map behavior.

The final checked-in wrapper also passed with `--source-maps`: bytecode
4,984,188 bytes and external map 12,224,912 bytes under `dist/hardening-final`.
External-map exports move debug data out of the bytecode; use the **6,104,882**
no-map result above for comparison with the prior no-map baseline. No maps were
uploaded and no source files or generated exports are committed.

## Startup measurement

**NOT VERIFIED:** no Android SDK/adb or low-end physical phone is available on
this PC. Neither the 2.5s cold-start target nor the maximum +100ms regression has
been measured. Unit tests and exports cannot substitute for these measurements.

The crash runtime waits for two animation frames and a subsequent task before
reading consent or importing the SDK. Empty DSN, absent consent and default
development configuration prevent SDK initialization. Native crash capture,
tracing, replay, profiling and native caching are disabled; only scrubbed JS
errors are collected after explicit consent. Bundle measurements include SDK
code even when the default DSN is empty.

Owner procedure: build identical preview variants before/after hardening with
the same backend, device and build settings. On a low-end Android phone, record
at least five cold launches after force-stop for each variant, including consent
off and on with a configured DSN. Record device/OS, bootstrap-ready timing,
median and worst case. If the regression exceeds 100ms, defer more or remove the
integration; do not mark this check passed from JavaScript timing alone.

## STEP 24–25 quality batch (2026-11-01)

Final no-map Hermes export: **6,106,790 bytes**, versus the verified hardening
baseline **6,104,882** (+0.03%). `npm run bundle:check -- dist/quality-ci-final`
passes the unchanged 10% budget. The same Expo SDK 58 optimization flags remain
in use. The release export includes no new npm runtime dependency; developer-only
Maestro seams are gated by the development-build flag, explicit opt-in, development and mock mode.
This is a JavaScript export measurement, not an APK or cold-start result.
Low-end physical startup measurements above remain NOT VERIFIED.

## STEP 26-27 contract/legal batch (2026-11-01)

Final no-map Hermes export: **6,107,845 bytes**, compared with the verified
STEP 24-25 baseline **6,106,790 bytes** (+0.02%). The unchanged 10% budget passes.
The same SDK 58 export settings are used; no runtime dependency or performance
optimization was added. Contract/error/HTTPS validation accounts for the small
code change. This is not an APK, native-device or cold-start measurement.

## STEP 28 final performance pass (2026-11-01)

| Comparable no-map Android Hermes export                |     Bytes |           Change |
| ------------------------------------------------------ | --------: | ---------------: |
| Recovered STEP 26-27 `054f3df` (`dist/contract-legal`) | 6,107,845 |         Baseline |
| Final STEP 28-29 (`dist/final-release-verified`)       | 6,095,278 | -12,567 / -0.21% |

`npm run export:android -- --output-dir dist/final-release-verified --max-workers 2` and
`npm run bundle:check -- dist/final-release-verified` completed successfully with the same
SDK 58 optimizer flags and no source maps. The unchanged growth limit is <10%.
The checker also rejects known development mock-credential markers in the actual
Hermes artifact; they are absent. No package was added, removed or upgraded.
This is total bytecode size, not APK/AAB size, startup latency or a per-change
causal estimate. Route code remains in the package even when evaluated lazily.

Structural findings/fixes: Hermes confirmed in the installed Expo native template
(`hermesEnabled=true`) and actual `.hbc` export; development service fixtures imported
only by the development initializer; camera route/date picker/clipboard deferred
until use; wallet-only disk persistence deferred after first frame; active query
refetch uses monotonic 30s freshness and skips in-flight work; profile/config GET
signals propagate; duplicate response parsing removed from rating renders. Paged
lists retain FlashList v2 keys/types (v2 does not use estimatedItemSize), fixed
expo-image logo dimensions/flat fallback and no animated list layout properties.
No speculative memoization or replacement animation framework was introduced.

Lifecycle findings/fixes: invisible sheets/manual scanner overlays unmount,
sheet animations/focus callbacks cancel, camera unmounts on blur/background and
outside scanning, feedback engine lifetime no longer follows language callbacks,
offline submit preserves the queue without a network send, wallet disk writes
serialize with logout/deletion and reject stale account epochs. Tests exercise
these boundaries; they are not a ten-minute profiler result.

| Required release-device metric                                | Before       | After        | Status            |
| ------------------------------------------------------------- | ------------ | ------------ | ----------------- |
| Low-end and Aziz phone cold start <2.5s                       | Unavailable  | Unavailable  | NOT TESTED        |
| Crash-report integration startup regression <=100ms           | Unavailable  | Unavailable  | NOT TESTED        |
| Tab switch <150ms                                             | Unavailable  | Unavailable  | NOT TESTED        |
| Lists/sheet drag and Scan -> Receipt -> Rate -> Done at 60fps | Unavailable  | Unavailable  | NOT TESTED        |
| Ten-minute memory, retained camera/overlays, battery/network  | Unavailable  | Unavailable  | NOT TESTED        |
| Background/foreground/kill/relaunch with offline draft        | Test doubles | Test doubles | Device NOT TESTED |

Repeatable owner protocol: install comparable baseline/candidate release builds
on the same low-end phone and Aziz's phone, same backend/data/network and build
settings. Record device/model/RAM/OS/build/SHA/runtime; use at least five force-stop
cold launches (median/worst), both consent off/on, timing to usable first screen;
measure tab interaction to presented frame, capture frame traces while scrolling,
dragging the sheet and completing scan/rating. Run a ten-minute mixed session,
repeat background/foreground/permission revocation/kill, inspect retained native
camera/overlays, memory before/after, CPU/battery and request counts. Include
offline, high latency, empty/long lists and large fonts. Keep raw traces and
screenshots, not invented numbers. Investigate measured regressions before
changing these pending rows to PASS. No adb/Maestro/device was available here.

## Approved local browser review follow-up

User approved `react-native-web` 0.21.4 (MIT, Expo-supported). Native delegates
still use SecureStore and native useAnimatedValue; browser-only adapters enable
mock review without persistent session credentials. Verified Android no-map export
`dist/web-preview-fixed`: **6,094,528 bytes** vs pre-preview **6,095,278** (-0.012%
total), under the unchanged budget. The web session guard is absent from native
bytecode. This comparison includes adapter/environment changes and is not an
isolated dependency-size attribution. The served development web entry compiled
and returned HTTP 200; development JS size is not a production website measurement.
Device timing/frame/memory and rendered-browser QA remain separate requirements.
