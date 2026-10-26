-- Customised certificate wording: set per request by the club leader, editable by the approving administrator.
ALTER TABLE certificate_requests
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Certificate of Membership',
  ADD COLUMN IF NOT EXISTS programme text NOT NULL DEFAULT 'Service as a PLP member',
  ADD COLUMN IF NOT EXISTS citation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS period_from date,
  ADD COLUMN IF NOT EXISTS period_to date;
-- Issued certificates keep their own copy of the wording, so later edits never change a certificate already issued.
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS citation text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS period_from date,
  ADD COLUMN IF NOT EXISTS period_to date;
