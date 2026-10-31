-- Passport details used to live only in one browser; they now follow the member to every device.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 1000),
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS leadership text[] NOT NULL DEFAULT '{}';
