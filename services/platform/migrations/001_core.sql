CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL,
 password_hash text NOT NULL, role text NOT NULL DEFAULT 'member' CHECK(role IN ('member','leader','trainer','admin')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','suspended','rejected')),
 school_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS schools (id uuid PRIMARY KEY,name text NOT NULL,district text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE users ADD CONSTRAINT users_school_fk FOREIGN KEY(school_id) REFERENCES schools(id);
CREATE TABLE IF NOT EXISTS records (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('events','materials','opportunities','courses','members','applications','mentorship','projects','proofs','posts')),
 owner_id uuid NOT NULL REFERENCES users(id), school_id uuid REFERENCES schools(id),
 data jsonb NOT NULL, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS records_kind_school ON records(kind,school_id);
CREATE INDEX IF NOT EXISTS records_owner ON records(owner_id);
CREATE TABLE IF NOT EXISTS audit_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,actor_id uuid REFERENCES users(id),action text NOT NULL,entity_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS content (key text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS enrollments (id uuid PRIMARY KEY,member_id uuid NOT NULL REFERENCES users(id),course_id uuid NOT NULL REFERENCES records(id),lessons integer[] NOT NULL DEFAULT '{}',assignment text NOT NULL DEFAULT '',passed boolean NOT NULL DEFAULT false,completed_at timestamptz,UNIQUE(member_id,course_id));
CREATE TABLE IF NOT EXISTS certificates (id uuid PRIMARY KEY,member_id uuid NOT NULL REFERENCES users(id),course_id uuid REFERENCES records(id),recipient text NOT NULL,programme text NOT NULL,issued_by uuid REFERENCES users(id),issued_at timestamptz NOT NULL DEFAULT now(),revoked_at timestamptz,reason text,UNIQUE(member_id,course_id));
CREATE TABLE IF NOT EXISTS attendance (event_id uuid NOT NULL REFERENCES records(id),member_id uuid NOT NULL REFERENCES users(id),recorded_by uuid NOT NULL REFERENCES users(id),PRIMARY KEY(event_id,member_id));
CREATE TABLE IF NOT EXISTS auth_limits (key text PRIMARY KEY,count integer NOT NULL,expires_at timestamptz NOT NULL);
