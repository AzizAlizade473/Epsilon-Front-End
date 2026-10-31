# STEP 02 dependencies (DEP-1, DEP-2, PERF-1)

Aziz approved these exact versions on 2026-10-31. All are MIT licensed.

| Package                         | Version | Unpacked bytes |
| ------------------------------- | ------- | -------------- |
| react-native-reanimated         | 4.7.1   | 5,002,073      |
| react-native-worklets           | 0.13.0  | 17,827,205     |
| react-native-gesture-handler    | 3.3.0   | 3,209,635      |
| @tanstack/react-query           | 5.105.0 | 1,797,389      |
| i18next                         | 26.5.12 | 544,391        |
| react-i18next                   | 17.1.9  | 981,861        |
| @react-native-community/netinfo | 12.0.1  | 516,133        |

Native versions match installed Expo 58 bundledNativeModules.json. Reanimated
supports RN 0.86–0.88 with Worklets 0.13.x; react-i18next supports React 19,
i18next 26 and TypeScript 6. Versions and peer compatibility were checked against
published package metadata. Measure actual release bundle growth at the STEP 02
boundary; unpacked package bytes are not the runtime bundle footprint.

Use Reanimated/Gesture Handler directly for Sheet; no bottom-sheet dependency.
Keep camera, authentication network requests and other feature work off boot.
SecureStore remains the only session-token storage. Rebuild the native dev client.
