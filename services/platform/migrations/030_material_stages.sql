ALTER TABLE material_completions ADD COLUMN stage text NOT NULL DEFAULT 'Completed' CHECK (stage IN ('Not started','In progress','Completed'));
