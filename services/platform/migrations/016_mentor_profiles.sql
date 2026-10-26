CREATE TABLE mentor_profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 title text NOT NULL DEFAULT '',
 area text NOT NULL DEFAULT '',
 bio text NOT NULL DEFAULT '',
 avatar text NOT NULL DEFAULT '',
 accepting boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
