# Incident response — operating draft

OWNER INPUT REQUIRED: assign the incident lead and private escalation contacts
under O6 in `LEGAL_TODO.md`. No named on-call, SLA or notification deadline has
been supplied. **LEGAL REVIEW REQUIRED** for breach assessment and notifications.
This runbook prepares decisions; it does not authorize destructive actions or
send messages, revoke live keys, restore databases or deploy updates itself.

| Role                   | Responsibility                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| Incident lead          | Severity, incident timeline, containment approval and coordination        |
| Backend/security owner | Authorization, token/key scope, evidence and data exposure assessment     |
| Operations owner       | Service health, safe rollback, backups/restore and reconciliation         |
| Mobile owner           | Version gate, safe client behavior, compatible preview/native remediation |
| Privacy/legal owner    | Jurisdiction, recipients, lawful retention and notification decisions     |
| Support/comms owner    | Approved user/store/restaurant communications and follow-up               |

## Detect and triage

Open a private incident record with time, build/release, symptom, scope and opaque
request IDs. Do not copy raw tokens, OTPs, phone/email, purchase references or
comments into logs, public issues or chat. Monitor auth/reuse anomalies, error
rates, ownership failures, ledger/reward inconsistencies and failed background
jobs. Determine outage vs suspected privacy/security event; preserve evidence
and restrict access. No live Sentry/backend monitoring is claimed verified here.

## Contain safely

Identify affected accounts, endpoints, releases, providers and data classes.
Backend owner can restrict the affected server operation or enforce minimum
versions; do not invent client-side balances/eligibility as a workaround.
For compromised credentials, owners identify scope, revoke affected sessions /
refresh-token families and rotate relevant backend/provider/build keys through
their approved consoles. Confirm device associations and cached access expiry.
Do not blindly rotate every key, expose values in commands, or break the only
recovery path. Client logout alone does not revoke backend sessions.

For suspected duplicate rewards, preserve append-only ledger records, stop the
affected issuance path as approved, reconcile keys/source transactions and
correct through audited compensating rows. Never edit history or ask the client
to calculate a corrected authoritative balance. Preserve feedback outbox payloads
and idempotency results through recovery; avoid retry storms and double commits.

## Investigate and assess notification

Build a restricted timeline from minimal request IDs, versions, audit records
and access evidence. Separate confirmed facts, hypotheses and unknowns. Determine
which records/recipients were affected, exposure period and whether authorized
access controls failed. Legal/privacy owner decides applicable authorities,
users, processors and contractual recipients, required contents and deadlines.
No universal breach deadline or claim of no reportable harm is assumed.
Support sends only approved factual notices; maintain updates/corrections and a
private notification decision log. This repository sends no incident messages.

## Recover and rollback

Prefer the last known-good reviewed backend deployment using compatible
expand/contract migrations. Restore encrypted backups only through the approved,
tested restore process and RPO/RTO, verifying integrity, ledger consistency and
idempotency coverage before reopening writes. Do not erase production or roll
back financial data without explicit operations/financial approval.

For mobile changes, reproduce in preview, test auth/account isolation, purchase
ownership, replay and wallet projections, then use the reviewed release gate.
An OTA must match the installed native runtime; any native module/configuration
change requires a new version/build. Current OTA prerequisites are incomplete,
so do not assume OTA is an available emergency remedy. Production publishing is
outside this batch. Avoid deleting evidence or uploading source maps/events with
private payloads while diagnosing.

## Close and learn

Reconcile purchases, feedback and ledger/source accounts; verify revoked sessions
and rotated credentials, restored backup tests and monitoring. Record data
deletion/retention decisions, affected-user follow-up and store/vendor actions.
Assign corrective changes and realistic regression tests, owner and review date.
Run a tabletop exercise and a restore test before launch; neither has run here.
