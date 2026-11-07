-- One PENDING instructor application per user (P02-T06).
--
-- The service checks first for a friendly message, but two concurrent submits can both pass that
-- check. The partial unique index is what actually guarantees a single pending application; the
-- action turns the resulting unique violation into the same APPLICATION_PENDING conflict.

CREATE UNIQUE INDEX "instructor_applications_one_pending_per_user_idx"
  ON instructor_applications ("userId")
  WHERE status = 'PENDING';
