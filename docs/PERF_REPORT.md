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
