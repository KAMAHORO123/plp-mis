-- Everyone has member access while a staff request is reviewed: verified accounts that were waiting
-- with a request become approved members, and the request stays open for an administrator.
UPDATE users SET status='approved'
  WHERE status='pending' AND role='member' AND requested_role IS NOT NULL AND email_verified_at IS NOT NULL;
