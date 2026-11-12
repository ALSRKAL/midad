-- Database invariant checks for Midad.
--
--   pnpm db:verify        (runs this file against the database in .env.local)
--
-- Everything runs inside one transaction that is rolled back at the end, so it is safe on a
-- development database and usable in CI. Each guard prints PASS or raises and aborts with FAIL,
-- which makes the exit code meaningful.
--
-- These checks cover the guarantees that the Prisma schema language cannot express and that the
-- application could silently lose if a future migration replaced them (ADR-0011 note, BR-12, BR-13).

BEGIN;

-- ---------------------------------------------------------------------------
-- Fixtures (rolled back at the end)
-- ---------------------------------------------------------------------------

INSERT INTO users (id, name, email, "emailVerified", role, status, locale, theme, "numberingSystem", "createdAt", "updatedAt")
VALUES ('ckuser0000000000000000001', 'Test Instructor', 'invariants@midad.test', true, 'INSTRUCTOR', 'ACTIVE', 'AR', 'SYSTEM', 'latn', now(), now());

INSERT INTO instructor_profiles (id, "userId", "createdAt", "updatedAt")
VALUES ('ckprof0000000000000000001', 'ckuser0000000000000000001', now(), now());

INSERT INTO ledger_entries (id, "instructorProfileId", type, "amountCents", currency, "createdAt")
VALUES ('ckledg0000000000000000001', 'ckprof0000000000000000001', 'SALE', 7000, 'SAR', now());

INSERT INTO payouts (id, "instructorProfileId", "amountCents", currency, status, "createdAt", "updatedAt")
VALUES ('ckpayo0000000000000000001', 'ckprof0000000000000000001', 10000, 'SAR', 'REQUESTED', now(), now());

-- ---------------------------------------------------------------------------
-- BR-12 — ledger_entries is append-only (trigger)
-- ---------------------------------------------------------------------------

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    UPDATE ledger_entries SET "amountCents" = 1 WHERE id = 'ckledg0000000000000000001';
  EXCEPTION WHEN OTHERS THEN
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: ledger_entries UPDATE was allowed (BR-12)'; END IF;
  RAISE NOTICE 'PASS: ledger_entries UPDATE rejected';
END $$;

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    DELETE FROM ledger_entries WHERE id = 'ckledg0000000000000000001';
  EXCEPTION WHEN OTHERS THEN
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: ledger_entries DELETE was allowed (BR-12)'; END IF;
  RAISE NOTICE 'PASS: ledger_entries DELETE rejected';
END $$;

-- ---------------------------------------------------------------------------
-- BR-13 — at most one open payout per instructor (partial unique index)
-- ---------------------------------------------------------------------------

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO payouts (id, "instructorProfileId", "amountCents", currency, status, "createdAt", "updatedAt")
    VALUES ('ckpayo0000000000000000002', 'ckprof0000000000000000001', 5000, 'SAR', 'REQUESTED', now(), now());
  EXCEPTION WHEN unique_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: a second open payout was allowed (BR-13)'; END IF;
  RAISE NOTICE 'PASS: second open payout rejected';
END $$;

-- A *closed* payout must not block a new request: mark the open one paid, then request again.
UPDATE payouts SET status = 'PAID', "paidAt" = now() WHERE id = 'ckpayo0000000000000000001';

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO payouts (id, "instructorProfileId", "amountCents", currency, status, "createdAt", "updatedAt")
    VALUES ('ckpayo0000000000000000003', 'ckprof0000000000000000001', 5000, 'SAR', 'REQUESTED', now(), now());
  EXCEPTION WHEN OTHERS THEN
    rejected := true;
  END;
  IF rejected THEN
    RAISE EXCEPTION 'FAIL: a new payout request was blocked by an already-paid payout (BR-13)';
  END IF;
  RAISE NOTICE 'PASS: new payout allowed after the previous one was paid';
END $$;

-- ---------------------------------------------------------------------------
-- Domain CHECK constraints
-- ---------------------------------------------------------------------------

INSERT INTO categories (id, slug, "nameAr", "nameEn", "createdAt", "updatedAt")
VALUES ('ckcat00000000000000000001', 'invariants', 'اختبار', 'Invariants', now(), now());

INSERT INTO courses (id, slug, "instructorId", "categoryId", "priceCents", currency, status, "createdAt", "updatedAt")
VALUES ('ckcour0000000000000000001', 'invariants-course', 'ckprof0000000000000000001', 'ckcat00000000000000000001', 19900, 'SAR', 'DRAFT', now(), now());

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    UPDATE courses SET "priceCents" = -1 WHERE id = 'ckcour0000000000000000001';
  EXCEPTION WHEN check_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: a negative course price was allowed (BR-05)'; END IF;
  RAISE NOTICE 'PASS: negative price rejected';
END $$;

-- BR-09 — the same user cannot be enrolled twice in one course (unique constraint).
INSERT INTO enrollments (id, "userId", "courseId", source, status, "createdAt")
VALUES ('ckenro0000000000000000001', 'ckuser0000000000000000001', 'ckcour0000000000000000001', 'FREE', 'ACTIVE', now());

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO enrollments (id, "userId", "courseId", source, status, "createdAt")
    VALUES ('ckenro0000000000000000002', 'ckuser0000000000000000001', 'ckcour0000000000000000001', 'PURCHASE', 'ACTIVE', now());
  EXCEPTION WHEN unique_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: duplicate enrollment was allowed (BR-09)'; END IF;
  RAISE NOTICE 'PASS: duplicate enrollment rejected';
END $$;

-- ---------------------------------------------------------------------------
-- P02-T06 — at most one PENDING instructor application per user.
-- ---------------------------------------------------------------------------

INSERT INTO instructor_applications (id, "userId", status, experience, field, "createdAt", "updatedAt")
VALUES ('ckappl0000000000000000001', 'ckuser0000000000000000001', 'PENDING', 'Fixture experience', 'Fixture field', now(), now());

DO $$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO instructor_applications (id, "userId", status, experience, field, "createdAt", "updatedAt")
    VALUES ('ckappl0000000000000000002', 'ckuser0000000000000000001', 'PENDING', 'Second', 'Second', now(), now());
  EXCEPTION WHEN unique_violation THEN
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: two pending instructor applications were allowed'; END IF;
  RAISE NOTICE 'PASS: second pending application rejected';
END $$;

-- ---------------------------------------------------------------------------
-- Arabic search support (the product requirements): the trigram indexes must exist.
-- ---------------------------------------------------------------------------

DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(name, ', ') INTO missing
  FROM (VALUES ('courses_title_normalized_trgm_idx'), ('courses_description_normalized_trgm_idx')) AS t(name)
  WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = t.name);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: missing trigram index(es): %', missing;
  END IF;
  RAISE NOTICE 'PASS: trigram search indexes present';
END $$;

ROLLBACK;
