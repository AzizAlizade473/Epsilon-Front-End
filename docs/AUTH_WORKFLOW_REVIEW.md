# Authentication workflow review — 2026-11-02

Branch: `design/auth-completion`. Main, deployment and public release are unchanged.
This review supersedes the earlier auth-entry review for the expanded workflow.

## Answers and resulting behavior

Google is unavailable in the browser because the installed integration is native-only.
Native use also needs the real OAuth client/signing configuration, feature flag and
server token verification. No provider configuration or fake browser login was added.
The combined live auth contract cannot safely distinguish existing-only Login from
registration before provisioning. Explicit entry intents therefore fail closed until
the backend implements that capability. This is a material live-auth limitation.
See [the backend handoff](AUTH_WORKFLOW_BACKEND.md), including email OTP support,
which the current backend contract does not expose.

Logout previously crashed before confirmation because Sheet called native
`findNodeHandle` on web. A platform focus adapter now uses DOM focus on web and
retains native accessibility focus. Browser confirmation and logout both passed.
Logout remains separate from deletion; local cleanup does not prove server erasure.

The old development fixture always returned an existing, completed profile.
Fixtures now distinguish new registration, existing Login and duplicate/conflicting
identities. A new phone registration reaches name/surname setup after OTP verification.
Birth date and the server-configured age gate remain, as explicitly requested.
Completed returning accounts skip repeated profile setup. OTP layout is preserved.
Intent stays in the in-memory challenge; identity details are not added to URLs.

Actual browser testing also exposed synthetic offline status and a configuration
query waiting on itself. Web connectivity now respects the connection state without
an external reachability probe; native reachability remains unchanged. Fresh and
cached server onboarding rules both publish correctly. Production cache TTL is unchanged.

## Visual and legal scope

Welcome uses Epsilon's logo, blue/light-blue tokens, an open composition and a
receipt/rating SVG with a short entrance animation. Reduce Motion renders it static.
No looping animation, gradient, giant card or unsupported provider option was added.
Login/Sign Up retain the existing phone architecture and localized Google explanation.
The rest of the app was not redesigned.

Welcome/Login/Sign Up/Profile legal links open bundled, scrollable public readers.
Terms has 18 sections and Privacy has 16, independently translated in AZ/EN/RU.
Both show draft status, locale-dependent content, date and version `draft-2026-11-02`.
Back preserves the entered phone number. These documents work without fetching a URL.
They do not create a consent record or replace required hosted store resources.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC RELEASE.** Entity/contact details, jurisdiction,
age-policy approval, retention/deletion rules, reward terms and legal/translation
approval remain tracked in [LEGAL_TODO.md](LEGAL_TODO.md). No missing legal fact was invented.

Visual audit used [Unslop by Damir Sokolovsky](https://github.com/heydamir/unslop/tree/main),
CC BY 4.0, revision `a6f121eee5f29c2f74976b75456feae8b66afb3a`.
Spacing, color, icons, copy, type, layout, details, visuals and motion were reviewed
against Epsilon's existing tokens and the owner's references. Two browser review
rounds included a final 390×844 Welcome capture and the logout confirmation.

## Verification and limits

- Full `npm run check`: 103 suites / 601 tests; unchanged quality thresholds pass.
- Coverage: statements 84.15%, branches 75.71%, functions 80.39%, lines 86.61%.
- Lint, strict TypeScript, 358 base localization keys, formatting, production guards,
  supply chain, Android configuration, workflows, OpenAPI and release evidence pass.
- Android Hermes export: 6,162,572 bytes versus 6,107,845 baseline (+0.90%; limit 10%).
- Online Expo dependency compatibility passes; dependencies and lockfile are unchanged.
- Production audit: zero high/critical; existing 1 low / 32 moderate findings remain.
- Pinned Gitleaks: 127 commits scanned, no leaks found before final documentation.
- [Implementation CI passes at 2592b0c](https://github.com/AzizAlizade473/Epsilon-Front-End/actions/runs/41482232223).

Headless Chrome exercised Signup → Terms/Back → phone OTP → name/surname/date →
Home → Profile → logout confirmation → Welcome, using development fixtures only.
No real SMS, Google exchange or live account creation was performed. Local screenshots
and journey evidence are in ignored `reports/auth-workflow/`; `welcome-final.png`
is the final Welcome capture. Automated tests also cover conflict navigation,
duplicate registration, phone ownership, deletion fixtures and cached/fresh config.

Real Android SMS/Google, TalkBack, device font scaling, merged APK permissions and
device performance remain pending. Android export does not prove those checks.
Live intent-aware auth, email OTP and deletion/retention verification require backend
work. The existing release NO-GO and external release evidence remain unchanged.
No security or quality check was bypassed, and no public build was deployed.
