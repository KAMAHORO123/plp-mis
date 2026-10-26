CREATE TABLE register_attendance (
 event_id uuid NOT NULL REFERENCES records(id),
 school_member_id uuid NOT NULL REFERENCES records(id),
 recorded_by uuid NOT NULL REFERENCES users(id),
 PRIMARY KEY(event_id,school_member_id)
);
CREATE TABLE credits (
 id uuid PRIMARY KEY,
 member_id uuid NOT NULL REFERENCES users(id),
 source text NOT NULL,
 label text NOT NULL,
 amount integer NOT NULL CHECK(amount>0),
 awarded_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(member_id,source)
);
