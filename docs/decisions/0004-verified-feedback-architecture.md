# 0004: Verified Purchase-Feedback Architecture & Channel Decoupling

Date: 2026-10-31
Status: Accepted

## Context & Proposition

Epsilon's primary product proposition is not QR scanning or generic reviews:
**verified purchase → exact purchased dishes → structured dish-level feedback → incentive for eligible Epsilon members → restaurant analytics/intelligence**

The core restaurant value is structured intelligence on what verified customers thought about the specific dishes/items they actually purchased. QR code scanning is the current V1 input mechanism to link a physical purchase receipt to this structured flow, but the domain model must not be permanently coupled to QR codes alone. Future purchase-linking mechanisms may include digital receipt links, POS-linked transactions, or account-linked purchases (these are future possibilities and not implemented in V1).

## Architecture & Security Principles

1. **Receipt & Purchase Domain Model**:
   - The domain object is the **verified purchase/receipt**, not the camera or scanner.
   - For V1 physical receipts, the QR code encodes an opaque, unguessable, server-issued claim/reference token (e.g. `claimToken` / `receiptReference`). It must NEVER contain sensitive raw purchase, payment, or customer PII.
   - The backend server is strictly authoritative for: receipt existence, validity, expiration, claim status, item feedback eligibility, reward eligibility, reward amount, duplicate prevention, and anti-fraud controls.
   - The client displays; the server decides (client never calculates cashback or eligibility).

2. **Universal Cashback Wallet**:
   - Exactly ONE universal Epsilon cashback wallet exists per member. No restaurant-specific wallets.
   - Cashback is an incentive for eligible authenticated Epsilon members, not a prerequisite for submitting feedback. Not all feedback necessarily earns cashback (server determines eligibility and amount).

3. **Two Feedback Paths**:
   - **Path A (Authenticated Epsilon Member - Current V1 Mobile App)**:
     Scan/resolve receipt claim → review purchased dishes → submit structured dish feedback → server determines cashback eligibility → wallet credited.
   - **Path B (Accountless / Guest Feedback - Future Web Surface)**:
     Scan receipt QR → lightweight web feedback experience → structured dish feedback without an Epsilon account → submitted without cashback.
   - Terminology: use `accountless feedback` or `guest feedback` ("continue without an account"); do not promise full anonymity or invent privacy guarantees, as fraud and anti-abuse controls still apply.
   - **Boundary**: The accountless web feedback surface is NOT implemented inside this React Native repository. The mobile app's service and domain contracts simply avoid assuming that feedback submission can only ever exist from a mobile session, while preserving strict authentication and security requirements for all authenticated mobile endpoints.

4. **Restaurant Value Focus**:
   - Epsilon explicitly does NOT build restaurant discovery, reservations, table ordering, QR menus, delivery, social feeds, public generic reviews, or tipping.
   - The focus remains on item/dish-level structured customer intelligence.
