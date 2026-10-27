import { translateUi, useSiteLanguage } from '../../i18n/language';
import { confirmAction } from "@/components/shared/confirm-dialog";
import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useHub, uid } from "./store";
import { Empty, Field, Heading, Panel, SearchBox, Tag } from "./ui";
export function CommunityPage() {
    useSiteLanguage();
    const { state, profile, update } = useHub();
    const [search, setSearch] = useState("");
    return (<>
      <Heading eyebrow="A COMMUNITY BESIDE YOU" title={translateUi("Conversations that move us forward.")} description={translateUi("Ask a question, share a learning reflection, or start a conversation with your club.")}/>
      <div className="hub-grid community">
        <div className="hub-stack">
          <SearchBox value={search} onChange={setSearch} placeholder={translateUi("Search discussions")}/>
          {translateUi(state.posts
            .filter((p) => `${p.title} ${p.body}`
            .toLowerCase()
            .includes(search.toLowerCase()))
            .map((p) => (<Panel key={p.id}>
                <div className="hub-row">
                  <Tag>{translateUi(p.name)}</Tag>
                  <MessageCircle size={19}/>
                </div>
                <h2>{translateUi(p.title)}</h2>
                <p className="hub-prewrap">{translateUi(p.body)}</p>
                {translateUi(p.replies.map((r, i) => (<div key={i} className="hub-reply">
                    <strong>{translateUi(r.name)}</strong>
                    <p>{translateUi(r.body)}</p>
                  </div>)))}
                <form className="hub-form" onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                const body = String(new FormData(f).get("reply")).trim();
                if (update((s) => {
                    s.posts
                        .find((x) => x.id === p.id)!
                        .replies.push({ name: profile.name, body });
                }))
                    f.reset();
            }}>
                  <Field label={translateUi("Reply to {p0}", { p0: translateUi(p.title) })}>
                    <input name="reply" required minLength={2} maxLength={1000} placeholder={translateUi("Add a thoughtful reply\u2026")}/>
                  </Field>
                  <button className="hub-button secondary">{translateUi("Post reply")}</button>
                </form>
                {translateUi(profile.role === "Administrator" && (<button className="hub-text-button hub-space" onClick={async () => {
                    if (await confirmAction({
                        title: "Remove this discussion?",
                        description: "The discussion and all of its replies will be deleted.",
                        confirmLabel: "Remove",
                        destructive: true,
                    }))
                        update((s) => {
                            s.posts = s.posts.filter((x) => x.id !== p.id);
                        });
                }}>{translateUi(" Remove discussion ")}</button>))}
              </Panel>)))}
          {translateUi(!state.posts.length && (<Empty>{translateUi(" No discussions yet. Start with a question or something you learned. ")}</Empty>))}
        </div>
        <Panel>
          <h2>{translateUi("Start a conversation")}</h2>
          <p>{translateUi(" Keep it respectful. Share ideas without posting private information. ")}</p>
          <form className="hub-form" onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            if (update((s) => {
                s.posts.unshift({
                    id: uid(),
                    memberId: profile.id,
                    name: profile.name,
                    title: String(f.get("title")).trim(),
                    body: String(f.get("body")).trim(),
                    replies: [],
                });
            })) {
                form.reset();
                toast.success(translateUi("Discussion posted locally"));
            }
        }}>
            <Field label={translateUi("Discussion title")}>
              <input name="title" required minLength={5} maxLength={100}/>
            </Field>
            <Field label={translateUi("Your message")}>
              <textarea name="body" required minLength={10} maxLength={2500}/>
            </Field>
            <button className="hub-button">
              <Send size={16}/>{translateUi(" Start discussion ")}</button>
          </form>
        </Panel>
      </div>
    </>);
}
