# Android audit — STEP 22

Recorded 2026-11-01. Configuration and automated tests are available on this PC;
an Android SDK, adb, physical phone and release merged manifest are not available.
An Android JavaScript export is not an APK or native verification.

| Check                                     | Result                                     | Evidence / remaining verification                                                                                                      |
| ----------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Feature permissions                       | PASS (configuration)                       | CAMERA and opt-in POST_NOTIFICATIONS only; unused permissions blocked.                                                                 |
| Backup / cleartext                        | PASS (configuration)                       | `allowBackup=false`; release build properties disable cleartext.                                                                       |
| Native crash automatic initialization     | PASS (configuration)                       | Sentry plugin native init disabled; no upload secret in public config.                                                                 |
| Merged manifest / exported components     | NOT VERIFIED                               | Supply the actual preview/release merged manifest to the audit command below.                                                          |
| Icons / white static splash               | PASS (assets/configuration)                | Real 1024px PNG foreground, flat and monochrome assets; static epsilon placeholder on white. Production logo approval remains pending. |
| Android 12+ splash held through bootstrap | NOT VERIFIED (device)                      | Existing bootstrap hold retained; inspect cold launch on Android 12+. No new animated logo.                                            |
| Insets / dark status icons                | NOT VERIFIED (device)                      | Test gesture and three-button navigation on every screen.                                                                              |
| Keyboard / primary actions                | NOT VERIFIED (device)                      | Test Samsung and Google keyboards, small display and OTP autofill.                                                                     |
| Hardware Back / update gate               | PASS (source/tests); NOT VERIFIED (device) | Required update gate blocks Back; inspect navigation across the complete app in preview.                                               |
| SMS autofill without READ_SMS             | NOT VERIFIED (device)                      | No READ_SMS permission requested; verify a real backend OTP on a phone.                                                                |
| Notification channel / opt-in permission  | NOT VERIFIED (device)                      | Existing toggle-gated setup retained; test denied/granted/revoked states with real push configuration.                                 |
| 360dp / 1.3x font scale                   | NOT VERIFIED (device)                      | Check wrapping, scrolling and action visibility throughout the app.                                                                    |
| TalkBack                                  | NOT VERIFIED (device)                      | Check reading order, labels, focus, errors and actions throughout the app.                                                             |

Run `npm run android:audit` for configuration checks. After building preview,
run `npm run android:audit -- --manifest PATH_TO_RELEASE_MERGED_MANIFEST --require-native`.
Missing native evidence fails this strict command rather than silently passing.
The manifest audit permits necessary normal/signature network SDK permissions
alongside the two feature permissions. Any exported SDK component outside the
launcher requires explicit security review; the script does not waive it.
The final STEP 29 manifest check also requires an explicit target SDK >=36,
matching the current Play policy linked in RELEASE_ANDROID.md. This validates a
supplied artifact manifest; it does not establish native ABI/16 KB compatibility.

Owner follow-up: rebuild the development client and preview APK, install on the
target phone, perform the device rows above and attach actual results. Record
failures and fix them before claiming the native audit passed.

Unslop source review covered offline/reconnect, error/retry, toast, not-found and
update states in spacing → color → icons → copy → typography → layout → details
→ visuals → motion order. They reuse Epsilon tokens, localized plain copy,
existing controls and restrained status colors. No decorative cards, gradients,
glows or new logo animation. Offline motion respects Reduce Motion. Visual and
accessibility verification on an actual Android build remains pending.
