// Live quiz (Fun corner): build a quiz, start a game with a PIN, and play it live in a meeting, class or conference.
// Hosts use the Hub; players join at /play with the PIN and a nickname, no account needed.
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Check, Crown, Gamepad2, Pencil, Play, Plus, Trash2, Trophy, Users, X } from "lucide-react";
import { platformApi } from "./platform-api";
import { Empty, Field, Heading, Panel, Spinner } from "./ui";
import { confirmAction } from "@/components/shared/confirm-dialog";
import "./live-quiz.css";

type Seconds = 10 | 20 | 30 | 60;
interface Question { text: string; answers: string[]; correct: number; seconds: Seconds }
interface Quiz { id: string; title: string; questions: Question[]; updated_at: string }
interface ShownQuestion { text: string; answers: string[]; seconds: number; remainingMs: number; correct?: number }
interface Standing { nickname: string; score: number }
interface HostState {
    id: string; pin: string; title: string; status: "lobby" | "question" | "reveal" | "finished";
    index: number; total: number; players: Standing[]; answered: number; counts: number[] | null;
    question: ShownQuestion | null; leaderboard: Standing[];
}
interface PlayerState {
    title: string; status: HostState["status"]; index: number; total: number; nickname: string; score: number; rank: number; players: number;
    question: ShownQuestion | null; answer: { choice: number; correct?: boolean; points?: number } | null; podium: Standing[] | null;
}

// Answer tiles: the same colour and shape on the host screen and on phones, so players can match them at a glance.
const TILES = [{ shape: "▲", name: "Triangle" }, { shape: "◆", name: "Diamond" }, { shape: "●", name: "Circle" }, { shape: "■", name: "Square" }];
const blankQuestion = (): Question => ({ text: "", answers: ["", ""], correct: 0, seconds: 20 });
const siteAddress = () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/^https?:\/\//, "").replace(/\/$/, "");
/** "1st" in English, "1er" in French; Kinyarwanda phrases already say "place number", so the number alone. */
const ordinal = (n: number, lang: string) => lang === "fr" ? (n === 1 ? "1er" : `${n}e`) : lang === "rw" ? String(n)
    : `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

/** Calls `load` now and every `ms` while mounted; `stop` pauses it. */
function usePoll(load: () => Promise<void>, ms: number, stop = false) {
    const saved = useRef(load);
    saved.current = load;
    useEffect(() => {
        if (stop) return;
        let alive = true, timer: ReturnType<typeof setTimeout>;
        const run = async () => { await saved.current().catch(() => undefined); if (alive) timer = setTimeout(run, ms); };
        void run();
        return () => { alive = false; clearTimeout(timer); };
    }, [ms, stop]);
}

/** Seconds left on the current question, counted down locally from what the server last reported. */
function useCountdown(question: ShownQuestion | null | undefined, open: boolean) {
    const [left, setLeft] = useState(0);
    const remaining = question?.remainingMs ?? 0;
    useEffect(() => {
        if (!open) { setLeft(0); return; }
        const end = Date.now() + remaining;
        const tick = () => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
        tick();
        const timer = setInterval(tick, 250);
        return () => clearInterval(timer);
    }, [remaining, open, question?.text]);
    return left;
}

// ---- Quiz list and builder (Hub) ---------------------------------------------------------------------------
export function LiveQuizPage() {
    useSiteLanguage();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
    const [editing, setEditing] = useState<Partial<Quiz> | null>(null);
    const [busy, setBusy] = useState(false);
    const load = useCallback(() => platformApi<Quiz[]>("/live-quizzes").then(setQuizzes).catch((e: Error) => { setQuizzes([]); toast.error(translateUi(e.message)); }), []);
    useEffect(() => { void load(); }, [load]);
    async function start(quiz: Quiz) {
        setBusy(true);
        try {
            const game = await platformApi<{ id: string }>(`/live-quizzes/${quiz.id}/games`, "POST", {});
            navigate(`/live-quiz/host/${game.id}`);
        }
        catch (e) { toast.error(translateUi((e as Error).message)); }
        finally { setBusy(false); }
    }
    async function remove(quiz: Quiz) {
        if (!await confirmAction({ title: `Delete “${quiz.title}”?`, description: "The quiz and its questions are removed.", confirmLabel: "Delete quiz", destructive: true })) return;
        try { await platformApi(`/live-quizzes/${quiz.id}`, "DELETE"); toast.success(translateUi("Quiz deleted")); void load(); }
        catch (e) { toast.error(translateUi((e as Error).message)); }
    }
    if (editing) return <QuizEditor quiz={editing} onClose={(saved) => { setEditing(null); if (saved) void load(); }}/>;
    return (<div className="ws-page lq-page">
      <Heading eyebrow="FUN CORNER" title="Live quiz" description="Create a quiz, start a game and share the PIN. Everyone in the room plays on their phone, and the fastest correct answers win." action={<button className="hub-button" onClick={() => setEditing({ title: "", questions: [blankQuestion()] })}><Plus size={16}/>{translateUi("New quiz")}</button>}/>
      <Panel className="lq-how">
        <ol>
          <li><strong>{translateUi("Create")}</strong><span>{translateUi("Write your questions and tick the right answer.")}</span></li>
          <li><strong>{translateUi("Share the PIN")}</strong><span>{translateUi("Show your screen. Players go to {p0} and enter the PIN.", { p0: `${siteAddress()}/play` })}</span></li>
          <li><strong>{translateUi("Play")}</strong><span>{translateUi("Start the questions, show the answers, and announce the winner.")}</span></li>
        </ol>
      </Panel>
      {quizzes === null ? <Spinner label="Loading your quizzes…"/> : !quizzes.length ? <Empty>{translateUi("You have no quizzes yet. Create one to play it live in a meeting, class or conference.")}</Empty> : (<div className="lq-grid">
          {quizzes.map((quiz) => (<article key={quiz.id} className="lq-card">
              <Gamepad2 size={22} aria-hidden="true"/>
              <h2>{translateUi(quiz.title)}</h2>
              <p>{translateUi(quiz.questions.length === 1 ? "1 question" : "{p0} questions", { p0: quiz.questions.length })}</p>
              <div className="lq-card-actions">
                <button className="hub-button" disabled={busy} onClick={() => void start(quiz)}><Play size={15}/>{translateUi("Start game")}</button>
                <button className="hub-record-icon hub-record-edit" aria-label={translateUi("Edit {p0}", { p0: quiz.title })} title={translateUi("Edit quiz")} onClick={() => setEditing(quiz)}><Pencil size={16}/></button>
                <button className="hub-record-icon hub-record-delete" aria-label={translateUi("Delete {p0}", { p0: quiz.title })} title={translateUi("Delete quiz")} onClick={() => void remove(quiz)}><Trash2 size={16}/></button>
              </div>
            </article>))}
        </div>)}
    </div>);
}

function QuizEditor({ quiz, onClose }: { quiz: Partial<Quiz>; onClose: (saved: boolean) => void }) {
    useSiteLanguage();
    const [title, setTitle] = useState(quiz.title ?? "");
    const [questions, setQuestions] = useState<Question[]>(() => structuredClone(quiz.questions?.length ? quiz.questions : [blankQuestion()]));
    const [busy, setBusy] = useState(false);
    const change = (i: number, next: Partial<Question>) => setQuestions((list) => list.map((q, n) => n === i ? { ...q, ...next } : q));
    async function save(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        try {
            const body = { title: title.trim(), questions: questions.map((q) => ({ ...q, text: q.text.trim(), answers: q.answers.map((a) => a.trim()) })) };
            await platformApi(quiz.id ? `/live-quizzes/${quiz.id}` : "/live-quizzes", quiz.id ? "PUT" : "POST", body);
            toast.success(translateUi("Quiz saved"));
            onClose(true);
        }
        catch (e) { toast.error(translateUi((e as Error).message)); }
        finally { setBusy(false); }
    }
    return (<div className="ws-page lq-page">
      <Heading eyebrow="LIVE QUIZ" title={quiz.id ? "Edit quiz" : "New quiz"} description="Each question needs 2 to 4 answers. Tick the right one."/>
      <form className="lq-editor" onSubmit={save}>
        <Panel><Field label="Quiz title"><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder={translateUi("e.g. Peace and history challenge")}/></Field></Panel>
        {questions.map((q, i) => (<Panel key={i} className="lq-question">
            <div className="lq-question-head">
              <strong>{translateUi("Question {p0}", { p0: i + 1 })}</strong>
              <label className="lq-seconds">{translateUi("Time")}<select value={q.seconds} onChange={(e) => change(i, { seconds: Number(e.target.value) as Seconds })}>{([10, 20, 30, 60] as const).map((s) => <option key={s} value={s}>{translateUi("{p0} seconds", { p0: s })}</option>)}</select></label>
              {questions.length > 1 && <button type="button" className="hub-record-icon hub-record-delete" aria-label={translateUi("Remove question {p0}", { p0: i + 1 })} onClick={() => setQuestions((list) => list.filter((_, n) => n !== i))}><Trash2 size={16}/></button>}
            </div>
            <Field label="Question"><textarea value={q.text} onChange={(e) => change(i, { text: e.target.value })} required maxLength={300} rows={2}/></Field>
            <fieldset className="lq-answers">
              <legend>{translateUi("Answers (tick the right one)")}</legend>
              {q.answers.map((answer, a) => (<div key={a} className={`lq-answer-row lq-tone-${a}`}>
                  <span className="lq-shape" aria-hidden="true">{TILES[a].shape}</span>
                  <input aria-label={translateUi("Answer {p0}", { p0: a + 1 })} value={answer} onChange={(e) => change(i, { answers: q.answers.map((x, n) => n === a ? e.target.value : x) })} required maxLength={120}/>
                  <label className="lq-correct"><input type="radio" name={`correct-${i}`} checked={q.correct === a} onChange={() => change(i, { correct: a })}/>{translateUi("Right answer")}</label>
                  {q.answers.length > 2 && <button type="button" className="hub-text-button" aria-label={translateUi("Remove answer {p0}", { p0: a + 1 })} onClick={() => change(i, { answers: q.answers.filter((_, n) => n !== a), correct: q.correct === a ? 0 : q.correct > a ? q.correct - 1 : q.correct })}><X size={16}/></button>}
                </div>))}
              {q.answers.length < 4 && <button type="button" className="hub-text-button" onClick={() => change(i, { answers: [...q.answers, ""] })}><Plus size={15}/>{translateUi("Add an answer")}</button>}
            </fieldset>
          </Panel>))}
        <div className="lq-editor-actions">
          {questions.length < 50 && <button type="button" className="hub-button secondary" onClick={() => setQuestions((list) => [...list, blankQuestion()])}><Plus size={16}/>{translateUi("Add a question")}</button>}
          <span/>
          <button type="button" className="hub-button secondary" onClick={() => onClose(false)}>{translateUi("Cancel")}</button>
          <button className="hub-button" disabled={busy}>{translateUi(busy ? "Saving…" : "Save quiz")}</button>
        </div>
      </form>
    </div>);
}

// ---- Host screen (projector) ---------------------------------------------------------------------------------
export function LiveQuizHostPage() {
    useSiteLanguage();
    const { id = "" } = useParams();
    const [game, setGame] = useState<HostState | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    usePoll(async () => {
        try { setGame(await platformApi<HostState>(`/live-games/${id}`)); setError(""); }
        catch (e) { setError((e as Error).message); }
    }, 1000, game?.status === "finished");
    const left = useCountdown(game?.question, game?.status === "question");
    async function act(action: "next" | "reveal" | "end") {
        if (action === "end" && !await confirmAction({ title: "End this game?", description: "Players see the final results.", confirmLabel: "End game", destructive: true })) return;
        setBusy(true);
        try { setGame(await platformApi<HostState>(`/live-games/${id}/action`, "POST", { action })); }
        catch (e) { toast.error(translateUi((e as Error).message)); }
        finally { setBusy(false); }
    }
    if (!game) return <div className="hub-app lq-stage"><div className="lq-stage-inner">{error ? <><p className="lq-big-message">{translateUi(error)}</p><Link className="hub-button" to="/live-quiz">{translateUi("Back to my quizzes")}</Link></> : <Spinner label="Opening the game…" screen/>}</div></div>;
    const q = game.question;
    const last = game.index + 1 >= game.total;
    return (<div className="hub-app lq-stage">
      <header className="lq-stage-bar">
        <span className="lq-stage-title"><Gamepad2 size={18}/>{translateUi(game.title)}</span>
        {game.status !== "lobby" && game.status !== "finished" && <span>{translateUi("Question {p0} of {p1}", { p0: game.index + 1, p1: game.total })}</span>}
        <span className="lq-stage-pin">{translateUi("PIN")} <strong>{game.pin}</strong></span>
        {game.status !== "finished" && <button className="hub-text-button" disabled={busy} onClick={() => void act("end")}>{translateUi("End game")}</button>}
      </header>
      <main className="lq-stage-inner">
        {game.status === "lobby" && (<>
            <p className="lq-join-hint">{translateUi("Join at")} <strong>{siteAddress()}/play</strong></p>
            <p className="lq-join-hint">{translateUi("Game PIN")}</p>
            <p className="lq-pin" aria-label={translateUi("Game PIN {p0}", { p0: game.pin.split("").join(" ") })}>{game.pin.slice(0, 3)} {game.pin.slice(3)}</p>
            <p className="lq-count"><Users size={20}/>{translateUi(game.players.length === 1 ? "1 player" : "{p0} players", { p0: game.players.length })}</p>
            <ul className="lq-names" aria-live="polite">{game.players.map((p) => <li key={p.nickname}>{p.nickname}</li>)}</ul>
            <button className="hub-button lq-go" disabled={busy || !game.players.length} onClick={() => void act("next")}>{translateUi(game.players.length ? "Start the quiz" : "Waiting for players…")}<ArrowRight size={18}/></button>
          </>)}
        {(game.status === "question" || game.status === "reveal") && q && (<>
            <h1 className="lq-question-text">{translateUi(q.text)}</h1>
            {game.status === "question" && <div className="lq-timer-row"><span className="lq-timer" aria-label={translateUi("{p0} seconds left", { p0: left })}>{left}</span><span>{translateUi("{p0} of {p1} answered", { p0: game.answered, p1: game.players.length })}</span></div>}
            <div className="lq-tiles">{q.answers.map((answer, i) => (<div key={i} className={`lq-tile lq-tone-${i}${game.status === "reveal" ? (i === q.correct ? " is-correct" : " is-faded") : ""}`}>
                <span className="lq-shape" aria-hidden="true">{TILES[i].shape}</span><span>{translateUi(answer)}</span>
                {game.status === "reveal" && <b className="lq-tile-count">{i === q.correct && <Check size={20} aria-label={translateUi("Right answer")}/>}{game.counts?.[i] ?? 0}</b>}
              </div>))}</div>
            {game.status === "question" ? <button className="hub-button secondary lq-go" disabled={busy} onClick={() => void act("reveal")}>{translateUi("Show the answer now")}</button> : (<>
                <Leaderboard rows={game.leaderboard.slice(0, 5)}/>
                <button className="hub-button lq-go" disabled={busy} onClick={() => void act("next")}>{translateUi(last ? "See the winner" : "Next question")}<ArrowRight size={18}/></button>
              </>)}
          </>)}
        {game.status === "finished" && (<>
            <Podium rows={game.leaderboard.slice(0, 3)}/>
            {game.leaderboard.length > 3 && <Leaderboard rows={game.leaderboard.slice(3, 10)} start={4}/>}
            <div className="lq-stage-actions"><Link className="hub-button" to="/live-quiz">{translateUi("Back to my quizzes")}</Link></div>
          </>)}
      </main>
    </div>);
}

function Leaderboard({ rows, start = 1 }: { rows: Standing[]; start?: number }) {
    useSiteLanguage();
    if (!rows.length) return null;
    return <ol className="lq-board" start={start} aria-label={translateUi("Leaderboard")}>{rows.map((r, i) => <li key={r.nickname}><em aria-hidden="true">{start + i}</em><span>{r.nickname}</span><b>{r.score}</b></li>)}</ol>;
}
function Podium({ rows }: { rows: Standing[] }) {
    const lang = useSiteLanguage();
    if (!rows.length) return <p className="lq-big-message">{translateUi("No one played this game.")}</p>;
    return (<div className="lq-podium">
      <p className="lq-winner"><Crown size={30} aria-hidden="true"/>{translateUi("The winner is")}</p>
      <h1>{rows[0].nickname}</h1>
      <ol>{rows.map((r, i) => <li key={r.nickname} className={`lq-place-${i + 1}`}><Trophy size={20} aria-hidden="true"/><span>{ordinal(i + 1, lang)}</span><strong>{r.nickname}</strong><b>{r.score}</b></li>)}</ol>
    </div>);
}

// ---- Player screen (phone, no account) ----------------------------------------------------------------------
const TOKEN_KEY = "plp-play-token";
const readToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
const writeToken = (value: string) => { try { if (value) sessionStorage.setItem(TOKEN_KEY, value); else sessionStorage.removeItem(TOKEN_KEY); } catch { /* Private mode: the game still works until the page reloads. */ } };
async function playApi<T>(path: string, token: string, method = "GET", body?: object): Promise<T> {
    const response = await fetch("/api/public/play/" + path, { method, headers: { "Content-Type": "application/json", ...(token ? { "X-Play-Token": token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || "Something went wrong. Try again."), { status: response.status });
    return data as T;
}

export function PlayPage() {
    const lang = useSiteLanguage();
    const [params] = useSearchParams();
    const [token, setToken] = useState(readToken);
    const [state, setState] = useState<PlayerState | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const leave = useCallback((message = "") => { writeToken(""); setToken(""); setState(null); setError(message); }, []);
    usePoll(async () => {
        try { setState(await playApi<PlayerState>("state", token)); }
        catch (e) { if ((e as { status?: number }).status === 404) leave((e as Error).message); }
    }, 1000, !token || state?.status === "finished");
    const left = useCountdown(state?.question, state?.status === "question" && !state.answer);
    async function join(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true); setError("");
        try {
            const { token: next } = await playApi<{ token: string }>("join", "", "POST", { pin: String(form.get("pin")).replace(/\s/g, ""), nickname: String(form.get("nickname")).trim() });
            writeToken(next); setToken(next);
        }
        catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    }
    async function answer(choice: number) {
        if (!state || state.answer) return;
        setState({ ...state, answer: { choice } });
        try { await playApi("answer", token, "POST", { choice }); }
        catch (e) { toast.error(translateUi((e as Error).message)); }
    }
    let content;
    if (!token) {
        content = (<form className="lq-join" onSubmit={join}>
          <Gamepad2 size={40} aria-hidden="true"/>
          <h1>{translateUi("Join a live quiz")}</h1>
          <label><span>{translateUi("Game PIN")}</span><input name="pin" inputMode="numeric" autoComplete="off" pattern="\d{3}\s?\d{3}" maxLength={7} required defaultValue={params.get("pin") ?? ""} placeholder="123 456"/></label>
          <label><span>{translateUi("Your nickname")}</span><input name="nickname" maxLength={24} required autoComplete="nickname" placeholder={translateUi("How others will see you")}/></label>
          {error && <p role="alert" className="lq-error">{translateUi(error)}</p>}
          <button className="hub-button lq-go" disabled={busy}>{translateUi(busy ? "Joining…" : "Join game")}<ArrowRight size={18}/></button>
        </form>);
    }
    else if (!state) content = <Spinner label="Joining the game…"/>;
    else if (state.status === "lobby") {
        content = <div className="lq-wait"><Check size={44} aria-hidden="true"/><h1>{translateUi("You’re in, {p0}!", { p0: state.nickname })}</h1><p>{translateUi("See your name on the host’s screen. The quiz starts soon.")}</p></div>;
    }
    else if (state.status === "question" && state.question) {
        const q = state.question;
        content = state.answer
            ? <div className="lq-wait"><span className={`lq-tile lq-tone-${state.answer.choice} lq-mini`}><span className="lq-shape" aria-hidden="true">{TILES[state.answer.choice].shape}</span></span><h1>{translateUi("Answer locked in")}</h1><p>{translateUi("Waiting for the others…")}</p></div>
            : (<div className="lq-answer-screen">
                <p className="lq-phone-meta"><span>{translateUi("{p0} / {p1}", { p0: state.index + 1, p1: state.total })}</span><span className="lq-timer lq-timer-small">{left}</span></p>
                <h1>{translateUi(q.text)}</h1>
                <div className="lq-tiles lq-phone-tiles">{q.answers.map((a, i) => <button key={i} className={`lq-tile lq-tone-${i}`} onClick={() => void answer(i)} disabled={left === 0}><span className="lq-shape" aria-hidden="true">{TILES[i].shape}</span><span>{translateUi(a)}</span></button>)}</div>
              </div>);
    }
    else if (state.status === "reveal") {
        const a = state.answer;
        content = (<div className={`lq-result ${a?.correct ? "is-correct" : "is-wrong"}`}>
          <h1>{translateUi(!a ? "Time’s up" : a.correct ? "Correct!" : "Not this time")}</h1>
          {a?.correct && <p className="lq-points">+{a.points}</p>}
          {state.question?.correct !== undefined && !a?.correct && <p>{translateUi("The right answer was: {p0}", { p0: state.question.answers[state.question.correct] })}</p>}
          <p>{translateUi("You’re in {p0} place with {p1} points.", { p0: ordinal(state.rank, lang), p1: state.score })}</p>
        </div>);
    }
    else if (state.status === "finished") {
        content = (<div className="lq-wait">
          <Trophy size={44} aria-hidden="true"/>
          <h1>{translateUi(state.rank === 1 ? "You won!" : "Game over")}</h1>
          <p>{translateUi("You finished {p0} of {p1} with {p2} points.", { p0: ordinal(state.rank, lang), p1: state.players, p2: state.score })}</p>
          {state.podium && <Podium rows={state.podium}/>}
          <button className="hub-button" onClick={() => leave()}>{translateUi("Join another game")}</button>
        </div>);
    }
    return (<div className="hub-app lq-play">
      <header className="lq-play-bar"><Link to="/" aria-label={translateUi("Peace and Love Proclaimers home")}><img src="/logo.svg" alt="" height={34}/></Link>{state && <span>{state.nickname} · {state.score}</span>}</header>
      <main>{content}</main>
    </div>);
}
