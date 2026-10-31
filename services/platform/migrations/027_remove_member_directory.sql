-- The member directory was withdrawn; nothing reads or writes these columns any more.
ALTER TABLE users DROP COLUMN IF EXISTS profile_visible;
ALTER TABLE notification_mail DROP COLUMN IF EXISTS reply_to;
