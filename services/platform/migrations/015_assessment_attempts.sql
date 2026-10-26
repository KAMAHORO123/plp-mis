ALTER TABLE enrollments ADD COLUMN viewed integer[] NOT NULL DEFAULT '{}';
ALTER TABLE enrollments ADD COLUMN assignment_at timestamptz;
CREATE TABLE assessment_attempts (
 id uuid PRIMARY KEY,
 enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
 assessment_id text NOT NULL,
 question_ids text[] NOT NULL,
 answers jsonb NOT NULL DEFAULT '{}',
 focus_losses integer NOT NULL DEFAULT 0,
 started_at timestamptz NOT NULL DEFAULT now(),
 ends_at timestamptz NOT NULL,
 submitted_at timestamptz,
 score integer,
 total integer,
 percent integer,
 passed boolean,
 reason text CHECK(reason IN ('submitted','time','focus')),
 results boolean[]
);
CREATE UNIQUE INDEX assessment_attempt_open ON assessment_attempts(enrollment_id) WHERE submitted_at IS NULL;
CREATE INDEX assessment_attempt_history ON assessment_attempts(enrollment_id,assessment_id,submitted_at);
