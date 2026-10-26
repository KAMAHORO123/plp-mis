CREATE TABLE files (
 id uuid PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES users(id),
 filename text NOT NULL,
 mime text NOT NULL,
 bytes integer NOT NULL CHECK (bytes>0 AND bytes<=10485760),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX files_owner ON files(owner_id);
