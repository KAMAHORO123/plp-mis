ALTER TABLE users ADD COLUMN avatar_file_id uuid REFERENCES files(id) ON DELETE SET NULL;
-- School certificates issued before accounts were linked: attach them to the member with the register email.
UPDATE certificates c SET member_id=u.id FROM records r JOIN users u ON lower(u.email)=lower(r.data->>'email')
 WHERE c.school_member_id=r.id AND c.member_id IS NULL AND r.data->>'email'<>'';
