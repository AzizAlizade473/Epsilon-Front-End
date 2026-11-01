# Android mock journey tests

Requires a rebuilt development client, running Metro, Android device/emulator
and the external Maestro CLI. No Maestro npm/runtime dependency is added.
These flows are authored and locally YAML-validated; device execution is NOT
VERIFIED on this PC. Do not treat this suite as evidence of physical camera,
Google OAuth, real SMS, push, backend accounting or native behavior.

Start Metro with `.env.example` values plus `EXPO_PUBLIC_E2E=true`,
`ENABLE_GOOGLE_SIGNIN=true` and the synthetic client ID
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=maestro.apps.googleusercontent.com`.
Use AZ locale and `com.epsilonup.app`, open the development client connected to
Metro, dismiss developer overlays, then run `maestro test .maestro`.
Install Maestro using its official instructions: https://docs.maestro.dev/.

The explicit development + mock + E2E seam bypasses only the native Google SDK,
returns an incomplete mock user and selects OTP/receipt errors from fixed test
inputs. Production profile validation rejects the flag, and `__DEV__` prevents
it in installed release builds. No deep link can enable it or execute an action.
The existing manual receipt-entry UI injects opaque mock references; real QR
ownership verification remains a backend responsibility.

Happy-path wallet changes are fixed mock-server projections (34.50 to 37.00),
never sums or incentive calculations in app UI. Mock server memory resets on
process death; flow 4 verifies durable local replay/removal and documents that
limitation. The persistent-server-double Jest replay test proves the same key
returns the same result after the server commits and the first response is lost.
Real reward deduplication requires backend integration verification.

Flow 4 temporarily enables airplane mode; restore it if the run is interrupted.
An offline dev-client restart may require a cached bundle/Metro reconnection;
record actual device behavior instead of weakening the assertions. OS permission
dialog wording and keyboard behavior may require device-specific selectors.
