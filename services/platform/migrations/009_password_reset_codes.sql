CREATE TABLE password_reset_codes (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 code_hash text NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 sent_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL
);
ALTER TABLE recovery_mail DROP CONSTRAINT recovery_mail_purpose_check;
ALTER TABLE recovery_mail ADD CONSTRAINT recovery_mail_purpose_check CHECK(purpose IN ('password','verification','reset_code'));
