import { withoutAnswers } from "./assessments.mjs";
export const kinds = [
  "events",
  "materials",
  "opportunities",
  "courses",
  "members",
  "applications",
  "mentorship",
  "projects",
  "proofs",
  "posts",
  // Personal calendar entries: only the person who adds one can see or change it.
  "agenda",
  // ALX programme enrolments a member records; administrators see them all.
  "alx",
];
const ownKinds = ["applications", "mentorship", "projects", "proofs", "posts", "alx"];
export function canWrite(user, kind, record) {
  if (user.status !== "approved") return false;
  if (kind === "agenda") return !record || record.owner_id === user.id;
  if (user.role === "admin") return true;
  if (ownKinds.includes(kind)) return !record || record.owner_id === user.id;
  if (user.role === "trainer" && kind === "courses")
    return !record || record.owner_id === user.id;
  if (user.role === "leader" && ["events", "members"].includes(kind))
    return !!user.school_id && (!record || record.school_id === user.school_id);
  return false;
}
export function canRead(user, record) {
  if (record.kind === "agenda") return record.owner_id === user.id;
  if (user.role === "admin") return true;
  // Learning materials are for club leaders only (and administrators, above), limited to their school when assigned.
  if (
    record.kind === "materials" &&
    (user.role !== "leader" ||
      (record.data.school_ids?.length && !record.data.school_ids.includes(user.school_id)))
  )
    return false;
  if (
    ["applications", "mentorship", "projects", "proofs", "alx"].includes(record.kind)
  )
    return record.owner_id === user.id;
  if (record.kind === "members")
    return (
      ["leader", "mentor"].includes(user.role) &&
      !!user.school_id &&
      record.school_id === user.school_id
    );
  if (record.kind === "courses" && !record.data.published)
    return record.owner_id === user.id;
  if (record.kind === "opportunities" && !record.data.published) return false;
  return true;
}
export function publicRecord(record, user) {
  const result = structuredClone(record);
  if (
    record.kind === "courses" &&
    user.role !== "admin" &&
    record.owner_id !== user.id
  )
    result.data = withoutAnswers(result.data);
  return result;
}
