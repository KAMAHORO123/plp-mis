CREATE TABLE certificate_requests (
 id uuid PRIMARY KEY,
 school_id uuid NOT NULL REFERENCES schools(id),
 requested_by uuid NOT NULL REFERENCES users(id),
 members jsonb NOT NULL,
 status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','returned','corrected','issued')),
 note text NOT NULL DEFAULT '',
 requested_at timestamptz NOT NULL DEFAULT now(),
 corrected_at timestamptz,
 issued_at timestamptz,
 reviewed_by uuid REFERENCES users(id)
);
ALTER TABLE certificates ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE certificates ADD COLUMN school_id uuid REFERENCES schools(id);
ALTER TABLE certificates ADD COLUMN request_id uuid REFERENCES certificate_requests(id);
ALTER TABLE certificates ADD COLUMN school_member_id uuid REFERENCES records(id);
CREATE UNIQUE INDEX certificate_request_member ON certificates(request_id,school_member_id);
