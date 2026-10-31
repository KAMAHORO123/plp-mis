import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { FormModal } from "./modal";
import { Field } from "./ui";
import { platformApi } from "./platform-api";

export type ApplicantRecipient = { userId: string; name: string; email?: string; appliedFor: string };
type Template = { label: string; subject: string; message: string };
// {name}, {first_name} and {applied_for} are filled in per person by the server.
const TEMPLATES: Template[] = [
    { label: "Application received", subject: "We received your application for {applied_for}", message: "Dear {first_name},\n\nThank you for applying for {applied_for}. We have received your application and our team is reviewing it now.\n\nWe will contact you again once a decision has been made. You can follow the status of your application in the PLP Hub at any time." },
    { label: "Accepted", subject: "Congratulations, {first_name}: your application for {applied_for} was accepted", message: "Dear {first_name},\n\nWe are happy to let you know that your application for {applied_for} has been accepted.\n\nThe PLP team will be in touch with the next steps shortly. Welcome aboard!" },
    { label: "Not selected", subject: "Update on your application for {applied_for}", message: "Dear {first_name},\n\nThank you for your interest in {applied_for}. After careful review, we are unable to move forward with your application this time.\n\nWe encourage you to keep learning in the PLP Hub and to apply for future opportunities." },
    { label: "Custom message", subject: "", message: "Dear {first_name},\n\n" },
];
// Mirrors the server: surname-first names in capitals ("UWASE Grace") greet the given name.
const givenName = (name: string) => { const words = name.trim().split(/\s+/); return words.find((w) => w !== w.toUpperCase()) ?? words[0]; };
const fill = (text: string, r: ApplicantRecipient) => text.replace(/\{(name|first_name|applied_for)\}/g, (_, k: string) => k === "name" ? r.name : k === "first_name" ? givenName(r.name) : r.appliedFor);

/** Compose one message for many applicants; each copy is personalised with their name and what they applied for. */
export function ApplicantEmailDialog({ recipients, onClose, initial = 0 }: {
    recipients: ApplicantRecipient[];
    onClose: () => void;
    initial?: number;
}) {
    useSiteLanguage();
    const [template, setTemplate] = useState(initial);
    const [subject, setSubject] = useState(TEMPLATES[initial].subject);
    const [message, setMessage] = useState(TEMPLATES[initial].message);
    const [busy, setBusy] = useState(false);
    const sample = recipients[0];
    const choose = (i: number) => { setTemplate(i); setSubject(TEMPLATES[i].subject); setMessage(TEMPLATES[i].message); };
    const send = async () => {
        if (subject.trim().length < 3 || message.trim().length < 10)
            return toast.error(translateUi("Add a subject and a message."));
        setBusy(true);
        try {
            const r = await platformApi<{ queued: number; notified: number }>("/applicant-emails", "POST", { subject, message, recipients: recipients.map((x) => ({ user_id: x.userId, applied_for: x.appliedFor })) });
            toast.success(translateUi(r.queued ? "{p0} emails queued; every applicant also gets a Hub notification." : "{p0} applicants notified in the Hub. Email delivery is off for these addresses.", { p0: r.queued || r.notified }));
            onClose();
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy(false);
        }
    };
    return <FormModal wide title={translateUi("Email {p0}", { p0: recipients.length === 1 ? sample.name : translateUi("{p0} applicants", { p0: recipients.length }) })} description={translateUi("Each person receives their own copy addressed to them.")} onClose={onClose}>
      <div className="ae-recipients">{recipients.slice(0, 12).map((r) => <span key={r.userId + r.appliedFor} title={r.email}>{r.name}<small>{r.appliedFor}</small></span>)}{recipients.length > 12 && <span>{translateUi("+{p0} more", { p0: recipients.length - 12 })}</span>}</div>
      <div className="ae-templates" role="radiogroup" aria-label={translateUi("Message template")}>{TEMPLATES.map((t, i) => <button key={t.label} type="button" role="radio" aria-checked={template === i} className={template === i ? "active" : ""} onClick={() => choose(i)}>{translateUi(t.label)}</button>)}</div>
      <Field label={translateUi("Subject")}><input value={subject} maxLength={160} onChange={(e) => setSubject(e.target.value)}/></Field>
      <Field label={translateUi("Message")}><textarea rows={8} value={message} maxLength={4000} onChange={(e) => setMessage(e.target.value)}/></Field>
      <p className="hub-caption">{translateUi("Placeholders: {name}, {first_name} and {applied_for} are replaced for each person.")}</p>
      <div className="ae-preview" aria-label={translateUi("Preview")}>
        <small>{translateUi("Preview for {p0}", { p0: sample.name })}</small>
        <strong>{fill(subject, sample) || translateUi("(no subject)")}</strong>
        <p className="hub-prewrap">{fill(message, sample)}</p>
      </div>
      <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={onClose}>{translateUi("Cancel")}</button><button type="button" className="hub-button" disabled={busy} onClick={() => void send()}><Send size={15}/>{translateUi(busy ? "Sending…" : recipients.length === 1 ? "Send email" : "Send {p0} emails", { p0: recipients.length })}</button></div>
    </FormModal>;
}
