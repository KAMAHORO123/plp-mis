CREATE TABLE mentor_sessions (
 id uuid PRIMARY KEY,
 member_id uuid NOT NULL REFERENCES users(id),
 mentor_id uuid NOT NULL REFERENCES users(id),
 date timestamptz NOT NULL,
 topic text NOT NULL DEFAULT '',
 goal text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'Requested' CHECK(status IN ('Requested','Confirmed','Declined','Completed','Cancelled')),
 meeting_link text NOT NULL DEFAULT '',
 mentor_notes text NOT NULL DEFAULT '',
 decline_reason text NOT NULL DEFAULT '',
 requested_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX mentor_session_slot ON mentor_sessions(mentor_id,date) WHERE status IN ('Requested','Confirmed');
