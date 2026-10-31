import type { HubState } from "./store";

// Legacy account IDs and a one-time cleanup of test addresses.
const seededAccountIds = new Set([
  "demo-0", "demo-1", "demo-2", "demo-3", "demo-4", "demo-5",
  "preview-member", "preview-coordinator", "preview-trainer", "preview-admin", "preview-leader",
]);
export const isSeededAccount = (id: string) => seededAccountIds.has(id);
function isRemovedEmail(email: string = "") {
  const address = email.trim().toLowerCase();
  const domain = address.split("@")[1] || "";
  return /(^|\.)(example\.(com|org|net)|test|invalid|localhost)$/.test(domain);
}
export function removeSeededAccounts(state: HubState): HubState {
  const cleanEmails = state.emailCleanupVersion !== 1;
  const removedIds = new Set(seededAccountIds);
  if (cleanEmails) for (const profile of state.profiles) {
    if (isRemovedEmail(profile.email)) removedIds.add(profile.id);
  }
  const isRemovedAccount = (id: string) => removedIds.has(id);
  state.profiles = state.profiles.filter(p => !isRemovedAccount(p.id));
  if (!state.profiles.some(p => p.id === state.currentId)) state.currentId = "";
  for (const key of ["membershipRequests", "enrollments", "certificates", "credits", "applications", "saved", "proofs", "posts", "projects", "redemptions", "outcomes"] as const) {
    const rows = state[key];
    for (let i = rows.length - 1; i >= 0; i--) if (isRemovedAccount(rows[i].memberId)) rows.splice(i, 1);
  }
  state.sessions = state.sessions.filter(row => !isRemovedAccount(row.memberId) && !isRemovedAccount(row.mentorId));
  state.invitations = state.invitations.filter(row => !isRemovedAccount(row.createdBy) && !(cleanEmails && isRemovedEmail(row.email)));
  for (const invitation of state.invitations) if (invitation.usedBy && isRemovedAccount(invitation.usedBy)) delete invitation.usedBy;
  state.activities = state.activities.filter(row => !isRemovedAccount(row.authorId));
  for (const row of state.activities) row.attendees = row.attendees.filter(id => !isRemovedAccount(id));
  for (const course of state.courses) if (course.ownerId && isRemovedAccount(course.ownerId)) delete course.ownerId;
  state.schoolRecords.members = state.schoolRecords.members.filter(row => !/^school-member-[0-5]$/.test(row.id) && !(cleanEmails && isRemovedEmail(row.email)));
  state.schoolRecords.requests = state.schoolRecords.requests.filter(row => row.id !== "PLP-DEMO-WELCOME" && !isRemovedAccount(row.createdBy));
  if (cleanEmails) for (const request of state.schoolRecords.requests) {
    request.members = request.members.filter(member => !isRemovedEmail(member.email));
  }
  state.operations.activities = state.operations.activities.filter(row => !isRemovedAccount(row.authorId));
  for (const row of state.operations.activities) row.attendees = row.attendees.filter(id => !isRemovedAccount(id));
  state.operations.requests = state.operations.requests.filter(row => !isRemovedAccount(row.memberId));
  state.operations.completions = state.operations.completions.filter(row => !isRemovedAccount(row.by));
  state.emailCleanupVersion = 1;
  return state;
}
