# Store readiness — Android first, internal drafts

**LEGAL REVIEW REQUIRED BEFORE PUBLICATION.** No listing, form, screenshot,
deletion web page, store submission or approval has been published. Owner inputs
are centralized as O1–O8 in `LEGAL_TODO.md`. Policies checked 2026-11-01; recheck
at STEP 29. Technical readiness does not equal legal/store approval.

## Listing copy — drafts for owner review

App name: **Epsilon** (configured name; owner must confirm final listing/rights).
Category, subtitle, keywords, support/contact, age rating and distribution regions
remain O1/O7 decisions. Do not claim restaurant partnerships or coverage from
mock fixtures. Conditional reward copy must match the approved program.

| Locale | Short description draft                                |
| ------ | ------------------------------------------------------ |
| AZ     | Təsdiqlənmiş alışlarınızdakı yeməkləri qiymətləndirin. |
| EN     | Rate the dishes from your verified purchases.          |
| RU     | Оценивайте блюда из подтверждённых покупок.            |

**AZ full description draft:** Epsilon ilə alışınızı təsdiqləyin və həmin alışda
olan yeməklər barədə rəy bildirin. Partnyor alışının qəbzindəki QR kodu skan edin
və ya qəbz kodunu daxil edin. Serverin qaytardığı yeməkləri qiymətləndirin, səbəbləri
seçin və istəsəniz şərh yazın. Uyğun olduqda, serverin təsdiqlədiyi keşbeki vahid
balansda və əməliyyat tarixçəsində görün. Keşbekin uyğunluğu və məbləği proqramın
təsdiqlənmiş qaydalarına əsaslanır. Hesab, dil və məxfilik seçimlərini profildə
idarə edin. Qeyd: tərəfdaş alışlarının mövcudluğu buraxılışdan əvvəl təsdiqlənməlidir.

**EN full description draft:** Verify a purchase and give feedback on the dishes
you bought. Scan the purchase receipt's QR code or enter its reference code.
Rate the dishes returned by the verification service, choose reasons and add an
optional comment. Where eligible, view server-confirmed cashback in one wallet
and transaction history. Eligibility and amounts follow the approved program
rules. Manage your account, language and privacy choices in Profile. Supported
purchase integrations must be confirmed before this copy is published.

**RU full description draft:** Подтвердите покупку и оставьте отзыв о купленных
блюдах. Отсканируйте QR-код чека или введите его код. Оцените блюда, полученные
от сервиса проверки, выберите причины и при желании добавьте комментарий.
При выполнении условий программы подтверждённый сервером кешбэк отображается
в едином кошельке и истории операций. Право на вознаграждение и его размер
определяются утверждёнными правилами программы. Управляйте аккаунтом, языком и
настройками конфиденциальности в профиле. Поддерживаемые интеграции покупок
нужно подтвердить до публикации этого текста.

This is metadata drafting, not translation of approved binding legal terms.
Professional/legal review of final AZ/EN/RU wording is pending. No delivery,
reservations, QR menus, public social feed, investment or cash-withdrawal claim.

## Google Play submission inputs

| Input                                                       | Status / owner action                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| App name, category, target audience/regions, content rating | O7, questionnaire not submitted; do not infer a rating from default minimum age 16                                       |
| Support contact and public Privacy Policy                   | O1/O2, verify functional HTTPS resources and ownership                                                                   |
| Terms / Rewards Terms                                       | O2/O3, approved program/legal source text and links pending                                                              |
| Data safety                                                 | Draft below; verify actual backend/SDK traffic, purposes and sharing                                                     |
| App access                                                  | Backend-scoped review account/fixed OTP/demo receipt plan in API_CONTRACT.md; credentials only in private console fields |
| Account deletion                                            | In-app path exists; actual backend deletion pending; public web resource specified below                                 |
| Camera / notifications                                      | QR scanning, no intentional photo/video capture; opt-in notification flow; merged manifest/device proof pending          |
| Icons, feature graphic, screenshots                         | Production branding/trademark approval and real-build capture pending                                                    |
| Testing/release/access requirements                         | Owner must inspect actual Play account/track requirements at release; no test enrollment or publishing performed         |

Google's current account-deletion guidance requires an accessible external request
path for applicable account-based apps, including users without the installed
app. It must identify the app/developer and let users request deletion, not send
them back to reinstall. Retained data and additional steps need clear disclosure.
[Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).

### Data safety working mapping

| App data / behavior                              | Candidate declaration / verification                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phone, name, email, account ID, birth date       | Personal info (including other info for birth date as applicable); account/functionality/security purposes; owner confirms exact console categories and required/optional flags |
| Receipt dishes/amounts/time, wallet transactions | Purchase history / other financial information as applicable; no card/bank credentials collected by this client                                                                 |
| Ratings, reasons, optional comment               | App activity / other user-generated content; verify restaurant access and sharing treatment                                                                                     |
| Optional scrubbed JS crash event                 | Crash logs/diagnostics as applicable; consent off by default; verify vendor processing and connection metadata                                                                  |
| Push token / server connection metadata          | Device/other identifiers and IP-derived practices require actual SDK/backend review                                                                                             |
| Camera QR scanning                               | No intentional image/video upload; purchase-reference transmission still disclosed under its data category                                                                      |
| Ads / tracking / sale                            | None implemented in mobile code; service-wide final answers require owner/vendor confirmation, not assumed “No”                                                                 |
| Transport / deletion                             | Client production HTTPS enforced; backend/vendor deletion and encryption controls unverified                                                                                    |

Do not answer “no collection” because data is pseudonymous or optional. Assess
sharing and service-provider exceptions against actual recipients/contracts;
restaurant access is not automatically exempt. Final forms require O4/O5 sign-off.
[Official Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

Private comments require an applicability/moderation review; public posting is not
implemented. Determine any required reporting, blocking, terms acceptance and
moderation controls before exposing restaurant/user interactions. Do not assume
a private-feedback product is automatically exempt from UGC policy.
[Google Play UGC policy](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en).

## Public account-deletion web page specification

This is a specification, not a deployed website or new API. O2 supplies the real
HTTPS URL; O1/O5 supply accountable contacts, verification and retention wording.

1. Display Epsilon/publisher identity and a prominent account-deletion heading.
2. Provide an accessible request form or approved support request route usable
   without the app. Collect only the minimum identifier/contact needed; never
   ask for password, OTP, access/refresh token, Google token or purchase claims.
3. Explain account/data deletion scope and approved retained-record categories,
   reasons/durations, pending balance/reward treatment and any necessary steps.
   Unknown terms are launch blockers, not promises of instant/full erasure.
4. Use HTTPS, generic non-enumerating acknowledgement, abuse/rate protection,
   private handling, controlled identity proof and audit. Do not authorize deletion
   from a link/query parameter or send sensitive identity details in URLs/logs.
5. Describe approved response expectations/support; use accessible AZ and approved
   translations. Test keyboard/screen-reader/mobile layout on the actual page.
6. Owner verifies successful requests through backend deletion/vendor cleanup,
   records retention exceptions and enters the functional URL in Play Console.

**ACCOUNT DELETION BACKEND VERIFICATION PENDING.** In-app Profile → Privacy and
security → Delete account requires reauthentication and typed confirmation,
then DELETE `/me`. Only success clears local state. Public requests must reach
an approved backend process; a local-only logout is not account deletion.

## Future Apple submission inputs

Keep Android-first scope explicit. Owner must supply App Store name/subtitle,
description/keywords/category, support/privacy URLs, ratings/audience, app-privacy
answers, device screenshots and review notes/access. No iOS store entry exists
as a result of this work. Review login-service equivalence rules if Google login
is enabled on iOS, in-app deletion and provider-token revocation. Apple sign-in
and Apple authorization-code deletion are deferred, not certified by Android.
[Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/),
[Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

## Screenshots and permission review plan

Capture real approved preview/native builds: Home → scan → verified receipt →
dish rating → server-confirmed result → universal wallet/history → profile/privacy.
Restaurants is supporting context, not discovery positioning. Use an isolated
owner-approved review dataset with no real personal data and truthful integration
claims; existing “Demo” fixtures and fabricated production balances must not
appear in public store assets. Do not generate mock screenshots or partner logos.
Capture AZ/EN/RU and required device sizes only after design/native QA, using
approved brand assets and actual app states. Hide personal references/notifications
without falsifying financial results; obtain permission for visible trademarks.

Audit camera rationale in AZ/EN/RU (QR scanning only), manual fallback, optional
notification explanation, denial/Settings recovery and actual merged permissions.
No location/contacts/microphone/photo-library/tracking permission is added.
Physical camera, SMS autofill, notifications, Back/insets/keyboard, 1.3× fonts,
TalkBack, cold start and live Google/Sentry/backend/push checks remain pending.
No new customer-facing layout or screenshot asset was created in this batch.
