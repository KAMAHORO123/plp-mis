CREATE TABLE notification_mail (
 id uuid PRIMARY KEY,
 sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
 recipient text NOT NULL,
 subject text NOT NULL,
 body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '3 days',
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_mail_due ON notification_mail(next_attempt_at);
CREATE INDEX notification_mail_sender ON notification_mail(sender_id,created_at);
