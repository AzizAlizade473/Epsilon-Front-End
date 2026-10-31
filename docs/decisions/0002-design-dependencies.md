# STEP 01 dependencies (DEP-1, DEP-2, SEC-8)

Aziz approved these exact packages on 2026-10-31. Existing versions remain pinned.

| Package                             | Version | License | Unpacked bytes |
| ----------------------------------- | ------- | ------- | -------------- |
| lucide-react-native                 | 1.65.0  | ISC     | 31,719,548     |
| react-native-svg                    | 15.16.0 | MIT     | 3,827,726      |
| expo-haptics                        | 58.0.7  | MIT     | 96,182         |
| @testing-library/react-native (dev) | 14.1.0  | MIT     | 870,943        |
| test-renderer (dev)                 | 1.3.1   | MIT     | 265,747        |

Native versions match installed Expo 58's bundledNativeModules.json. SVG supports
Fabric; Lucide supports React 19 and SVG 15. RNTL 14 requires React 19 and
test-renderer 1, rather than react-test-renderer. Its async render APIs and
automatic matchers are documented in the installed README; no extend-expect
setup entry is needed. Development-only packages have no release bundle impact.
Unpacked package size is not runtime bundle size; measure exports at 01.h.

Haptics declares VIBRATE in its library manifest. Block that permission and use
performAndroidHapticsAsync on Android, which uses View.performHapticFeedback.
Rebuild the development client after these native additions. Device verification
and the final merged-manifest audit remain pending.

The generated npm lockfile exceeds the micro-step's implementation line budget;
it is kept intact for reproducible installation.
