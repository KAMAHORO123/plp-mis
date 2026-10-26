ALTER TABLE users ADD COLUMN email_verified_at timestamptz;
CREATE TABLE email_verifications (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 code_hash text NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 sent_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL
);
ALTER TABLE recovery_mail ADD COLUMN purpose text NOT NULL DEFAULT 'password' CHECK(purpose IN ('password','verification'));
