# Authentication entry review — 2026-11-02

Historical entry review; see [the expanded workflow review](AUTH_WORKFLOW_REVIEW.md)
for the subsequent auth, browser, Welcome and bundled legal changes.

Recovered source: `origin/step/28-29-final-release` at
`f7999c611ab4a96744cace1ab6cb57e374f4fe46`, newer than `a25d1f0`.
Its [GitHub CI passed](https://github.com/AzizAlizade473/Epsilon-Front-End/actions/runs/41319891935).
Local main was clean and behind remote main. All branches were fetched/pruned;
no newer auth/design branch was present. Work continues on `design/auth-completion`.
Completed roadmap history, main and release approval are preserved.

## Result

The owner's attached Welcome/Login/Register image is the primary composition
reference. Epsilon retains its real transparent logo, blue/white tokens and system
type. No reference illustration, branding, marketing copy or password form was copied.

- Welcome uses the screen as its canvas: substantial logo space, centered blue
  product headline, one supporting sentence, Login and neutral Sign Up actions.
  The enclosing card and three generic feature rows are removed.
- `/login` and `/register` are dedicated, signed-out guarded routes. Centered blue
  headings, concise intent-specific copy, existing phone field, a rounded Continue
  button, shared white Google control and quiet counterpart links form the layout.
  Registration explains profile completion and includes legal links.
- Legacy `/phone` visits redirect to Login; OTP without a challenge therefore
  also reaches the complete entry screen. Existing OTP itself is unchanged.
- Offline status is an inset, compact neutral row with a decorative Wi-Fi icon,
  localized live announcement and safe-area spacing. Unknown connectivity cannot
  falsely announce recovery. Reconnection restores Query's online state and the
  confirmation disappears after the existing interval.
- Shared compatibility additions are an opt-in white Screen surface, opt-in
  rounded/outline Button treatments and the missing browser system font fallback.
  Existing native typography and other screens' default treatments are retained.

## Contract and security

**EMAIL AUTH BACKEND SUPPORT REQUIRED**

Reviewed `docs/openapi.yaml`, `scripts/generate-openapi.cjs`,
`src/services/interfaces/index.ts` and `src/services/http/services.ts`.
Supported operations are `/auth/otp/request`, `/auth/otp/verify`, `/auth/google`,
refresh/logout and authenticated phone linking. There is no email/password,
email OTP or magic-link operation. Per the owner's latest instruction, email
controls are omitted entirely. No fake endpoint, password or successful fake
production authentication was introduced. A deployed backend was not verified.

The canonical OTP/Google contract combines identity lookup/provisioning and
returns `isNewUser` plus `nextStep`. It has no separate login/register request
intent or account-existence preflight. The two entry screens express user intent;
they never create local identities, guess account existence, merge by email or
override server onboarding. Strict existing-account-only login would require an
explicit backend contract change. No such guarantee is fabricated by this UI.

Phone formatting, validation, retry deadlines, in-memory OTP challenge, mutation
locks, session persistence, refresh and profile/phone verification remain in the
existing architecture. The phone form logic was extracted for reuse. New loading
tests cover phone/Google/cross-link locks during an outstanding request. URLs
carry no phone/code/token. Existing error mapping keeps raw server detail hidden;
unsupported account/email errors do not gain invented behavior.

Google uses the existing SDK driver, scopes, token exchange, onboarding result
and official mark. No scope or OAuth configuration changed. The control is disabled
with a localized explanation when the existing feature flag is off. Real OAuth
requires the existing client/signing setup and native device verification.

## Design and accessibility audit

Applied [Unslop by Damir Sokolovsky](https://github.com/heydamir/unslop),
CC BY 4.0, reviewed at `a6f121eee5f29c2f74976b75456feae8b66afb3a`.
Epsilon's design system takes precedence over Unslop's generic suggested values.

Direction: Epsilon helps diners rate purchased dishes and earn eligible cashback.
Character: calm, clear, assured. World: dining purchases and their verified
feedback. Color moments: the existing logo and the primary action/heading.
Signature: the real epsilon/arrow mark and purchase-specific copy.

Reviewed in the requested order:

| Pass       | Review                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Spacing    | Existing 4pt tokens; larger gaps between heading, form and actions.    |
| Color      | White canvas, token blue headings/actions, neutral borders and status. |
| Icons      | Existing Lucide back/Wi-Fi glyphs; decorative icons hidden from AT.    |
| Copy       | Concise AZ/EN/RU purchase-specific copy; distinct entry intentions.    |
| Typography | Existing system scale, centered title1; browser fallback repaired.     |
| Layout     | Open canvas, max-width column, wrapping text and scrolling forms.      |
| Details    | Loading locks, safe Back fallback, counterpart links and legal links.  |
| Visuals    | Real supplied logo only; no invented illustration or feature cards.    |
| Motion     | Existing small welcome fade/press feedback and Reduce Motion support.  |

No giant cards, nested panels, gradients, glass, shadows, badges or decorative
backgrounds were added. Screen/input text scaling remains unrestricted. Named
buttons/links, heading roles, persistent input labels, error announcements and
44pt minimum targets remain. Phone autofocus is disabled on the entry screens so
the keyboard opens deliberately; legacy phone verification behavior is retained.
Android resize and iOS KeyboardAvoidingView continue handling the keyboard.

## Verification

Browser source-app review: English at 390×844; Azerbaijani at 390×844; Russian
registration at 320×640 with scrolling to Google/legal content. No horizontal
overflow or buttons/links below 44pt were found in the measured browser DOM.
Screenshots and metrics are local ignored artifacts in `reports/auth-review/`.
These are browser previews, not native Android/iPhone or TalkBack evidence.

Real-router tests cover Welcome/Login/Sign Up/counterpart links, Back/focus reset,
legacy phone entry and scheme-validated entry links. Component/service tests cover
phone/Google handoff, unsupported email absence, disabled Google and pending locks.
Existing OTP invalid/expired/rate-limit/session tests remain. Maestro source flows
now enter via Login/Sign Up; YAML validation does not claim device execution.
The same full CI gates now run on `design/**` pushes; no threshold was lowered.

Final gate results and synchronization are recorded in `docs/PROGRESS.md`.
Physical Android/iPhone, native keyboard, TalkBack/VoiceOver, font scaling, real
SMS/Google, performance and compiled APK verification remain pending. No EAS build,
production deployment, OTA update, app submission or main merge was performed.
