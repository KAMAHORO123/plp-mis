import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { platformApi } from "./platform-api";
import { Field, Panel, Spinner } from "./ui";
import { ProfilePhoto } from "./profile-photo";
import { markProfileComplete } from "./access";
import "./complete-profile.css";
import { DateInput, Select } from "@/components/shared/form-controls";

export type ProfileDetails = {
    birth_date: string | null; phone: string; linkedin: string; instagram: string; facebook: string;
    education_stage: string; institution: string; employment_status: string; employment_detail: string;
    languages: string[]; skills: string[] | null; interests: string[]; profile_completed_at: string | null;
};
const STAGES: [string, string][] = [["high-school", "High school student"], ["university", "University student"], ["graduated", "Graduated"], ["community", "Community member"]];
const WORK = ["Student", "Employed", "Self-employed", "Intern", "Volunteer", "Unemployed"];
// What the second box asks for, depending on the work situation.
const WORK_DETAIL: Record<string, string> = { "Employed": "Where do you work? (optional)", "Self-employed": "Name of your business", "Intern": "Where is your internship? (optional)", "Volunteer": "Where do you volunteer? (optional)" };
const LANGUAGES = ["Kinyarwanda", "English", "French", "Kiswahili"];
const SKILL_IDEAS = ["Leadership", "Public speaking", "Writing", "Design", "Coding", "Music", "Sports", "Photography"];
const INTEREST_IDEAS = ["Peacebuilding", "Arts & culture", "Technology", "Entrepreneurship", "Mental health", "Volunteering", "Sports", "Environment"];

/** Picks several values: suggestions to tap, plus anything typed and confirmed with Enter or a comma. */
function TagPicker({ label, values, onChange, ideas, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; ideas: string[]; placeholder: string }) {
    const [text, setText] = useState("");
    const add = (raw: string) => { const v = raw.trim().replace(/,$/, ""); if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase()) && values.length < 20) onChange([...values, v.slice(0, 60)]); setText(""); };
    const key = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); } else if (e.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1)); };
    return <div className="hub-field cp-tags">
      <span>{translateUi(label)}</span>
      <div className="cp-tag-box">
        {values.map((v) => <span key={v} className="cp-tag">{translateUi(v)}<button type="button" aria-label={translateUi("Remove {p0}", { p0: v })} onClick={() => onChange(values.filter((x) => x !== v))}><X size={13}/></button></span>)}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={key} onBlur={() => add(text)} placeholder={values.length ? "" : translateUi(placeholder)} aria-label={translateUi(label)} maxLength={60}/>
      </div>
      <div className="cp-ideas">{ideas.filter((i) => !values.includes(i)).map((i) => <button type="button" key={i} onClick={() => add(i)}>+ {translateUi(i)}</button>)}</div>
    </div>;
}

/** Everyone except administrators completes these details once; they can update them any time after. */
export function CompleteProfilePage() {
    useSiteLanguage();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [me, setMe] = useState<ProfileDetails | null>(null), [busy, setBusy] = useState(false);
    const [languages, setLanguages] = useState<string[]>([]), [skills, setSkills] = useState<string[]>([]), [interests, setInterests] = useState<string[]>([]);
    const [work, setWork] = useState("");
    // Required answers filled so far, for the progress bar in the header.
    const [filled, setFilled] = useState({ birth: false, phone: false, education: false });
    useEffect(() => { platformApi<ProfileDetails>("/me").then((m) => { setMe(m); setLanguages(m.languages ?? []); setSkills(m.skills ?? []); setInterests(m.interests ?? []); setWork(m.employment_status ?? ""); setFilled({ birth: !!m.birth_date, phone: !!m.phone, education: !!m.education_stage }); }).catch((e: Error) => toast.error(translateUi(e.message))); }, []);
    if (!me)
        return <Spinner page label="Loading your profile…"/>;
    const first = !me.profile_completed_at;
    const save = async (f: FormData) => {
        if (!languages.length || !skills.length || !interests.length)
            return toast.error(translateUi("Add at least one language, one skill and one interest."));
        const str = (k: string) => String(f.get(k) ?? "").trim();
        setBusy(true);
        try {
            await platformApi("/me/details", "PUT", { birth_date: str("birth_date"), phone: str("phone"), linkedin: str("linkedin"), instagram: str("instagram"), facebook: str("facebook"), education_stage: str("education_stage"), institution: str("institution"), employment_status: work, employment_detail: str("employment_detail"), languages, skills, interests });
            markProfileComplete();
            toast.success(translateUi(first ? "Profile complete. Welcome to the PLP Hub!" : "Profile updated"));
            navigate(params.get("returnTo") || (first ? "/hub" : "/passport"), { replace: true });
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy(false);
        }
    };
    const today = new Date(), latest = `${today.getFullYear() - 10}-12-31`;
    const steps = [filled.birth, filled.phone, filled.education, !!work, languages.length > 0, skills.length > 0, interests.length > 0];
    const done = steps.filter(Boolean).length, percent = Math.round((done / steps.length) * 100);
    return <div className="ws-page cp-page">
      <header className="cp-hero">
        <div>
          <p className="cp-kicker">{translateUi(first ? "ONE LAST STEP" : "YOUR PROFILE")}</p>
          <h1>{translateUi(first ? "Complete your profile" : "Your profile details")}</h1>
          <p>{translateUi(first ? "Tell us a little about yourself so PLP can match you with the right courses, mentors and opportunities. It takes about two minutes." : "Keep your details up to date so PLP can keep matching you with the right opportunities.")}</p>
        </div>
        <div className="cp-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={translateUi("Profile completion")}>
          <strong>{percent}%</strong><span>{translateUi("{p0} of {p1} required answers", { p0: done, p1: steps.length })}</span>
          <i><b style={{ width: `${percent}%` }}/></i>
        </div>
      </header>
      <form className="hub-form cp-form" onInput={(e) => { const f = new FormData(e.currentTarget); setFilled({ birth: !!f.get("birth_date"), phone: String(f.get("phone") ?? "").trim().length >= 7, education: !!f.get("education_stage") }); }} onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }}>
        <Panel className="cp-section">
          <h2><b>1</b>{translateUi("About you")}</h2>
          <div className="cp-photo"><p className="cp-label">{translateUi("Profile picture")} <small>{translateUi("optional")}</small></p><ProfilePhoto size={88}/></div>
          <div className="ws-form-grid">
            <Field label={translateUi("Date of birth")}><DateInput name="birth_date" type="date" required max={latest} defaultValue={me.birth_date ?? ""}/></Field>
            <Field label={translateUi("Phone number")}><input name="phone" type="tel" required autoComplete="tel" placeholder="+250 7XX XXX XXX" pattern="\+?[0-9 ()\-]{7,20}" defaultValue={me.phone}/></Field>
          </div>
        </Panel>
        <Panel className="cp-section">
          <h2><b>2</b>{translateUi("Social media")} <small>{translateUi("optional")}</small></h2>
          <div className="ws-form-grid cp-three">
            <Field label="LinkedIn"><input name="linkedin" type="url" placeholder="https://linkedin.com/in/…" defaultValue={me.linkedin}/></Field>
            <Field label="Instagram"><input name="instagram" type="url" placeholder="https://instagram.com/…" defaultValue={me.instagram}/></Field>
            <Field label="Facebook"><input name="facebook" type="url" placeholder="https://facebook.com/…" defaultValue={me.facebook}/></Field>
          </div>
        </Panel>
        <Panel className="cp-section">
          <h2><b>3</b>{translateUi("Education and work")}</h2>
          <div className="ws-form-grid">
            <Field label={translateUi("Education")}><Select name="education_stage" required defaultValue={me.education_stage || ""}><option value="" disabled>{translateUi("Choose…")}</option>{STAGES.map(([v, l]) => <option key={v} value={v}>{translateUi(l)}</option>)}</Select></Field>
            <Field label={translateUi("School, university or field of study")}><input name="institution" maxLength={120} defaultValue={me.institution}/></Field>
          </div>
          <fieldset className="cp-work"><legend>{translateUi("Work")}</legend>
            {WORK.map((w) => <label key={w} className={work === w ? "on" : ""}><input type="radio" name="work" value={w} required checked={work === w} onChange={() => setWork(w)}/>{translateUi(w)}</label>)}
          </fieldset>
          {WORK_DETAIL[work] && <Field label={translateUi(WORK_DETAIL[work])}><input name="employment_detail" required={work === "Self-employed"} maxLength={120} defaultValue={me.employment_detail}/></Field>}
        </Panel>
        <Panel className="cp-section">
          <h2><b>4</b>{translateUi("Languages, skills and interests")}</h2>
          <TagPicker label="Languages you speak" values={languages} onChange={setLanguages} ideas={LANGUAGES} placeholder="Type a language and press Enter"/>
          <TagPicker label="Skills" values={skills} onChange={setSkills} ideas={SKILL_IDEAS} placeholder="Type a skill and press Enter"/>
          <TagPicker label="Interests" values={interests} onChange={setInterests} ideas={INTEREST_IDEAS} placeholder="Type an interest and press Enter"/>
        </Panel>
        <div className="cp-submit"><span className="hub-caption">{translateUi(done === steps.length ? "All set. Save to continue." : "Fields marked as optional can be left empty.")}</span><button className="hub-button" disabled={busy}>{translateUi(busy ? "Saving…" : first ? "Finish and go to my dashboard" : "Save details")}<ArrowRight size={16}/></button></div>
      </form>
    </div>;
}
