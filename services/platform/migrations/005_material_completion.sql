CREATE TABLE material_completions (
 material_id uuid NOT NULL REFERENCES records(id),
 school_id uuid NOT NULL REFERENCES schools(id),
 completed_by uuid NOT NULL REFERENCES users(id),
 completed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(material_id,school_id)
);
