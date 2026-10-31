-- Lookups that run on every application, activity sign-up and file download.
CREATE INDEX IF NOT EXISTS records_reference ON records (kind, (data->>'reference_id'));
CREATE INDEX IF NOT EXISTS records_category ON records (kind, (data->>'category'));
CREATE INDEX IF NOT EXISTS records_attachments ON records USING gin ((data->'attachments'));
CREATE INDEX IF NOT EXISTS records_kind_created ON records (kind, created_at DESC);
