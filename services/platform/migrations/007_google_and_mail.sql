CREATE TABLE google_identities (
  subject text PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE oauth_states (
  token_hash text PRIMARY KEY,
  verifier text NOT NULL,
  nonce text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE recovery_mail (
  id uuid PRIMARY KEY,
  recipient text NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX oauth_states_expiry ON oauth_states(expires_at);
