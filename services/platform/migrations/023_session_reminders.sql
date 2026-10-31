ALTER TABLE mentor_sessions ADD COLUMN session_type text NOT NULL DEFAULT 'Online' CHECK (session_type IN ('Online','In person','Visit'));
ALTER TABLE mentor_sessions ADD COLUMN location text NOT NULL DEFAULT '';
CREATE TABLE reminder_receipts (
  reminder_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notification_mail ADD COLUMN reminder_session_id uuid REFERENCES mentor_sessions(id) ON DELETE CASCADE;
ALTER TABLE notification_mail ADD COLUMN reminder_session_date timestamptz;
UPDATE mentor_sessions SET location=meeting_link,meeting_link='' WHERE meeting_link<>'' AND meeting_link !~* '^[a-z][a-z0-9+.-]*:';
