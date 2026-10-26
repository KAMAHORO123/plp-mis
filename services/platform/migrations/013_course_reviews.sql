ALTER TABLE enrollments ADD COLUMN review_feedback text NOT NULL DEFAULT '';
ALTER TABLE enrollments ADD COLUMN reviewed_by uuid REFERENCES users(id);
ALTER TABLE enrollments ADD COLUMN reviewed_at timestamptz;
