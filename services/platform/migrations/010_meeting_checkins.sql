CREATE TABLE meetings (
 id uuid PRIMARY KEY,
 title text NOT NULL,
 location text NOT NULL DEFAULT '',
 join_url text NOT NULL DEFAULT '',
 latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 radius_m integer NOT NULL CHECK(radius_m BETWEEN 30 AND 300),
 opens_at timestamptz NOT NULL,
 closes_at timestamptz NOT NULL CHECK(closes_at > opens_at),
 credits integer NOT NULL CHECK(credits BETWEEN 1 AND 500),
 code_hash text NOT NULL,
 closed boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE meeting_checkins (
 meeting_id uuid NOT NULL REFERENCES meetings(id),
 member_id uuid NOT NULL REFERENCES users(id),
 distance_m integer NOT NULL,
 accuracy_m integer NOT NULL,
 checked_in_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(meeting_id,member_id)
);
