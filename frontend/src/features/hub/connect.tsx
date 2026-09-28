import { readUpload } from "./operations-data";
import { useState } from "react";
import {
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  MessageCircle,
  Send,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import { categories, mentors, opportunityTypes } from "./data";
import { useHub, uid, today } from "./store";
import { Empty, Field, Heading, Panel, SearchBox, Tag } from "./ui";
export function OpportunitiesPage() {
  const { state, profile, update } = useHub();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All types");
  const [tab, setTab] = useState("Explore");
  const [selected, setSelected] = useState("");
  const list = state.opportunities.filter(
    (o) =>
      o.published &&
      (type === "All types" || o.type === type) &&
      `${o.title} ${o.organization} ${o.location}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (tab !== "Saved" ||
        state.saved.some(
          (s) => s.memberId === profile.id && s.opportunityId === o.id,
        )) &&
      (tab !== "My applications" ||
        state.applications.some(
          (a) => a.memberId === profile.id && a.opportunityId === o.id,
        )),
  );
  return (
    <>
      <Heading
        eyebrow="PLP CONNECT"
        title="Your next opportunity awaits."
        description="Put your skills into practice. Find a place to learn, contribute, and grow."
      />
      <div className="hub-chips">
        {["Explore", "Saved", "My applications"].map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="hub-toolbar">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search opportunities or locations"
        />
        <select
          aria-label="Opportunity type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {["All types", ...opportunityTypes].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <p className="hub-caption">
        Sample listings · Applications are practice records stored in this
        browser, not sent to organizations.
      </p>
      <div className="hub-grid two">
        {list.map((o) => {
          const saved = state.saved.some(
            (s) => s.memberId === profile.id && s.opportunityId === o.id,
          );
          const applied = state.applications.find(
            (a) => a.memberId === profile.id && a.opportunityId === o.id,
          );
          const closed = o.deadline < today();
          return (
            <Panel key={o.id}>
              <div className="hub-row">
                <span className="hub-feature-icon">
                  <BriefcaseBusiness />
                </span>
                <button
                  className={`hub-icon-button ${saved ? "selected" : ""}`}
                  aria-label={`${saved ? "Unsave" : "Save"} ${o.title}`}
                  onClick={() =>
                    update((s) => {
                      s.saved = s.saved.filter(
                        (x) =>
                          !(
                            x.memberId === profile.id &&
                            x.opportunityId === o.id
                          ),
                      );
                      if (!saved)
                        s.saved.push({
                          memberId: profile.id,
                          opportunityId: o.id,
                        });
                    })
                  }
                >
                  <Bookmark fill={saved ? "currentColor" : "none"} size={20} />
                </button>
              </div>
              <Tag>{o.type}</Tag>
              <h2>{o.title}</h2>
              <p>{o.organization}</p>
              <p className="hub-muted">
                <MapPin size={15} />
                {o.location}
              </p>
              <p className="hub-muted">
                <CalendarDays size={15} />
                {closed ? "Closed" : "Apply by"} {o.deadline}
              </p>
              <p>{o.description}</p>
              <p className="hub-caption">{o.eligibility}</p>
              {applied ? (
                <div className="hub-feedback">
                  <strong>
                    Practice application recorded · {applied.date}
                  </strong>
                  <p>{applied.note}</p>
                  {applied.documents?.map(d=><p key={d.kind}><a href={d.file.data} download={d.file.name}>{d.kind}: {d.file.name}</a></p>)}
                  <button
                    className="hub-text-button"
                    onClick={() =>
                      update((s) => {
                        s.applications = s.applications.filter(
                          (a) =>
                            !(
                              a.memberId === profile.id &&
                              a.opportunityId === o.id
                            ),
                        );
                      })
                    }
                  >
                    Withdraw practice application
                  </button>
                </div>
              ) : selected === o.id ? (
                <form
                  className="hub-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const note = String(form.get('note')).trim();
                    let documents: {kind:string;file:Awaited<ReturnType<typeof readUpload>>}[]=[];
                    try { for(const kind of ['CV','Cover letter','Supporting letter']) { const file=form.get(kind) as File; if(file?.size)documents.push({kind,file:await readUpload(file)}); } } catch(e) { toast.error((e as Error).message); return; }
                    if (
                      update((s) => {
                        if (
                          !s.applications.some(
                            (a) =>
                              a.memberId === profile.id &&
                              a.opportunityId === o.id,
                          )
                        )
                          s.applications.push({
                            memberId: profile.id,
                            opportunityId: o.id,
                            note,
                            documents,
                            date: today(),
                          });
                      })
                    ) {
                      toast.success("Practice application saved");
                      setSelected("");
                    }
                  }}
                >
                  <Field label="Why are you interested?">
                    <textarea
                      name="note"
                      required
                      minLength={20}
                      maxLength={1500}
                    />
                  </Field>
                  {['CV','Cover letter','Supporting letter'].map(kind=><Field key={kind} label={`${kind} (optional)`}><input type="file" name={kind} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"/></Field>)}
                  <p className="hub-caption">PDF, DOC, DOCX or image · up to 1.5 MB per file.</p>
                  <div className="hub-actions">
                    <button className="hub-button">
                      Record practice application
                    </button>
                    <button
                      type="button"
                      className="hub-text-button"
                      onClick={() => setSelected("")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="hub-button secondary"
                  disabled={closed}
                  onClick={() => setSelected(o.id)}
                >
                  {closed ? "Applications closed" : "Prepare application"}
                </button>
              )}
            </Panel>
          );
        })}
      </div>
      {!list.length && (
        <Empty>
          No opportunities in this view. Explore the catalogue or change your
          filters.
        </Empty>
      )}
    </>
  );
}
export function MentorshipPage() {
  const { state, profile, update } = useHub();
  const [area, setArea] = useState("All focus areas");
  const [selected, setSelected] = useState("");
  const sessions = state.sessions.filter((s) => s.memberId === profile.id);
  return (
    <>
      <Heading
        eyebrow="GROW TOGETHER"
        title="A little guidance. A bigger horizon."
        description="Find a mentor, industry expert, or coach who can help you take your next step."
      />
      <Panel>
        <div className="hub-row">
          <div>
            <h2>Find your match</h2>
            <p>Choose the area you want to grow in.</p>
          </div>
          <select
            aria-label="Mentor focus area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            {["All focus areas", ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </Panel>
      <p className="hub-caption hub-space">
        Sample profiles and bookings. No invitation or message is sent to a real
        mentor.
      </p>
      <div className="hub-grid three">
        {mentors
          .filter((m) => area === "All focus areas" || m.area === area)
          .map((m) => (
            <Panel key={m.id}>
              <div className="hub-mentor-avatar">{m.initials}</div>
              <Tag>{m.role}</Tag>
              <h2>{m.name}</h2>
              <h3>{m.title}</h3>
              <p>{m.bio}</p>
              <Tag>{m.area}</Tag>
              <button
                className="hub-button secondary hub-space"
                onClick={() => setSelected(selected === m.id ? "" : m.id)}
              >
                Request a session <HeartHandshake size={16} />
              </button>
              {selected === m.id && (
                <form
                  className="hub-form hub-space"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const date = String(f.get("date"));
                    if (new Date(date).getTime() <= Date.now()) {
                      toast.error("Choose a future session time.");
                      return;
                    }
                    if (
                      state.sessions.some(
                        (s) =>
                          s.mentorId === m.id &&
                          s.date === date &&
                          s.status !== "Cancelled",
                      )
                    ) {
                      toast.error(
                        "This sample slot is already requested. Choose another time.",
                      );
                      return;
                    }
                    if (
                      update((s) => {
                        s.sessions.push({
                          id: uid(),
                          memberId: profile.id,
                          mentorId: m.id,
                          date,
                          goal: String(f.get("goal")).trim(),
                          status: "Requested",
                        });
                      })
                    ) {
                      setSelected("");
                      toast.success("Local session request saved");
                    }
                  }}
                >
                  <Field label="Preferred date & time">
                    <input
                      name="date"
                      type="datetime-local"
                      min={`${today()}T00:00`}
                      required
                    />
                  </Field>
                  <Field label="What would you like to work on?">
                    <textarea
                      name="goal"
                      minLength={15}
                      maxLength={1200}
                      required
                    />
                  </Field>
                  <button className="hub-button">Save session request</button>
                </form>
              )}
            </Panel>
          ))}
      </div>
      {!mentors.some((m) => area === "All focus areas" || m.area === area) && (
        <Empty>
          No sample mentors in this focus area yet. Choose another focus area.
        </Empty>
      )}
      <h2 className="hub-section-title">My sessions</h2>
      {!sessions.length ? (
        <Empty>
          Your mentoring journey starts with a conversation. Request your first
          session above.
        </Empty>
      ) : (
        <div className="hub-stack">
          {sessions.map((s) => (
            <Panel key={s.id}>
              <div className="hub-row">
                <h3>
                  {mentors.find((m) => m.id === s.mentorId)?.name} ·{" "}
                  {new Date(s.date).toLocaleString()}
                </h3>
                <Tag>{s.status}</Tag>
              </div>
              <p>{s.goal}</p>
              {s.status === "Requested" && (
                <form
                  className="hub-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const reflection = String(
                      new FormData(e.currentTarget).get("reflection"),
                    );
                    update((d) => {
                      const session = d.sessions.find((x) => x.id === s.id)!;
                      session.status = "Completed";
                      session.reflection = reflection;
                    });
                  }}
                >
                  <Field label="Session reflection">
                    <textarea
                      name="reflection"
                      required
                      minLength={20}
                      placeholder="Record a takeaway after the session…"
                    />
                  </Field>
                  <div className="hub-actions">
                    <button className="hub-button secondary">
                      Mark completed
                    </button>
                    <button
                      type="button"
                      className="hub-text-button"
                      onClick={() =>
                        update((d) => {
                          d.sessions.find((x) => x.id === s.id)!.status =
                            "Cancelled";
                        })
                      }
                    >
                      Cancel request
                    </button>
                  </div>
                </form>
              )}
              {s.reflection && (
                <p>
                  <strong>Your takeaway:</strong> {s.reflection}
                </p>
              )}
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
export function CommunityPage() {
  const { state, profile, update } = useHub();
  const [search, setSearch] = useState("");
  return (
    <>
      <Heading
        eyebrow="A COMMUNITY BESIDE YOU"
        title="Conversations that move us forward."
        description="Ask a question, share a learning reflection, or start a conversation with your club."
      />
      <div className="hub-grid community">
        <div className="hub-stack">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search discussions"
          />
          {state.posts
            .filter((p) =>
              `${p.title} ${p.body}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((p) => (
              <Panel key={p.id}>
                <div className="hub-row">
                  <Tag>{p.name}</Tag>
                  <MessageCircle size={19} />
                </div>
                <h2>{p.title}</h2>
                <p className="hub-prewrap">{p.body}</p>
                {p.replies.map((r, i) => (
                  <div key={i} className="hub-reply">
                    <strong>{r.name}</strong>
                    <p>{r.body}</p>
                  </div>
                ))}
                <form
                  className="hub-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    const body = String(new FormData(f).get("reply")).trim();
                    if (
                      update((s) => {
                        s.posts
                          .find((x) => x.id === p.id)!
                          .replies.push({ name: profile.name, body });
                      })
                    )
                      f.reset();
                  }}
                >
                  <Field label={`Reply to ${p.title}`}>
                    <input
                      name="reply"
                      required
                      minLength={2}
                      maxLength={1000}
                      placeholder="Add a thoughtful reply…"
                    />
                  </Field>
                  <button className="hub-button secondary">Post reply</button>
                </form>
                {profile.role === "Administrator" && (
                  <button
                    className="hub-text-button hub-space"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this discussion and its replies?",
                        )
                      )
                        update((s) => {
                          s.posts = s.posts.filter((x) => x.id !== p.id);
                        });
                    }}
                  >
                    Remove discussion
                  </button>
                )}
              </Panel>
            ))}
          {!state.posts.length && (
            <Empty>
              No discussions yet. Start with a question or something you
              learned.
            </Empty>
          )}
        </div>
        <Panel>
          <h2>Start a conversation</h2>
          <p>
            Keep it respectful. Share ideas without posting private information.
          </p>
          <form
            className="hub-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              if (
                update((s) => {
                  s.posts.unshift({
                    id: uid(),
                    memberId: profile.id,
                    name: profile.name,
                    title: String(f.get("title")).trim(),
                    body: String(f.get("body")).trim(),
                    replies: [],
                  });
                })
              ) {
                form.reset();
                toast.success("Discussion posted locally");
              }
            }}
          >
            <Field label="Discussion title">
              <input name="title" required minLength={5} maxLength={100} />
            </Field>
            <Field label="Your message">
              <textarea name="body" required minLength={10} maxLength={2500} />
            </Field>
            <button className="hub-button">
              <Send size={16} /> Start discussion
            </button>
          </form>
          <p className="hub-caption">
            Visible only to profiles in this browser preview.
          </p>
        </Panel>
      </div>
    </>
  );
}
