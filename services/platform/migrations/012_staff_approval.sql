ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK(role IN ('member','leader','trainer','mentor','admin'));
ALTER TABLE users ADD COLUMN requested_role text CHECK(requested_role IN ('leader','trainer','mentor'));
ALTER TABLE users ADD COLUMN role_review text NOT NULL DEFAULT '';
