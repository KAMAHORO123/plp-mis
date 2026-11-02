-- Members record which ALX programmes they enrolled in; administrators see the list.
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_kind_check;
ALTER TABLE records ADD CONSTRAINT records_kind_check CHECK (kind IN ('events','materials','opportunities','courses','members','applications','mentorship','projects','proofs','posts','agenda','alx'));
