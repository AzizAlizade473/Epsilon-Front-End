# Epsilon

Android-first verified dish feedback from linked purchases, with one universal
server-authoritative rewards wallet. Built with Expo Router and React Native.

Start with [development setup](docs/DEV_SETUP.md), [current progress](docs/PROGRESS.md)
and [architecture](docs/ARCHITECTURE.md). Use `npm ci`, configure an ignored local
environment from `.env.example`, rebuild the development client after native
changes and run `npm start`. Never use example legal/support values as launch proof.

`npm run check` is the engineering gate. The [final audit](docs/FINAL_AUDIT.md),
[QA matrix](docs/QA_MATRIX.md), [performance report](docs/PERF_REPORT.md) and
[release gate](docs/RELEASE_GATE.md) distinguish automated evidence from pending
device/backend/legal verification. `npm run release:gate` deliberately blocks
public promotion until required external evidence exists. No publishing is automatic.

Every user-facing design follows the [Epsilon Design System](docs/DESIGN_SYSTEM.md)
and receives an Unslop review. The original engineering roadmap and public launch
approval are separate: no public launch is approved by this repository's tests.
