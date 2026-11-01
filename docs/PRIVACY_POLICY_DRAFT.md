# Epsilon privacy policy — working draft

**LEGAL REVIEW REQUIRED BEFORE PUBLICATION.** Not an operative policy or legal
certification. Publisher/contact, lawful bases, locations, retention and rights
procedures require the centralized inputs O1–O5 in `LEGAL_TODO.md`.

Epsilon lets members verify a purchase, rate the purchased dishes and view a
server-confirmed reward in one wallet where eligible. The purchase reference
links to server records; it is not itself proof of ownership or reward eligibility.

## Information and purposes

Account and authentication processing uses phone, verification codes, session
credentials and, when enabled, Google sign-in. Profile fields include name,
email where supplied, birth date and language. They support account security,
onboarding/age controls and presentation. The mobile API does not expose provider
user IDs; backend identity verification uses the provider's verified identity.
Google access is limited to openid/email/profile sign-in scopes, not contacts,
mail contents or other unrelated Google data. Production OAuth is not yet verified.

Purchase verification processes an opaque receipt/reference and server-returned
restaurant, purchased dishes, quantities, amounts and time. Feedback contains
dish ratings, selected reasons and an optional comment. Wallet projections contain
confirmed/pending balances and transaction history. These support the purchase
feedback and incentive service; eligibility/value are decided by the server.
Feedback access for restaurants must omit name/phone under the backend handoff;
actual dashboard processing and disclosure require owner confirmation.

The camera scans receipt QR codes. The implemented scanner does not intentionally
record/upload photographs or video. Manual code entry is available. Notification
preferences and a push token are processed after explicit opt-in; permissions
can be denied. Live push configuration is pending. No location, contacts,
microphone or advertising-tracking permission is requested by this client.

Optional crash reporting is off by default and requires account consent plus a
configured Sentry project. It sends generic JavaScript error type, normalized
bundle frames/debug IDs and app build metadata; arbitrary messages, user payloads,
requests, breadcrumbs and screenshots are discarded. Native crash caching,
tracing, replay and profiling are disabled. Opt-out stops further collection but
cannot recall an already permitted in-flight request. Vendor connection metadata,
retention and real ingestion must be verified before enabling production reporting.

## Storage, recipients and security

The technical inventory in `DATA_INVENTORY.md` records current client storage:
SecureStore for session credentials, memory for query projections and verification
input, and account-scoped AsyncStorage for feedback retry, crash consent and a
bounded wallet/transaction display cache. The latter contains server balances and
transaction metadata (including purchase/restaurant references), at most 12 query
records, three history pages and 250,000 serialized characters per account. It is
stale display data, cannot authenticate a user or authorize a financial action,
and is cleared on logout/deletion. AsyncStorage is app-local sandbox storage;
application-level encryption is not claimed. No profile, receipt, comment, OTP
or session query is persisted by the wallet cache. Backend retention is separate.
An offline feedback queue is bounded to 20 entries and pruned using trusted time;
this does not define backend retention. Logout/deletion clears known account
storage. Copying a transaction reference is an explicit user action into the OS
clipboard, whose lifecycle is OS managed.

Production API transport requires HTTPS. The client does not establish encryption
of backend databases/backups or vendor storage. Those controls, locations, staff
access and schedules must be supplied under O4/O5. Potential service participants
are the Epsilon backend, Google sign-in, Expo/push infrastructure and optional
Sentry. Hosting/SMS/POS operators and vendor roles are unconfirmed; development
tools are not automatically customer-data processors. No ads/tracking/data-sale
code is implemented; final service-wide disclosures require owner verification.

## Retention, deletion and choices

The app provides account deletion in Profile → Privacy and security, with fresh
authentication and typed confirmation. It sends a backend deletion request;
only a successful response triggers local account/session cleanup. **ACCOUNT
DELETION BACKEND VERIFICATION PENDING.** This draft does not promise that ledger,
pending rewards, audit, backups or vendor records disappear immediately. Approved
retention exceptions and reward consequences must be explained before launch.

The owner must provide a public web deletion path usable without reinstalling
the app, identity-verification safeguards, follow-up and support. Rights,
consent withdrawal, correction/access requests, applicable jurisdictional rules
and response periods need counsel-approved wording and O1/O5 contacts. Do not
send OTPs/tokens/purchase claims to a generic support form. Language and crash/
notification preferences are available in settings; OS permission controls also
apply. An account-deletion web specification is in `STORE_READINESS.md`.

## Publication and changes

Insert approved entity/contact and effective-version details from the owner
register, confirm vendor/backend behavior, resolve age/retention/transfer issues,
obtain legal review and appropriate translations, and host the approved policy.
Any notice/consent process for material changes must be selected by counsel;
this draft does not invent one.
