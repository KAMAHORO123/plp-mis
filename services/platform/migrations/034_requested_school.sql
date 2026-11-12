-- The school a club leader or mentor says they work with, at sign-up or later from their dashboard.
-- An administrator confirms it by assigning the school (users.school_id), which clears this request.
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_school text NOT NULL DEFAULT '';
