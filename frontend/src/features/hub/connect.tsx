import { confirmAction } from "@/components/shared/confirm-dialog";
import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useHub, uid } from "./store";
import { Empty, Field, Heading, Panel, SearchBox, Tag } from "./ui";
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
                    onClick={async () => {
                      if (
                        await confirmAction({
                          title: "Remove this discussion?",
                          description: "The discussion and all of its replies will be deleted.",
                          confirmLabel: "Remove",
                          destructive: true,
                        })
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
        </Panel>
      </div>
    </>
  );
}
