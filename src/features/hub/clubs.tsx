import { useState } from "react";
import { Globe, MapPin } from "lucide-react";
import { toast } from "sonner";
import { clubs } from "./data";
import { useHub, uid, award, type ClubActivity } from "./store";
import { Empty, Field, Heading, Panel, Stats, Tag, downloadCSV } from "./ui";
export function ClubsPage() {
  const { state, profile, update } = useHub();
  const [selected, setSelected] = useState(clubs[0].id);
  const [type, setType] = useState("All communities");
  const club = clubs.find((c) => c.id === selected)!;
  const joined = profile.clubIds.includes(selected);
  const canManage =
    profile.role === "Administrator" ||
    (profile.role === "Club leader" &&
      profile.managedClubIds.includes(selected));
  const members = state.profiles.filter(
    (p) => p.membership === "Approved" && p.clubIds.includes(selected),
  );
  const activities = state.activities.filter((a) => a.clubId === selected);
  return (
    <>
      <Heading
        eyebrow="BELONG. CONTRIBUTE. LEAD."
        title="Clubs & homegroups"
        description="Your local starting point for learning, service, and leadership."
      />
      <div className="hub-chips">
        {[
          "All communities",
          "School",
          "University",
          "Homegroup",
          "Community",
        ].map((t) => (
          <button
            key={t}
            className={type === t ? "active" : ""}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="hub-grid two">
        {clubs
          .filter((c) => type === "All communities" || c.type === type)
          .map((c) => (
            <button
              key={c.id}
              className={`hub-club-card ${selected === c.id ? "selected" : ""}`}
              onClick={() => setSelected(c.id)}
            >
              <Globe />
              <div>
                <Tag>{c.type}</Tag>
                <h2>{c.name}</h2>
                <p>
                  <MapPin size={14} />
                  {c.location}
                </p>
              </div>
              {profile.clubIds.includes(c.id) && (
                <span className="hub-tag">Joined</span>
              )}
            </button>
          ))}
      </div>
      <div className="hub-section-title hub-row">
        <div>
          <p className="hub-eyebrow">CLUB DASHBOARD</p>
          <h2>{club.name}</h2>
        </div>
        <button
          className="hub-button"
          disabled={joined}
          onClick={() =>
            update((s) => {
              s.profiles
                .find((p) => p.id === profile.id)!
                .clubIds.push(selected);
            })
          }
        >
          {joined ? "You’re a member" : "Join this community"}
        </button>
      </div>
      <p>{club.description}</p>
      {joined || canManage ? (
        <>
          <Stats
            items={[
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
            ]}
          />
          <div className="hub-grid two">
            {canManage && (
              <Panel>
                <h2>Member register</h2>
                {members.length ? (
                  members.map((m) => (
                    <div className="hub-list-row" key={m.id}>
                      <span>{m.name}</span>
                      <Tag>{m.role}</Tag>
                    </div>
                  ))
                ) : (
                  <Empty>Be the first member of this sample community.</Empty>
                )}
              </Panel>
            )}
            <Panel>
              <h2>Club performance</h2>
              <p>
                Measure participation and follow through on the work you start
                together.
              </p>
              <div className="hub-list-row">
                <span>Volunteer hours recorded</span>
                <strong>
                  {activities
                    .filter((a) => a.type === "Volunteering")
                    .reduce((n, a) => n + a.hours * a.attendees.length, 0)}
                </strong>
              </div>
              <div className="hub-list-row">
                <span>Reports reviewed</span>
                <strong>
                  {activities.filter((a) => a.status === "Reviewed").length}
                </strong>
              </div>
              {canManage && (
                <button
                  className="hub-button secondary hub-space"
                  onClick={() =>
                    downloadCSV("club-performance.csv", [
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
                    ])
                  }
                >
                  Download club report
                </button>
              )}
            </Panel>
          </div>
          <h2 className="hub-section-title">Activities & attendance</h2>
          {!activities.length && (
            <Empty>
              No activities yet. A club leader can create the first one.
            </Empty>
          )}
          <div className="hub-stack">
            {activities.map((a) => (
              <Panel key={a.id}>
                <div className="hub-row">
                  <div>
                    <Tag>{a.type}</Tag>
                    <h3>{a.title}</h3>
                    <p>
                      {a.date} · {a.hours} hour{a.hours !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Tag>{a.status}</Tag>
                </div>
                <p>{a.attendees.length} members attended</p>
                {canManage && (
                  <div className="hub-attendance">
                    <h3>Record attendance</h3>
                    {members.map((m) => (
                      <label className="hub-check" key={m.id}>
                        <input
                          type="checkbox"
                          checked={a.attendees.includes(m.id)}
                          disabled={a.attendees.includes(m.id)}
                          onChange={() =>
                            update((s) => {
                              const activity = s.activities.find(
                                (x) => x.id === a.id,
                              )!;
                              if (!activity.attendees.includes(m.id)) {
                                activity.attendees.push(m.id);
                                const amount = {
                                  Meeting: 10,
                                  Volunteering: 20,
                                  Challenge: 25,
                                  Recruitment: 15,
                                }[activity.type];
                                award(
                                  s,
                                  m.id,
                                  `activity:${a.id}`,
                                  `${activity.type}: ${a.title}`,
                                  amount,
                                );
                              }
                            })
                          }
                        />
                        {m.name}
                        {a.attendees.includes(m.id) ? " · recorded" : ""}
                      </label>
                    ))}
                    <p className="hub-caption">
                      Confirmed attendance awards credits once per member.
                      Records are retained after confirmation.
                    </p>
                  </div>
                )}
                {canManage && a.status === "Draft" ? (
                  <form
                    className="hub-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const report = String(
                        new FormData(e.currentTarget).get("report"),
                      );
                      if (
                        update((s) => {
                          const r = s.activities.find((x) => x.id === a.id)!;
                          r.report = report;
                          r.status = "Submitted";
                        })
                      )
                        toast.success("Club report submitted for local review");
                    }}
                  >
                    <Field label="Activity report">
                      <textarea
                        name="report"
                        required
                        minLength={30}
                        maxLength={3000}
                        placeholder="Describe participation, outcomes, and lessons learned…"
                      />
                    </Field>
                    <button className="hub-button secondary">
                      Submit report
                    </button>
                  </form>
                ) : (
                  canManage &&
                  a.report && <p className="hub-prewrap">{a.report}</p>
                )}
                {profile.role === "Administrator" &&
                  a.status === "Submitted" && (
                    <button
                      className="hub-button secondary"
                      onClick={() =>
                        update((s) => {
                          s.activities.find((x) => x.id === a.id)!.status =
                            "Reviewed";
                        })
                      }
                    >
                      Mark report reviewed
                    </button>
                  )}
              </Panel>
            ))}
          </div>
          {canManage && (
            <Panel className="hub-space">
              <h2>Create a club activity</h2>
              <form
                key={selected}
                className="hub-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const f = new FormData(form);
                  if (
                    update((s) => {
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
                    })
                  ) {
                    form.reset();
                    toast.success("Activity added");
                  }
                }}
              >
                <div className="hub-grid two">
                  <Field label="Activity name">
                    <input
                      name="title"
                      required
                      minLength={3}
                      maxLength={100}
                    />
                  </Field>
                  <Field label="Activity type">
                    <select name="type">
                      {[
                        "Meeting",
                        "Volunteering",
                        "Challenge",
                        "Recruitment",
                      ].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date">
                    <input name="date" type="date" required />
                  </Field>
                  <Field label="Hours per participant">
                    <input
                      name="hours"
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      required
                      defaultValue="1"
                    />
                  </Field>
                </div>
                <button className="hub-button">Create activity</button>
              </form>
            </Panel>
          )}
          {!canManage && (
            <p className="hub-caption hub-space">
              Club leaders manage activities, attendance, and reports for their
              assigned communities. Member registers and reports are visible
              only to their leaders and administrators.
            </p>
          )}
        </>
      ) : (
        <Empty>
          Join this community to view its member activities. Registers and
          reports are available only to assigned club leaders.
        </Empty>
      )}
    </>
  );
}
