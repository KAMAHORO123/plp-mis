// Club leaders and mentors type their school's name at sign-up. When that name matches exactly one school
// in the Hub (ignoring capitals, spaces and punctuation), they are linked to it straight away, so no one
// has to assign them by hand. A name that matches nothing (or more than one school) stays as typed.
const norm = (col) => `regexp_replace(lower(${col}),'[^a-z0-9]+','','g')`;

/** Links one person (by id), or everyone waiting when `userId` is null. Returns the linked user ids. */
export async function linkTypedSchools(db, userId = null) {
  const { rows } = await db.query(
    `UPDATE users u SET school_id = s.id, requested_school = ''
       FROM schools s
      WHERE ($1::uuid IS NULL OR u.id = $1)
        AND u.school_id IS NULL
        AND u.requested_school <> ''
        AND (u.role IN ('leader','mentor') OR u.requested_role IN ('leader','mentor'))
        AND ${norm("s.name")} = ${norm("u.requested_school")}
        AND ${norm("u.requested_school")} <> ''
        AND (SELECT count(*) FROM schools s2 WHERE ${norm("s2.name")} = ${norm("u.requested_school")}) = 1
      RETURNING u.id, u.school_id`,
    [userId],
  );
  return rows;
}
