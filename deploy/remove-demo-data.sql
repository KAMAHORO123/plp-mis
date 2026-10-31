-- Removes the demo accounts (@plp-demo.test) and everything that exists only because of them:
-- their courses, opportunities, activities, register members, certificates, sessions and uploads,
-- plus schools that no real account uses. Real accounts and what they created are kept.
-- Runs in one transaction: any error leaves the database unchanged.
\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE demo_users AS SELECT id FROM users WHERE email ILIKE '%@plp-demo.test';
CREATE TEMP TABLE demo_schools AS
  SELECT s.id FROM schools s
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.school_id = s.id AND u.id NOT IN (SELECT id FROM demo_users))
    AND NOT EXISTS (SELECT 1 FROM records r WHERE r.school_id = s.id AND r.owner_id NOT IN (SELECT id FROM demo_users))
    AND NOT EXISTS (SELECT 1 FROM certificate_requests q WHERE q.school_id = s.id AND q.requested_by NOT IN (SELECT id FROM demo_users));
CREATE TEMP TABLE demo_records AS
  SELECT id FROM records WHERE owner_id IN (SELECT id FROM demo_users) OR school_id IN (SELECT id FROM demo_schools);
-- Real applications to a demo opportunity have nothing left to point at.
INSERT INTO demo_records
  SELECT id FROM records
  WHERE kind = 'applications' AND data->>'reference_id' IN (SELECT id::text FROM demo_records)
    AND id NOT IN (SELECT id FROM demo_records);
CREATE TEMP TABLE demo_requests AS
  SELECT id FROM certificate_requests
  WHERE requested_by IN (SELECT id FROM demo_users) OR school_id IN (SELECT id FROM demo_schools);
CREATE TEMP TABLE demo_files AS SELECT id FROM files WHERE owner_id IN (SELECT id FROM demo_users);

DELETE FROM certificates
  WHERE member_id IN (SELECT id FROM demo_users) OR course_id IN (SELECT id FROM demo_records)
     OR school_member_id IN (SELECT id FROM demo_records) OR request_id IN (SELECT id FROM demo_requests)
     OR school_id IN (SELECT id FROM demo_schools);
UPDATE certificates SET issued_by = NULL WHERE issued_by IN (SELECT id FROM demo_users);
DELETE FROM certificate_requests WHERE id IN (SELECT id FROM demo_requests);
UPDATE certificate_requests SET reviewed_by = NULL WHERE reviewed_by IN (SELECT id FROM demo_users);

DELETE FROM enrollments WHERE member_id IN (SELECT id FROM demo_users) OR course_id IN (SELECT id FROM demo_records);
UPDATE enrollments SET reviewed_by = NULL WHERE reviewed_by IN (SELECT id FROM demo_users);
DELETE FROM attendance
  WHERE event_id IN (SELECT id FROM demo_records) OR member_id IN (SELECT id FROM demo_users) OR recorded_by IN (SELECT id FROM demo_users);
DELETE FROM register_attendance
  WHERE event_id IN (SELECT id FROM demo_records) OR school_member_id IN (SELECT id FROM demo_records) OR recorded_by IN (SELECT id FROM demo_users);
DELETE FROM material_completions
  WHERE material_id IN (SELECT id FROM demo_records) OR completed_by IN (SELECT id FROM demo_users) OR school_id IN (SELECT id FROM demo_schools);
DELETE FROM credits WHERE member_id IN (SELECT id FROM demo_users);

DELETE FROM meeting_checkins
  WHERE member_id IN (SELECT id FROM demo_users)
     OR meeting_id IN (SELECT id FROM meetings WHERE created_by IN (SELECT id FROM demo_users));
DELETE FROM meetings WHERE created_by IN (SELECT id FROM demo_users);
DELETE FROM mentor_sessions WHERE member_id IN (SELECT id FROM demo_users) OR mentor_id IN (SELECT id FROM demo_users);

DELETE FROM notification_mail WHERE recipient ILIKE '%@plp-demo.test';
UPDATE notification_mail SET sender_id = NULL WHERE sender_id IN (SELECT id FROM demo_users);
DELETE FROM recovery_mail WHERE recipient ILIKE '%@plp-demo.test';
DELETE FROM audit_log WHERE actor_id IN (SELECT id FROM demo_users);

DELETE FROM records WHERE id IN (SELECT id FROM demo_records);
UPDATE users SET avatar_file_id = NULL WHERE avatar_file_id IN (SELECT id FROM demo_files);
DELETE FROM files WHERE id IN (SELECT id FROM demo_files);
-- Sessions, notifications, mentor profiles and sign-in codes go with the account.
DELETE FROM users WHERE id IN (SELECT id FROM demo_users);
DELETE FROM schools WHERE id IN (SELECT id FROM demo_schools);

SELECT (SELECT count(*) FROM users) AS accounts, (SELECT count(*) FROM schools) AS schools,
       (SELECT count(*) FROM records) AS records, (SELECT count(*) FROM certificates) AS certificates,
       (SELECT count(*) FROM files) AS files;
COMMIT;
