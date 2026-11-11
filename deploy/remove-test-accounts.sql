-- One-time, repeatable cleanup of three owner-confirmed test accounts.
\set ON_ERROR_STOP on
BEGIN;

-- Exact addresses supplied by the owner; schools and other accounts are retained.
CREATE TEMP TABLE target_emails(email text PRIMARY KEY);
INSERT INTO target_emails VALUES
 ('kelliakamahoro@gmail.com'),
 ('ileadinitiativeteam@gmail.com'),
 ('bettyndinabo@gmail.com');
LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE test_users AS SELECT id FROM users WHERE lower(email) IN (SELECT email FROM target_emails);
CREATE TEMP TABLE test_records AS
  SELECT id FROM records WHERE owner_id IN (SELECT id FROM test_users);
-- Remove applications whose test opportunity is being removed.
INSERT INTO test_records
  SELECT id FROM records
  WHERE kind = 'applications' AND data->>'reference_id' IN (SELECT id::text FROM test_records)
    AND id NOT IN (SELECT id FROM test_records);
CREATE TEMP TABLE test_requests AS
  SELECT id FROM certificate_requests
  WHERE requested_by IN (SELECT id FROM test_users);
CREATE TEMP TABLE test_files AS SELECT id FROM files WHERE owner_id IN (SELECT id FROM test_users);

DELETE FROM certificates
  WHERE member_id IN (SELECT id FROM test_users) OR course_id IN (SELECT id FROM test_records)
     OR school_member_id IN (SELECT id FROM test_records) OR request_id IN (SELECT id FROM test_requests)
    ;
UPDATE certificates SET issued_by = NULL WHERE issued_by IN (SELECT id FROM test_users);
DELETE FROM certificate_requests WHERE id IN (SELECT id FROM test_requests);
UPDATE certificate_requests SET reviewed_by = NULL WHERE reviewed_by IN (SELECT id FROM test_users);

DELETE FROM enrollments WHERE member_id IN (SELECT id FROM test_users) OR course_id IN (SELECT id FROM test_records);
UPDATE enrollments SET reviewed_by = NULL WHERE reviewed_by IN (SELECT id FROM test_users);
DELETE FROM attendance
  WHERE event_id IN (SELECT id FROM test_records) OR member_id IN (SELECT id FROM test_users) OR recorded_by IN (SELECT id FROM test_users);
DELETE FROM register_attendance
  WHERE event_id IN (SELECT id FROM test_records) OR school_member_id IN (SELECT id FROM test_records) OR recorded_by IN (SELECT id FROM test_users);
DELETE FROM material_completions
  WHERE material_id IN (SELECT id FROM test_records) OR completed_by IN (SELECT id FROM test_users);
DELETE FROM credits WHERE member_id IN (SELECT id FROM test_users);

DELETE FROM meeting_checkins
  WHERE member_id IN (SELECT id FROM test_users)
     OR meeting_id IN (SELECT id FROM meetings WHERE created_by IN (SELECT id FROM test_users));
DELETE FROM meetings WHERE created_by IN (SELECT id FROM test_users);
DELETE FROM mentor_sessions WHERE member_id IN (SELECT id FROM test_users) OR mentor_id IN (SELECT id FROM test_users);

DELETE FROM notification_mail WHERE lower(recipient) IN (SELECT email FROM target_emails);
UPDATE notification_mail SET sender_id = NULL WHERE sender_id IN (SELECT id FROM test_users);
DELETE FROM recovery_mail WHERE lower(recipient) IN (SELECT email FROM target_emails);
UPDATE audit_log SET actor_id = NULL WHERE actor_id IN (SELECT id FROM test_users);

DELETE FROM records WHERE id IN (SELECT id FROM test_records);
UPDATE users SET avatar_file_id = NULL WHERE avatar_file_id IN (SELECT id FROM test_files);
DELETE FROM files WHERE id IN (SELECT id FROM test_files);
-- Sessions, notifications, mentor profiles and sign-in codes go with the account.
DELETE FROM users WHERE id IN (SELECT id FROM test_users);


SELECT count(*) AS remaining_target_accounts FROM users WHERE lower(email) IN (SELECT email FROM target_emails);
-- File IDs are also the on-disk names in UPLOAD_DIR; remove these blobs after COMMIT succeeds.
SELECT id AS removed_upload_id FROM test_files;
COMMIT;
