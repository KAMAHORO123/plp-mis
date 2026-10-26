import { platformApi } from "./platform-api";
import { uid, type MentorshipEmail, type Session } from "./store";

export interface MailParty { name: string; email: string }

const subjects: Record<MentorshipEmail["kind"], (mentee: string, mentor: string) => string> = {
  requested: (mentee) => `New mentorship session request from ${mentee}`,
  updated: (mentee) => `${mentee} updated their mentorship request`,
  cancelled: (mentee) => `${mentee} cancelled a mentorship session`,
  confirmed: (_, mentor) => `${mentor} confirmed your mentorship session`,
  declined: (_, mentor) => `${mentor} is unable to take your session request`,
  rescheduled: (_, mentor) => `${mentor} proposed a new time for your session`,
  completed: (_, mentor) => `Your session with ${mentor} is complete`,
};
const toMentor = new Set<MentorshipEmail["kind"]>(["requested", "updated", "cancelled"]);

/**
 * Saves a session change on the platform and queues the matching email.
 * Throws if the server rejects the change; resolves with "Not delivered" when it was saved but no email could be queued.
 */
export async function sendMentorshipEmail(kind: MentorshipEmail["kind"], session: Session, mentor: MailParty, mentee: MailParty, note = ""): Promise<MentorshipEmail> {
  const recipient = toMentor.has(kind) ? mentor : mentee;
  const entry: MentorshipEmail = { id: uid(), sessionId: session.id, kind, to: recipient.email, toName: recipient.name, subject: subjects[kind](mentee.name, mentor.name), sentAt: new Date().toISOString(), status: "Queued" };
  try {
    const result = await platformApi<{ queued: boolean; reason?: string }>("/mentorship/notify", "POST", {
      kind,
      session_id: session.id,
      recipient_email: recipient.email,
      recipient_name: recipient.name,
      mentor_name: mentor.name,
      mentee_name: mentee.name,
      topic: session.topic ?? "",
      date: new Date(session.date).toISOString(),
      goal: session.goal,
      meeting_link: session.meetingLink ?? "",
      note,
    });
    if (!result.queued) { entry.status = "Not delivered"; entry.error = result.reason ?? "Email delivery is unavailable."; }
    return entry;
  } finally {
    window.dispatchEvent(new Event("plp:mentorship-updated"));
  }
}
