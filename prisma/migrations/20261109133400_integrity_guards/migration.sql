-- Database guarantees that the Prisma schema language cannot express.
-- Forward-only: never edit an applied migration (the product requirements); add a new one instead.
--
-- Naming note: tables are snake_case via @@map, columns keep Prisma's camelCase and are therefore
-- double-quoted here (docs/ARCHITECTURE.md §4.5).

-- BR-13: an instructor may have at most one open payout request.
-- A partial unique index enforces this under concurrency, not only in application code.
CREATE UNIQUE INDEX "payouts_one_open_per_instructor_idx"
  ON payouts ("instructorProfileId")
  WHERE status IN ('REQUESTED', 'APPROVED');

-- Domain checks: cheap database-level guarantees for values that must never drift.
ALTER TABLE reviews
  ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE courses
  ADD CONSTRAINT courses_price_non_negative CHECK ("priceCents" >= 0),
  ADD CONSTRAINT courses_rating_non_negative CHECK ("ratingAvg" >= 0 AND "ratingCount" >= 0);

ALTER TABLE order_items
  ADD CONSTRAINT order_items_amounts_non_negative
    CHECK ("unitPriceCents" >= 0 AND "discountCents" >= 0 AND "instructorShareCents" >= 0),
  ADD CONSTRAINT order_items_commission_range CHECK ("commissionBps" BETWEEN 0 AND 10000);

ALTER TABLE coupons
  ADD CONSTRAINT coupons_percentage_range CHECK (percentage IS NULL OR percentage BETWEEN 1 AND 100),
  ADD CONSTRAINT coupons_amount_positive CHECK ("amountOffCents" IS NULL OR "amountOffCents" > 0),
  ADD CONSTRAINT coupons_single_value_per_type
    CHECK ((type = 'PERCENTAGE' AND percentage IS NOT NULL AND "amountOffCents" IS NULL)
        OR (type = 'FIXED' AND "amountOffCents" IS NOT NULL AND percentage IS NULL)),
  ADD CONSTRAINT coupons_window_valid CHECK ("endsAt" > "startsAt");

ALTER TABLE quizzes
  ADD CONSTRAINT quizzes_pass_pct_range CHECK ("passPct" BETWEEN 1 AND 100),
  ADD CONSTRAINT quizzes_attempts_positive CHECK ("maxAttempts" >= 1);

ALTER TABLE orders
  ADD CONSTRAINT orders_amounts_non_negative
    CHECK ("subtotalCents" >= 0 AND "discountCents" >= 0 AND "taxCents" >= 0 AND "totalCents" >= 0);

-- BR-12: the ledger is append-only. A trigger makes an update or delete impossible through any
-- code path, including raw SQL in a future migration.
CREATE OR REPLACE FUNCTION ledger_entries_forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only (BR-12): % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_entries_no_update
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_entries_forbid_mutation();