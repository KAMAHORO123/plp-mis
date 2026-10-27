import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useState } from "react";
import { Globe, MapPin } from "lucide-react";
import { toast } from "sonner";
import { clubs } from "./data";
import { useHub, uid, award, type ClubActivity } from "./store";
import { Empty, Field, Heading, Panel, Stats, Tag, downloadCSV } from "./ui";
export function ClubsPage() {
    useSiteLanguage();
    const { state, profile, update } = useHub();
    const [selected, setSelected] = useState(clubs[0].id);
    const [type, setType] = useState("All communities");
    const club = clubs.find((c) => c.id === selected)!;
    const joined = profile.clubIds.includes(selected);
    const canManage = profile.role === "Administrator" ||
        (profile.role === "Club leader" &&
            profile.managedClubIds.includes(selected));
    const members = state.profiles.filter((p) => p.membership === "Approved" && p.clubIds.includes(selected));
    const activities = state.activities.filter((a) => a.clubId === selected);
    return (<>
      <Heading eyebrow="BELONG. CONTRIBUTE. LEAD." title={translateUi("Clubs & homegroups")} description={translateUi("Your local starting point for learning, service, and leadership.")}/>
      <div className="hub-chips">
        {translateUi([
            "All communities",
            "School",
            "University",
            "Homegroup",
            "Community",
        ].map((t) => (<button key={t} className={type === t ? "active" : ""} onClick={() => setType(t)}>
            {translateUi(t)}
          </button>)))}
      </div>
      <div className="hub-grid two">
        {translateUi(clubs
            .filter((c) => type === "All communities" || c.type === type)
            .map((c) => (<button key={c.id} className={`hub-club-card ${selected === c.id ? "selected" : ""}`} onClick={() => setSelected(c.id)}>
              <Globe />
              <div>
                <Tag>{translateUi(c.type)}</Tag>
                <h2>{translateUi(c.name)}</h2>
                <p>
                  <MapPin size={14}/>
                  {translateUi(c.location)}
                </p>
              </div>
              {translateUi(profile.clubIds.includes(c.id) && (<span className="hub-tag">{translateUi("Joined")}</span>))}
            </button>)))}
      </div>
      <div className="hub-section-title hub-row">
        <div>
          <p className="hub-eyebrow">{translateUi("CLUB DASHBOARD")}</p>
          <h2>{translateUi(club.name)}</h2>
        </div>
        <button className="hub-button" disabled={joined} onClick={() => update((s) => {
            s.profiles
                .find((p) => p.id === profile.id)!
                .clubIds.push(selected);
        })}>
          {translateUi(joined ? "You’re a member" : "Join this community")}
        </button>
      </div>
      <p>{translateUi(club.description)}</p>
      {translateUi(joined || canManage ? (<>
          <Stats items={[
                { label: "Members", value: members.length },
                { label: "Activities", value: activities.length },
                {
                    label: "Attendance records",
                    value: activities.reduce((n, a) => n + a.attendees.length, 0),
                },
                {
                    label: "Submitted reports",
                    value: activities.filter((a) => a.status !== "Draft").length,
                },
            ]}/>
          <div className="hub-grid two">
            {translateUi(canManage && (<Panel>
                <h2>{translateUi("Member register")}</h2>
                {translateUi(members.length ? (members.map((m) => (<div className="hub-list-row" key={m.id}>
                      <span>{translateUi(m.name)}</span>
                      <Tag>{translateUi(m.role)}</Tag>
                    </div>))) : (<Empty>{translateUi("Be the first member of this community.")}</Empty>))}
              </Panel>))}
            <Panel>
              <h2>{translateUi("Club performance")}</h2>
              <p>{translateUi(" Measure participation and follow through on the work you start together. ")}</p>
              <div className="hub-list-row">
                <span>{translateUi("Volunteer hours recorded")}</span>
                <strong>
                  {translateUi(activities
                .filter((a) => a.type === "Volunteering")
                .reduce((n, a) => n + a.hours * a.attendees.length, 0))}
                </strong>
              </div>
              <div className="hub-list-row">
                <span>{translateUi("Reports reviewed")}</span>
                <strong>
                  {translateUi(activities.filter((a) => a.status === "Reviewed").length)}
                </strong>
              </div>
              {translateUi(canManage && (<button className="hub-button secondary hub-space" onClick={() => downloadCSV("club-performance.csv", [
                    [
                        "Club",
                        "Activity",
                        "Date",
                        "Type",
                        "Participants",
                        "Hours per participant",
                        "Report",
                        "Status",
                    ],
                    ...activities.map((a) => [
                        club.name,
                        a.title,
                        a.date,
                        a.type,
                        a.attendees.length,
                        a.hours,
                        a.report,
                        a.status,
                    ]),
                ])}>{translateUi(" Download club report ")}</button>))}
            </Panel>
          </div>
          <h2 className="hub-section-title">{translateUi("Activities & attendance")}</h2>
          {translateUi(!activities.length && (<Empty>{translateUi(" No activities yet. A club leader can create the first one. ")}</Empty>))}
          <div className="hub-stack">
            {translateUi(activities.map((a) => (<Panel key={a.id}>
                <div className="hub-row">
                  <div>
                    <Tag>{translateUi(a.type)}</Tag>
                    <h3>{translateUi(a.title)}</h3>
                    <p>
                      {translateUi(a.date)}{translateUi(" \u00B7 ")}{translateUi(a.hours)}{translateUi(" hour")}{translateUi(a.hours !== 1 ? "s" : "")}
                    </p>
                  </div>
                  <Tag>{translateUi(a.status)}</Tag>
                </div>
                <p>{translateUi(a.attendees.length)}{translateUi(" members attended")}</p>
                {translateUi(canManage && (<div className="hub-attendance">
                    <h3>{translateUi("Record attendance")}</h3>
                    {translateUi(members.map((m) => (<label className="hub-check" key={m.id}>
                        <input type="checkbox" checked={a.attendees.includes(m.id)} disabled={a.attendees.includes(m.id)} onChange={() => update((s) => {
                            const activity = s.activities.find((x) => x.id === a.id)!;
                            if (!activity.attendees.includes(m.id)) {
                                activity.attendees.push(m.id);
                                const amount = {
                                    Meeting: 10,
                                    Volunteering: 20,
                                    Challenge: 25,
                                    Recruitment: 15,
                                }[activity.type];
                                award(s, m.id, `activity:${a.id}`, `${activity.type}: ${a.title}`, amount);
                            }
                        })}/>
                        {translateUi(m.name)}
                        {translateUi(a.attendees.includes(m.id) ? " · recorded" : "")}
                      </label>)))}
                    <p className="hub-caption">{translateUi(" Confirmed attendance awards credits once per member. Records are retained after confirmation. ")}</p>
                  </div>))}
                {translateUi(canManage && a.status === "Draft" ? (<form className="hub-form" onSubmit={(e) => {
                        e.preventDefault();
                        const report = String(new FormData(e.currentTarget).get("report"));
                        if (update((s) => {
                            const r = s.activities.find((x) => x.id === a.id)!;
                            r.report = report;
                            r.status = "Submitted";
                        }))
                            toast.success(translateUi("Club report submitted for local review"));
                    }}>
                    <Field label={translateUi("Activity report")}>
                      <textarea name="report" required minLength={30} maxLength={3000} placeholder={translateUi("Describe participation, outcomes, and lessons learned\u2026")}/>
                    </Field>
                    <button className="hub-button secondary">{translateUi(" Submit report ")}</button>
                  </form>) : (canManage &&
                    a.report && <p className="hub-prewrap">{translateUi(a.report)}</p>))}
                {translateUi(profile.role === "Administrator" &&
                    a.status === "Submitted" && (<button className="hub-button secondary" onClick={() => update((s) => {
                        s.activities.find((x) => x.id === a.id)!.status =
                            "Reviewed";
                    })}>{translateUi(" Mark report reviewed ")}</button>))}
              </Panel>)))}
          </div>
          {translateUi(canManage && (<Panel className="hub-space">
              <h2>{translateUi("Create a club activity")}</h2>
              <form key={selected} className="hub-form" onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    if (update((s) => {
                        s.activities.push({
                            id: uid(),
                            clubId: selected,
                            title: String(f.get("title")).trim(),
                            date: String(f.get("date")),
                            type: String(f.get("type")) as ClubActivity["type"],
                            hours: Number(f.get("hours")),
                            attendees: [],
                            report: "",
                            status: "Draft",
                            authorId: profile.id,
                        });
                    })) {
                        form.reset();
                        toast.success(translateUi("Activity added"));
                    }
                }}>
                <div className="hub-grid two">
                  <Field label={translateUi("Activity name")}>
                    <input name="title" required minLength={3} maxLength={100}/>
                  </Field>
                  <Field label={translateUi("Activity type")}>
                    <select name="type">
                      {translateUi([
                    "Meeting",
                    "Volunteering",
                    "Challenge",
                    "Recruitment",
                ].map((t) => (<option key={t} value={t}>{translateUi(t)}</option>)))}
                    </select>
                  </Field>
                  <Field label={translateUi("Date")}>
                    <input name="date" type="date" required/>
                  </Field>
                  <Field label={translateUi("Hours per participant")}>
                    <input name="hours" type="number" min="0.5" max="24" step="0.5" required defaultValue="1"/>
                  </Field>
                </div>
                <button className="hub-button">{translateUi("Create activity")}</button>
              </form>
            </Panel>))}
          {translateUi(!canManage && (<p className="hub-caption hub-space">{translateUi(" Club leaders manage activities, attendance, and reports for their assigned communities. Member registers and reports are visible only to their leaders and administrators. ")}</p>))}
        </>) : (<Empty>{translateUi(" Join this community to view its member activities. Registers and reports are available only to assigned club leaders. ")}</Empty>))}
    </>);
}
