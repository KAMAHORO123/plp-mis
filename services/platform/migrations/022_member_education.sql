-- Where a member is in their studies. Members update it themselves, for example after finishing high school.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS education_stage text NOT NULL DEFAULT 'community'
    CHECK (education_stage IN ('high-school','university','graduated','community')),
  ADD COLUMN IF NOT EXISTS institution text NOT NULL DEFAULT '' CHECK (length(institution) <= 120),
  ADD COLUMN IF NOT EXISTS graduation_year integer CHECK (graduation_year BETWEEN 1990 AND 2100);
-- Members already linked to a school are high-school students until they say otherwise.
UPDATE users SET education_stage='high-school' WHERE role='member' AND school_id IS NOT NULL AND education_stage='community';
