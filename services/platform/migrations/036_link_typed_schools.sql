-- Club leaders and mentors who typed a school's name at sign-up are linked to that school when the name
-- matches exactly one school (ignoring capitals, spaces and punctuation). New sign-ups are linked by the API.
UPDATE users u SET school_id = s.id, requested_school = ''
  FROM schools s
 WHERE u.school_id IS NULL
   AND u.requested_school <> ''
   AND (u.role IN ('leader','mentor') OR u.requested_role IN ('leader','mentor'))
   AND regexp_replace(lower(s.name),'[^a-z0-9]+','','g') = regexp_replace(lower(u.requested_school),'[^a-z0-9]+','','g')
   AND regexp_replace(lower(u.requested_school),'[^a-z0-9]+','','g') <> ''
   AND (SELECT count(*) FROM schools s2
         WHERE regexp_replace(lower(s2.name),'[^a-z0-9]+','','g') = regexp_replace(lower(u.requested_school),'[^a-z0-9]+','','g')) = 1;
