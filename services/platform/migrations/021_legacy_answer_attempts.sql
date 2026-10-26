-- Older single-question courses: limit guessing (security review finding).
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS legacy_wrong integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS legacy_last_wrong timestamptz;
