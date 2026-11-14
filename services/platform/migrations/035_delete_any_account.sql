-- Administrators can delete any account. The activity log stays append-only for the app, so instead of the app
-- rewriting entries, a deleted person's entries simply lose the link to them (the entry itself is kept).
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_actor_id_fkey;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;
