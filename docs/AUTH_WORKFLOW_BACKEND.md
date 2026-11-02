# Authentication workflow handoff

**AUTH INTENT BACKEND SUPPORT REQUIRED**

The current canonical `/auth/otp/request`, `/auth/otp/verify` and `/auth/google`
operations combine account lookup/provisioning. `isNewUser` arrives after the
operation; checking it then cannot prevent an unwanted account creation.
Strict Login must not call that combined provisioning operation speculatively.

The frontend interface now carries a local `login | register` intent. The current
live adapter rejects it before network I/O. No new endpoint or unrecognized body
field is sent. Legacy reauthentication/linking contracts remain available.
Development fixture support is explicitly separate from live backend support.

Backend implementation must define and verify an explicit intent-aware contract:

- Login: verify identity, return an existing account or an account-not-found
  outcome, and never provision an identity/account as a side effect.
- Registration: verify ownership, create only when genuinely new; return an
  existing-account/conflict outcome without duplicating or merging identities.
- Account enumeration/rate limits, idempotency, normalized errors and identity
  ownership must be enforced server-side; never auto-link by matching email.
- Document whether intent is part of a bound challenge, request or separate
  operation. Publish/verify OpenAPI before enabling the live capability.
- Preserve server-directed profile/phone steps and the existing minimum-age rule.
  The owner explicitly retained birth date and the age gate on 2026-11-02.

**EMAIL OTP BACKEND SUPPORT REQUIRED**

There is no email OTP challenge or verification operation. Required future
contract: normalized email, intent-bound expiring challenge, six-digit-code
verification, server retry deadline/attempt limits, stable identity ownership,
the same existing/new/conflict outcomes and server-issued sessions. Do not add
passwords, client-only sessions or invent URLs while these are absent.

Google requires a real OAuth web client ID, Android application/signing setup,
the existing feature flag and native build, plus server ID-token verification.
The installed integration is native-only; browser preview is not real Google
authentication. See [Google backend authentication](https://developers.google.com/identity/sign-in/android/backend-auth).
No flag or credential is fabricated by this task.

**ACCOUNT DELETION BACKEND VERIFICATION REQUIRED**

The existing deletion request/reauthentication/confirmation remains separate from
logout. Only a successful backend deletion response permits local deletion-success
cleanup. Live erasure, retention and external deletion-request handling remain
release gates; local token removal never proves account deletion.
