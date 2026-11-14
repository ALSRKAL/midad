# BUSINESS_RULES — Midad

> Every rule carries an id, names the service that owns it, and names the unit/integration tests
> that cover it. A rule without a passing test is a bug: the change that introduces it cannot ship.

Conventions used in this file:

- **Owner** = the only module allowed to implement the rule. Everything else calls it.
- Test names always start with the rule id, e.g. `BR-07: rejects expired coupon`.
- Money is always an integer in minor units (halalas/cents) — see BR-05.

## Index

Rules implemented so far point at their real module and test. Rows marked _(planned)_ name the
module the later phase will create; they are not an existing path.

| Rule  | Area                                         | Owner module                                               | Test file                                     |
| ----- | -------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| BR-01 | Course lifecycle state machine               | `lib/course-state.ts`                                      | `tests/unit/lib/course-state.test.ts`         |
| BR-02 | Submit-for-review checklist                  | `server/course-checklist.ts`                               | `tests/e2e/instructor-builder.spec.ts`        |
| BR-03 | Editing a published course                   | `server/instructor-courses.ts`, `server/course-publish.ts` | audit rows verified                           |
| BR-04 | Archived course keep-access                  | `features/courses/services.ts` (planned)                   | `tests/unit/courses/archived-access.test.ts`  |
| BR-05 | Integer money                                | `lib/money.ts`                                             | `tests/unit/lib/money.test.ts`                |
| BR-06 | Pricing order + banker's rounding            | `lib/money.ts`, `features/cart/services.ts`                | `tests/unit/cart/pricing.test.ts`             |
| BR-07 | Coupon rules                                 | `features/coupons/services.ts`                             | `tests/unit/coupons/coupon-rules.test.ts`     |
| BR-08 | Enrollment from verified webhook, idempotent | `features/checkout/services.ts`                            | `tests/integration/webhooks/stripe.test.ts`   |
| BR-09 | No double purchase / no self purchase        | `features/checkout/services.ts`                            | `tests/unit/checkout/eligibility.test.ts`     |
| BR-10 | Refund window and reversal                   | `src/server/refunds.ts` + `src/server/admin/refunds.ts`    | `tests/unit/refunds/refund-rules.test.ts`     |
| BR-11 | Instructor share, frozen at sale             | `src/lib/earnings-rules.ts`                                | `tests/unit/earnings/share.test.ts`           |
| BR-12 | Append-only ledger                           | `src/server/earnings.ts` + DB trigger                      | `tests/integration/finance.test.ts`           |
| BR-13 | Payout availability, minimum, single pending | `src/lib/payout-rules.ts` + `src/server/earnings.ts`       | `tests/unit/earnings/payout-rules.test.ts`    |
| BR-14 | Lesson completion (90% watched)              | `features/progress/services.ts`                            | `tests/unit/progress/completion.test.ts`      |
| BR-15 | Course progress percentage                   | `features/progress/services.ts`                            | `tests/unit/progress/course-progress.test.ts` |
| BR-16 | Quiz pass mark, attempts, server timer       | `features/quizzes/services.ts`                             | `tests/unit/quizzes/quiz-rules.test.ts`       |
| BR-17 | Certificate issuance, once, random code      | `features/certificates/services.ts`                        | `tests/unit/certificates/issuance.test.ts`    |
| BR-18 | Review eligibility + denormalized rating     | `src/server/reviews.ts`                                    | `tests/unit/reviews/review-rules.test.ts`     |
| BR-19 | Discussion ownership and permissions         | `features/discussions/services.ts`                         | `tests/unit/discussions/permissions.test.ts`  |
| BR-20 | Signed URLs for paid content                 | `features/player/services.ts`                              | `tests/integration/player/signed-url.test.ts` |
| BR-21 | Ban invalidates sessions and hides content   | `features/admin/services.ts`                               | `tests/integration/admin/ban-user.test.ts`    |

---

## Course lifecycle

### BR-01 — Course status transitions

**Rule.** `DRAFT → PENDING_REVIEW → PUBLISHED | REJECTED`; `REJECTED → DRAFT`;
`PUBLISHED → UNLISTED | ARCHIVED`. Any other transition is rejected by the server.

**Owner.** `features/courses/services.ts#transitionCourse` — a single centralized state machine
(`COURSE_TRANSITIONS` map). No other module may assign `Course.status` directly.

**Tests.** One case per allowed transition and one per disallowed pair (full cartesian product):

- `BR-01: allows DRAFT → PENDING_REVIEW`
- `BR-01: rejects PUBLISHED → DRAFT`
- `BR-01: rejects ARCHIVED → PUBLISHED`
- `BR-01: every undefined transition throws InvalidCourseTransition`

### BR-02 — Submit-for-review checklist

**Rule.** A course may move to `PENDING_REVIEW` only when **all** hold:

1. title and description present in at least one language;
2. cover image set;
3. ≥ 3 learning objectives;
4. ≥ 1 section containing ≥ 5 lessons;
5. every lesson is either a fully processed video or ≥ 200 characters of text content;
6. a price is set (or the course is explicitly free).

**Owner.** `features/courses/services.ts#computeSubmitChecklist` returns
`{ passed: boolean, items: ChecklistItem[] }` so the UI lists _every_ unmet item, not just the first.

**Tests.** `BR-02: blocks submit when fewer than three objectives`,
`BR-02: blocks submit when a video lesson is still PROCESSING`,
`BR-02: blocks submit when text lesson has 199 characters`, `BR-02: passes with the minimum valid course`,
`BR-02: reports all failing items at once`.

### BR-03 — Editing a published course

**Rule.** Editing a published course does not unpublish it. Adding lessons publishes them
immediately. Changing price or title **must** write an `AuditLog` row.

**Owner.** `features/courses/services.ts#updateCourse` (diffing the previous entity).

**Tests.** `BR-03: adding a lesson keeps status PUBLISHED`,
`BR-03: price change writes an audit entry`,
`BR-03: title change writes an audit entry`,
`BR-03: description-only edit writes no audit entry`.

### BR-04 — Archived course

**Rule.** An archived course is hidden from search and cannot be purchased, but existing
enrollments keep access forever.

**Owner.** `features/courses/queries.ts#publishedCourseFilter` +
`features/enrollment/services.ts#assertCourseAccessible`.

**Tests.** `BR-04: archived course excluded from catalog queries`,
`BR-04: archived course cannot be added to cart`,
`BR-04: enrolled student still opens archived course lessons`.

---

## Pricing and payment

### BR-05 — Integer money

**Rule.** All amounts are stored and computed as integers in the smallest currency unit
(halalas/cents). Floats are forbidden for money.

**Owner.** `lib/money.ts` (`Money = { amount: number /* int */, currency: Currency }`, `add`, `sub`,
`multiplyByRate` with banker's rounding, `format`). ESLint bans `parseFloat`/`Number(...)` on money fields
via a `no-restricted-syntax` rule scoped to `features/*/services.ts` and `lib/money.ts`.

**Tests.** `BR-05: rejects non-integer amounts`, `BR-05: multiplyByRate rounds half-to-even`,
`BR-05: refuses to mix currencies`, `BR-05: format(locale=ar) renders ر.س`.

### BR-06 — Canonical pricing order

**Rule.** `subtotal = Σ unitPrice`; `discount = Σ applied coupon discounts`; `taxable = subtotal − discount`;
`tax = round(taxable × VAT)`; `total = taxable + tax`. Rounding is banker's rounding on the halala.
The price is recomputed on the server when the checkout session is created; **no client-supplied price
is ever accepted.**

**Owner.** `lib/money.ts#quote` (pure) called by `features/cart/services.ts`.

**Tests.** `it.each` table with ≥ 30 cases (`tests/unit/cart/pricing.test.ts`) including:
`BR-06: 100% discount yields zero total`, `BR-06: fixed discount larger than price floors at zero`,
`BR-06: rounds 0.5 halala half-to-even`, `BR-06: VAT 15% on 99.99 SAR`,
`BR-06: ignores client-supplied price`, `BR-06: currency mismatch between cart items is rejected`,
plus one case per currency (SAR, USD).

### BR-07 — Coupons

**Rule.** A coupon is percentage (1–100) or fixed amount; scope is platform-wide (admin) or a single
course (instructor, own courses only); it has start/end dates, a global usage cap, a per-user cap, and
a minimum cart value. The discount never pushes a price below zero. One coupon per item. Usage is
reserved **only** on successful payment, inside the transaction.

**Owner.** `features/coupons/services.ts#evaluateCoupon` (pure) + `#consumeCoupon` (transactional).

**Tests.** `BR-07: rejects expired coupon`, `BR-07: rejects coupon before start date`,
`BR-07: rejects when global cap reached`, `BR-07: rejects when per-user cap reached`,
`BR-07: rejects below minimum cart value`, `BR-07: rejects percentage above 100`,
`BR-07: clamps fixed discount so total >= 0`, `BR-07: instructor cannot create coupon for another course`,
`BR-07: cart item accepts only one coupon`, and the concurrency test
`BR-07: five concurrent purchases with cap=1 consume once` (integration).

### BR-08 — Enrollment from a verified webhook

**Rule.** An `Enrollment` is created **only** from `checkout.session.completed` after signature
verification — never from the success page. The handler is idempotent through `ProcessedWebhookEvent`
(unique on the Stripe event id). The success page polls until the enrollment appears.

**Owner.** `features/checkout/services.ts#fulfillCheckoutSession`.

**Tests.** `BR-08: bad signature returns 400 and creates nothing`,
`BR-08: success page never creates an enrollment`,
`BR-08: duplicate event creates one enrollment`,
`BR-08: ten concurrent deliveries of the same event create one enrollment`,
`BR-08: unhandled event types are recorded and ignored`.

### BR-09 — No double purchase, no self purchase

**Rule.** A user cannot buy a course they are already enrolled in, and an instructor cannot buy
their own course. The UI swaps the buy button for "Go to course".

**Owner.** `features/checkout/services.ts#assertPurchasable`.

**Tests.** `BR-09: rejects purchase when already enrolled`, `BR-09: rejects instructor self-purchase`,
`BR-09: free course creates a FREE-source enrollment without Stripe`.

### BR-10 — Refunds

**Rule.** A refund is allowed within 14 days of purchase, with progress < 30% and no issued
certificate. The request goes to an admin; on approval the service executes the Stripe refund,
cancels the enrollment, and **reverses** the instructor's ledger entry.

**Owner.** `src/lib/refund-rules.ts` (eligibility) + `src/server/refunds.ts` (request) +
`src/server/admin/refunds.ts` (Stripe execution, enrolment revocation, ledger reversal, audit).

**Tests.** `BR-10: allows a paid order inside 14 days below 30% with no certificate`,
`BR-10: rejects after the window and at 30% progress`, `BR-10: rejects certificates, unpaid orders
and an existing request`, `BR-10: allows a new request after a rejection`;
integration: `BR-10: refund requests enforce the window, progress and certificate rules` and
`BR-10/BR-12: approval revokes access, reverses the ledger and the ledger is immutable`.

---

## Earnings and payouts

### BR-11 — Instructor share

**Rule.** The instructor receives 70% of the post-discount, pre-tax amount. The rate is editable by
an admin and is **snapshotted per order line** at the moment of sale.

**Owner.** `src/lib/earnings-rules.ts#instructorShareCents`; `src/server/checkout.ts` freezes the
result on `OrderItem`. Changing the platform rate never alters historic rows.

**Tests.** `BR-11: computes 70% of the post-discount pre-tax amount`,
`BR-11: applies banker's rounding to the halala`, `BR-11: rejects rates and amounts outside the
money domain`; `BR-13: available balance waits for the refund window...` exercises the frozen share.

### BR-12 — Append-only ledger

**Rule.** `LedgerEntry` records sale, refund, and payout entries. It is append-only; a balance is
always a `SUM()`, never a mutable stored number.

**Owner.** `src/server/earnings.ts` reads balances; the database trigger
`ledger_entries_append_only` rejects UPDATE/DELETE. No service exports a ledger update/delete.

**Tests.** The ledger equals sales minus refunds minus paid payouts, to the halala`and`BR-10/BR-12: approval revokes access, reverses the ledger and the ledger is immutable` (both assert
the database rejects UPDATE/DELETE).

### BR-13 — Payouts

**Rule.** Earnings become available 14 days after the sale (the refund window). Minimum payout is
100 SAR. An instructor may have at most one pending request. An admin marks a request paid with a
transfer reference.

**Owner.** `src/lib/payout-rules.ts` + `src/server/earnings.ts` (request) +
`src/server/admin/payouts.ts` (approve / mark paid / reject). A partial unique index enforces one
open payout per instructor.

**Tests.** `BR-13: available balance subtracts paid and pending payouts and never goes negative`,
`BR-13: enforces the minimum, the available ceiling and one pending request`;
integration `BR-13: available balance waits for the refund window and one pending payout` covers the
window, minimum, single pending, paid entry, rejection and the unique index.

---

## Progress and certificates

### BR-14 — Lesson completion

**Rule.** A video lesson completes automatically when 90% of its duration has been **actually
watched** — tracked by watched segments so seeking to the end does not count — or manually via the
button. Text and file lessons complete via the button. A quiz lesson completes only on a pass.
Playback position is saved every 10 seconds (debounced) and on page unload.

**Owner.** `features/progress/services.ts#applyWatchSegment` (pure) + `#computeCompletion`.

**Tests.** `BR-14: seeking to the end does not complete the lesson`,
`BR-14: contiguous playback past 90% completes the lesson`,
`BR-14: re-watching a segment does not double count`,
`BR-14: manual completion works for video lessons`,
`BR-14: quiz lesson completes only on a passing attempt`,
`BR-14: position persists every 10 seconds and on unload` (e2e).

### BR-15 — Course progress

**Rule.** Progress = completed lessons ÷ currently published lessons. Adding lessons lowers the
percentage but never revokes an already issued certificate.

**Owner.** `features/progress/services.ts#courseProgress`.

**Tests.** `BR-15: recomputes when a lesson is added`, `BR-15: issued certificate survives a drop below 100%`,
`BR-15: unpublished lessons are excluded from the denominator`, `BR-15: rounds to whole percent`.

### BR-16 — Quizzes

**Rule.** Pass mark defaults to 70% (per-quiz override); 3 attempts by default; the highest score
counts. Correct answers are **never** sent to the client before submission. The timer is enforced on
the server (stored start time + 10-second grace).

**Tests.** `BR-16: passes at exactly 70%`, `BR-16: fails at 69%`,
`BR-16: keeps the highest of three attempts`, `BR-16: rejects a fourth attempt`,
`BR-16: response payload contains no isCorrect flag before submission` (integration),
`BR-16: submission 11 seconds after expiry is rejected`,
`BR-16: multi-select question requires the exact set`.

### BR-17 — Certificates

**Rule.** Issued automatically at 100% progress with every quiz passed; exactly once per
(user, course); with an unguessable code (format `MD-XXXX-XXXX`, cryptographically random);
the recipient name is **frozen** at issue time.

**Owner.** `features/certificates/services.ts#issueIfEligible` (unique constraint + transaction).

**Tests.** `BR-17: issues at 100% with all quizzes passed`,
`BR-17: does not issue at 99%`, `BR-17: issues exactly one certificate under concurrency`,
`BR-17: code matches the required format and is unique`,
`BR-17: renaming the user does not change the certificate name`.

---

## Content and community

### BR-18 — Reviews

**Rule.** Only an enrolled student who has completed ≥ 20% may review; one review per course,
editable. The course's `ratingAvg`/`ratingCount` are updated in the same transaction.

**Owner.** `src/server/reviews.ts` (pure rules in `src/lib/review-rules.ts`).

**Tests.** `BR-18: rejects review at 19% progress`, `BR-18: allows review at 20%`,
`BR-18: rejects a non-enrolled user`, `BR-18: rating must be an integer from 1 to 5`,
`BR-18: average is stored with two decimals as ×100`; the transaction and one-review-per-course
behaviour are covered by `tests/integration/reviews-notifications.test.ts`
(`BR-18: enforces 20%, one review per learner, and keeps the aggregate atomic`).

### BR-19 — Discussions and notes

**Rule.** Only enrolled students and the course instructor may post. Notes are always private to
their author. Instructor replies carry a badge; the thread author may mark one reply as the accepted
answer.

**Owner.** `features/discussions/services.ts` + `features/notes/services.ts`.

**Tests.** `BR-19: non-enrolled user cannot post`, `BR-19: instructor can post on own course`,
`BR-19: another instructor cannot post`, `BR-19: notes are never returned to other users`,
`BR-19: only the thread author can accept an answer`, `BR-19: accepted answer is unique per thread`.

### BR-20 — Signed URLs

**Rule.** Paid content (video, files) is served through short-lived signed URLs (15 minutes) after an
enrollment check. Lessons flagged as free preview are available to everyone.

**Owner.** `features/player/services.ts#signLessonAssets`.

**Tests.** `BR-20: refuses to sign for a non-enrolled user`,
`BR-20: signs preview lessons for guests`, `BR-20: signed URL expires after 15 minutes` (integration),
`BR-20: direct object key without a signature returns 403`,
`BR-20: signed URL for a lesson of another course is refused`.

### BR-21 — Banned users

**Rule.** Banning a user invalidates their sessions immediately; they see an explanatory page, and
their public content (reviews, threads) is hidden.

**Owner.** `features/admin/services.ts#banUser` (delete sessions + hide content in one transaction).

**Tests.** `BR-21: banning deletes all sessions`, `BR-21: banned user's next request is rejected`,
`BR-21: banned user's reviews disappear from the course page`,
`BR-21: unbanning restores access but not the deleted sessions`,
`BR-21: ban writes an audit entry with a reason`.

---

## Platform settings that parametrize these rules

| Setting                                   | Default                    | Used by      |
| ----------------------------------------- | -------------------------- | ------------ |
| `commissionBps`                           | 7000 (70%)                 | BR-11        |
| `vatBps`                                  | 1500 (15%)                 | BR-06        |
| `refundWindowDays`                        | 14                         | BR-10, BR-13 |
| `refundMaxProgressPct`                    | 30                         | BR-10        |
| `payoutMinimumMinor`                      | 10000 (100 SAR)            | BR-13        |
| `quizPassPct` / `quizMaxAttempts`         | 70 / 3 (per-quiz override) | BR-16        |
| `reviewMinProgressPct`                    | 20                         | BR-18        |
| `signedUrlTtlSec`                         | 900 (15 min)               | BR-20        |
| `maintenanceMode`                         | false                      | middleware   |
| `defaultCurrency` / `supportedCurrencies` | SAR / [SAR, USD]           | BR-05        |
