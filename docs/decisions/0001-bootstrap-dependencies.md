# Bootstrap dependencies (DEP-1, DEP-2, PERF-1)

The STEP 00 implementation uses the specified Expo/React Native/Router/TypeScript
stack and its required peers. No application features are added.

- SDK 58 is the latest stable SDK verified on 2026-10-30.
- Expo 58.0.21, React 19.3.0 and React Native 0.88.1 match the official
  blank TypeScript template 58.0.30. Router/native peers match Expo's installed
  bundledNativeModules.json. Direct versions are exact and the lockfile is tracked.
- React DOM 19.3.0 is pinned for Router's transitive Radix peer dependency.
  There is no web application implementation.
- Expo CLI 58.1.17 requests Zod 3.25.76, affected by
  https://github.com/advisories/GHSA-mrhx-c7xc-m3w5.
  A scoped override uses patched Zod 4.6.6. The CLI's two Zod-consuming schema
  modules are checked by scripts/check-toolchain.cjs, including invalid inputs.
  Remove the override when Expo supplies a patched compatible dependency.
- npm audit's high-severity gate passes. Low-severity deepmerge findings remain
  in Expo tooling; the latest deepmerge is still 4.3.1. Track upstream remediation
  for STEP 25; no audit exceptions or severity settings were changed.
- These core dependencies use permissive licenses; no optional icon, UI,
  analytics, camera, or business-feature library is imported at startup.

References consulted before implementation:

- https://expo.dev/changelog/sdk-58
- https://docs.expo.dev/router/installation/
- https://docs.expo.dev/versions/v58.0.0/sdk/router/
- https://zod.dev/v4/changelog

The first Android export establishes the bundle-size baseline in PROGRESS.md.
Device startup timing is not verified.
