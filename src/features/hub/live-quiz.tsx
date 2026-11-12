// Live quiz (Fun corner): build a quiz, start a game with a PIN, and play it live in a meeting, class or conference.
// Hosts build and run games at /live-quiz (signed in); players join at /play with the PIN and a nickname, no account needed.
// The public website has its own Live quiz page that sends people here.
import { translateUi, useSiteLanguage, formatDate } from '../../i18n/language';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import QRCode from "qrcode";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Crown, Gamepad2, LayoutDashboard, ListChecks, Pencil, Play, Plus, Trash2, Trophy, Users, X } from "lucide-react";
import { platformApi } from "./platform-api";
import { Spinner } from "./ui";
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
const SHAPES = ["▲", "◆", "●", "■"];
const blankQuestion = (): Question => ({ text: "", answers: ["", ""], correct: 0, seconds: 20 });
const siteOrigin = () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
const siteAddress = () => siteOrigin().replace(/^https?:\/\//, "");
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

/** A round countdown that empties as time runs out. */
function Timer({ left, total, small = false }: { left: number; total: number; small?: boolean }) {
    useSiteLanguage();
    const r = 26, c = 2 * Math.PI * r, share = total ? left / total : 0;
    return <span className={`lq-timer${small ? " is-small" : ""}${left <= 5 ? " is-low" : ""}`} role="timer" aria-label={translateUi("{p0} seconds left", { p0: left })}>
      <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r={r}/><circle cx="32" cy="32" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - share)}/></svg>
      <b>{left}</b>
    </span>;
}

// ---- Quiz studio: list and builder (signed in, outside the dashboard) -------------------------------------------
function Studio({ children }: { children: ReactNode }) {
    useSiteLanguage();
    return (<div className="hub-app lq-studio">
      <header className="lq-studio-bar">
        <a href={siteOrigin()} className="lq-studio-brand" aria-label={translateUi("Peace and Love Proclaimers website")}><img src="/logo.svg" alt="" width={120} height={68}/></a>
        <span className="lq-studio-name"><Gamepad2 size={18} aria-hidden="true"/>{translateUi("Live quiz")}</span>
        <nav aria-label={translateUi("Live quiz")}>
          <Link to="/play">{translateUi("Join a game")}</Link>
          <Link to="/hub"><LayoutDashboard size={16} aria-hidden="true"/>{translateUi("My Hub")}</Link>
        </nav>
      </header>
      <main className="lq-studio-main">{children}</main>
    </div>);
}

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
    if (editing) return <Studio><QuizEditor quiz={editing} onClose={(saved) => { setEditing(null); if (saved) void load(); }}/></Studio>;
    return (<Studio>
      <section className="lq-hero">
        <div>
          <p className="lq-eyebrow">{translateUi("FUN CORNER · LIVE QUIZ")}</p>
          <h1>{translateUi("Make any room a game.")}</h1>
          <p>{translateUi("Create a quiz, start a game and share the PIN. Everyone in the room plays on their phone, and the fastest correct answers win.")}</p>
          <button className="lq-btn lq-btn-gold" onClick={() => setEditing({ title: "", questions: [blankQuestion()] })}><Plus size={18}/>{translateUi("New quiz")}</button>
        </div>
        <ol className="lq-steps">
          <li><b>1</b><span><strong>{translateUi("Create")}</strong>{translateUi("Write your questions and tick the right answer.")}</span></li>
          <li><b>2</b><span><strong>{translateUi("Share the PIN")}</strong>{translateUi("Show your screen. Players go to {p0} and enter the PIN.", { p0: `${siteAddress()}/play` })}</span></li>
          <li><b>3</b><span><strong>{translateUi("Play")}</strong>{translateUi("Start the questions, show the answers, and announce the winner.")}</span></li>
        </ol>
      </section>
      <section className="lq-library" aria-labelledby="lq-library-title">
        <h2 id="lq-library-title">{translateUi("My quizzes")}</h2>
        {quizzes === null ? <Spinner label="Loading your quizzes…"/> : !quizzes.length ? (<div className="lq-empty">
            <Gamepad2 size={34} aria-hidden="true"/>
            <p>{translateUi("You have no quizzes yet. Create one to play it live in a meeting, class or conference.")}</p>
            <button className="lq-btn" onClick={() => setEditing({ title: "", questions: [blankQuestion()] })}><Plus size={17}/>{translateUi("Create your first quiz")}</button>
          </div>) : (<div className="lq-grid">
            {quizzes.map((quiz, n) => {
                const seconds = quiz.questions.reduce((sum, q) => sum + q.seconds, 0);
                return (<article key={quiz.id} className={`lq-card lq-card-${n % 4}`}>
                <div className="lq-card-cover" aria-hidden="true"><span className="lq-card-shape">{SHAPES[n % 4]}</span><span className="lq-card-mark">{SHAPES[(n + 1) % 4]}</span></div>
                <div className="lq-card-body">
                  <h3>{translateUi(quiz.title)}</h3>
                  <ul className="lq-card-meta">
                    <li><ListChecks size={15} aria-hidden="true"/>{translateUi(quiz.questions.length === 1 ? "1 question" : "{p0} questions", { p0: quiz.questions.length })}</li>
                    <li><Clock3 size={15} aria-hidden="true"/>{translateUi(seconds < 60 ? "{p0} sec" : "{p0} min", { p0: seconds < 60 ? seconds : Math.ceil(seconds / 60) })}</li>
                    <li><CalendarDays size={15} aria-hidden="true"/>{formatDate(quiz.updated_at, { day: "numeric", month: "short" })}</li>
                  </ul>
                </div>
                <div className="lq-card-actions">
                  <button className="lq-btn lq-start" disabled={busy} onClick={() => void start(quiz)}><Play size={16} fill="currentColor"/>{translateUi("Start game")}</button>
                  <button className="lq-icon" aria-label={translateUi("Edit {p0}", { p0: quiz.title })} title={translateUi("Edit quiz")} onClick={() => setEditing(quiz)}><Pencil size={16}/></button>
                  <button className="lq-icon is-danger" aria-label={translateUi("Delete {p0}", { p0: quiz.title })} title={translateUi("Delete quiz")} onClick={() => void remove(quiz)}><Trash2 size={16}/></button>
                </div>
              </article>);
            })}
            <button type="button" className="lq-card-new" onClick={() => setEditing({ title: "", questions: [blankQuestion()] })}><span><Plus size={26}/></span><strong>{translateUi("New quiz")}</strong><small>{translateUi("Write questions and tick the right answers")}</small></button>
          </div>)}
      </section>
    </Studio>);
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
    return (<form className="lq-editor" onSubmit={save}>
      <div className="lq-editor-head">
        <button type="button" className="lq-back" onClick={() => onClose(false)}><ArrowLeft size={16}/>{translateUi("Back to my quizzes")}</button>
        <h1>{translateUi(quiz.id ? "Edit quiz" : "New quiz")}</h1>
        <p>{translateUi("Each question needs 2 to 4 answers. Tick the right one.")}</p>
      </div>
      <label className="lq-title-field"><span>{translateUi("Quiz title")}</span><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder={translateUi("e.g. Peace and history challenge")}/></label>
      {questions.map((q, i) => (<section key={i} className="lq-question" aria-label={translateUi("Question {p0}", { p0: i + 1 })}>
          <div className="lq-question-head">
            <b className="lq-number">{i + 1}</b>
            <label className="lq-seconds"><Clock3 size={15} aria-hidden="true"/><span className="sr-only">{translateUi("Time")}</span><select value={q.seconds} onChange={(e) => change(i, { seconds: Number(e.target.value) as Seconds })}>{([10, 20, 30, 60] as const).map((s) => <option key={s} value={s}>{translateUi("{p0} seconds", { p0: s })}</option>)}</select></label>
            {questions.length > 1 && <button type="button" className="lq-icon is-danger" aria-label={translateUi("Remove question {p0}", { p0: i + 1 })} onClick={() => setQuestions((list) => list.filter((_, n) => n !== i))}><Trash2 size={16}/></button>}
          </div>
          <textarea className="lq-question-input" aria-label={translateUi("Question {p0}", { p0: i + 1 })} value={q.text} onChange={(e) => change(i, { text: e.target.value })} required maxLength={300} rows={2} placeholder={translateUi("Type your question")}/>
          <div className="lq-answers" role="radiogroup" aria-label={translateUi("Answers (tick the right one)")}>
            {q.answers.map((answer, a) => (<div key={a} className={`lq-answer lq-tone-${a}${q.correct === a ? " is-right" : ""}`}>
                <span className="lq-shape" aria-hidden="true">{SHAPES[a]}</span>
                <input aria-label={translateUi("Answer {p0}", { p0: a + 1 })} value={answer} onChange={(e) => change(i, { answers: q.answers.map((x, n) => n === a ? e.target.value : x) })} required maxLength={120} placeholder={translateUi("Answer {p0}", { p0: a + 1 })}/>
                <label className="lq-tick" title={translateUi("Right answer")}><input type="radio" name={`correct-${i}`} checked={q.correct === a} onChange={() => change(i, { correct: a })}/><Check size={16} aria-hidden="true"/><span className="sr-only">{translateUi("Right answer")}</span></label>
                {q.answers.length > 2 && <button type="button" className="lq-remove" aria-label={translateUi("Remove answer {p0}", { p0: a + 1 })} onClick={() => change(i, { answers: q.answers.filter((_, n) => n !== a), correct: q.correct === a ? 0 : q.correct > a ? q.correct - 1 : q.correct })}><X size={15}/></button>}
              </div>))}
            {q.answers.length < 4 && <button type="button" className="lq-add-answer" onClick={() => change(i, { answers: [...q.answers, ""] })}><Plus size={15}/>{translateUi("Add an answer")}</button>}
          </div>
        </section>))}
      <div className="lq-editor-actions">
        {questions.length < 50 && <button type="button" className="lq-btn lq-btn-ghost" onClick={() => setQuestions((list) => [...list, blankQuestion()])}><Plus size={17}/>{translateUi("Add a question")}</button>}
        <span/>
        <button type="button" className="lq-btn lq-btn-ghost" onClick={() => onClose(false)}>{translateUi("Cancel")}</button>
        <button className="lq-btn" disabled={busy}>{translateUi(busy ? "Saving…" : "Save quiz")}</button>
      </div>
    </form>);
}

// ---- Host screen (projector) ---------------------------------------------------------------------------------
function JoinQr({ pin }: { pin: string }) {
    useSiteLanguage();
    const [src, setSrc] = useState("");
    useEffect(() => { void QRCode.toDataURL(`${siteOrigin()}/play?pin=${pin}`, { margin: 1, width: 360, color: { dark: "#10233c", light: "#ffffff" } }).then(setSrc); }, [pin]);
    return src ? <img className="lq-qr" src={src} width={180} height={180} alt={translateUi("QR code to join the game")}/> : <span className="lq-qr"/>;
}

export function LiveQuizHostPage() {
    const lang = useSiteLanguage();
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
    if (!game) return <div className="hub-app lq-scene"><main className="lq-stage">{error ? <div className="lq-panel lq-center"><p>{translateUi(error)}</p><Link className="lq-btn" to="/live-quiz">{translateUi("Back to my quizzes")}</Link></div> : <Spinner label="Opening the game…" screen/>}</main></div>;
    const q = game.question;
    const last = game.index + 1 >= game.total;
    const most = Math.max(1, ...(game.counts ?? []));
    return (<div className="hub-app lq-scene">
      <header className="lq-bar">
        <span className="lq-bar-title"><Gamepad2 size={18} aria-hidden="true"/>{translateUi(game.title)}</span>
        {game.status !== "lobby" && game.status !== "finished" && <span className="lq-chip">{translateUi("Question {p0} of {p1}", { p0: game.index + 1, p1: game.total })}</span>}
        <span className="lq-chip">{translateUi("PIN")} <strong>{game.pin}</strong></span>
        {game.status !== "finished" && <button className="lq-link" disabled={busy} onClick={() => void act("end")}>{translateUi("End game")}</button>}
      </header>
      <main className="lq-stage">
        {game.status === "lobby" && (<>
            <div className="lq-lobby">
              <div className="lq-panel lq-join-card">
                <p>{translateUi("Join at")} <strong>{siteAddress()}/play</strong></p>
                <p className="lq-label">{translateUi("Game PIN")}</p>
                <p className="lq-pin" aria-label={translateUi("Game PIN {p0}", { p0: game.pin.split("").join(" ") })}>{game.pin.slice(0, 3)}<span> </span>{game.pin.slice(3)}</p>
              </div>
              <div className="lq-panel lq-qr-card"><JoinQr pin={game.pin}/><p>{translateUi("Or scan to join")}</p></div>
            </div>
            <div className="lq-roster">
              <p className="lq-count"><Users size={20} aria-hidden="true"/>{translateUi(game.players.length === 1 ? "1 player" : "{p0} players", { p0: game.players.length })}</p>
              {game.players.length ? <ul aria-live="polite">{game.players.map((p, n) => <li key={p.nickname} className={`lq-tone-${n % 4}`}>{p.nickname}</li>)}</ul> : <p className="lq-waiting">{translateUi("Waiting for players…")}</p>}
            </div>
            <button className="lq-btn lq-btn-gold lq-go" disabled={busy || !game.players.length} onClick={() => void act("next")}>{translateUi("Start the quiz")}<ArrowRight size={20}/></button>
          </>)}
        {(game.status === "question" || game.status === "reveal") && q && (<>
            <div className="lq-question-row">
              {game.status === "question" ? <Timer left={left} total={q.seconds}/> : <span className="lq-timer is-done" aria-hidden="true"><Check size={28}/></span>}
              <h1 className="lq-panel lq-question-text">{translateUi(q.text)}</h1>
              <span className="lq-answered"><b>{game.answered}</b>{translateUi("answers")}</span>
            </div>
            <div className="lq-tiles">{q.answers.map((answer, i) => {
                const count = game.counts?.[i] ?? 0;
                const state = game.status === "reveal" ? (i === q.correct ? " is-correct" : " is-wrong") : "";
                return <div key={i} className={`lq-tile lq-tone-${i}${state}`}>
                  <span className="lq-shape" aria-hidden="true">{SHAPES[i]}</span><span className="lq-tile-text">{translateUi(answer)}</span>
                  {game.status === "reveal" && <span className="lq-tile-count">{i === q.correct && <Check size={22} aria-label={translateUi("Right answer")}/>}<b>{count}</b><i style={{ width: `${(count / most) * 100}%` }} aria-hidden="true"/></span>}
                </div>;
              })}</div>
            {game.status === "question" ? <button className="lq-btn lq-btn-ghost-light lq-go" disabled={busy} onClick={() => void act("reveal")}>{translateUi("Show the answer now")}</button> : (<div className="lq-reveal-foot">
                <Leaderboard rows={game.leaderboard.slice(0, 5)}/>
                <button className="lq-btn lq-btn-gold lq-go" disabled={busy} onClick={() => void act("next")}>{translateUi(last ? "See the winner" : "Next question")}<ArrowRight size={20}/></button>
              </div>)}
          </>)}
        {game.status === "finished" && (<>
            <Podium rows={game.leaderboard.slice(0, 3)} lang={lang}/>
            {game.leaderboard.length > 3 && <Leaderboard rows={game.leaderboard.slice(3, 10)} start={4}/>}
            <Link className="lq-btn lq-btn-ghost-light" to="/live-quiz">{translateUi("Back to my quizzes")}</Link>
          </>)}
      </main>
    </div>);
}

function Leaderboard({ rows, start = 1 }: { rows: Standing[]; start?: number }) {
    useSiteLanguage();
    if (!rows.length) return null;
    return <ol className="lq-panel lq-board" aria-label={translateUi("Leaderboard")}>{rows.map((r, i) => <li key={r.nickname}><em aria-hidden="true">{start + i}</em><span>{r.nickname}</span><b>{r.score}</b></li>)}</ol>;
}
function Podium({ rows, lang }: { rows: Standing[]; lang: string }) {
    useSiteLanguage();
    if (!rows.length) return <div className="lq-panel lq-center"><p>{translateUi("No one played this game.")}</p></div>;
    // Second, first, third, as on a real podium.
    const order = [1, 0, 2].filter((i) => rows[i]);
    return (<div className="lq-podium">
      <p className="lq-winner"><Crown size={28} aria-hidden="true"/>{translateUi("The winner is")}</p>
      <h1>{rows[0].nickname}</h1>
      <div className="lq-steps-podium" aria-label={translateUi("Leaderboard")}>
        {order.map((i) => <div key={rows[i].nickname} className={`lq-place lq-place-${i + 1}`}>
            <strong>{rows[i].nickname}</strong><span>{rows[i].score}</span>
            <div className="lq-block"><Trophy size={i === 0 ? 30 : 22} aria-hidden="true"/><b>{ordinal(i + 1, lang)}</b></div>
          </div>)}
      </div>
      <div className="lq-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, n) => <i key={n}/>)}</div>
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
    let content: ReactNode;
    if (!token) {
        content = (<form className="lq-panel lq-join" onSubmit={join}>
          <span className="lq-join-icon"><Gamepad2 size={30} aria-hidden="true"/></span>
          <h1>{translateUi("Join a live quiz")}</h1>
          <p>{translateUi("Enter the game PIN shown on the host’s screen.")}</p>
          <label><span>{translateUi("Game PIN")}</span><input name="pin" inputMode="numeric" autoComplete="off" pattern="\d{3}\s?\d{3}" maxLength={7} required defaultValue={params.get("pin") ?? ""} placeholder="123 456"/></label>
          <label><span>{translateUi("Your nickname")}</span><input name="nickname" maxLength={24} required autoComplete="nickname" placeholder={translateUi("How others will see you")}/></label>
          {error && <p role="alert" className="lq-error">{translateUi(error)}</p>}
          <button className="lq-btn lq-btn-gold lq-wide" disabled={busy}>{translateUi(busy ? "Joining…" : "Join game")}<ArrowRight size={18}/></button>
        </form>);
    }
    else if (!state) content = <Spinner label="Joining the game…"/>;
    else if (state.status === "lobby") {
        content = <div className="lq-panel lq-center lq-pulse"><span className="lq-join-icon is-ok"><Check size={30} aria-hidden="true"/></span><h1>{translateUi("You’re in, {p0}!", { p0: state.nickname })}</h1><p>{translateUi("See your name on the host’s screen. The quiz starts soon.")}</p></div>;
    }
    else if (state.status === "question" && state.question) {
        const q = state.question;
        content = state.answer
            ? <div className="lq-panel lq-center"><span className={`lq-tile lq-tone-${state.answer.choice} lq-mini`}><span className="lq-shape" aria-hidden="true">{SHAPES[state.answer.choice]}</span></span><h1>{translateUi("Answer locked in")}</h1><p>{translateUi("Waiting for the others…")}</p></div>
            : (<div className="lq-answering">
                <div className="lq-phone-head"><span className="lq-chip">{translateUi("{p0} / {p1}", { p0: state.index + 1, p1: state.total })}</span><Timer left={left} total={q.seconds} small/></div>
                <h1 className="lq-panel lq-phone-question">{translateUi(q.text)}</h1>
                <div className={`lq-tiles lq-phone-tiles${q.answers.length > 2 ? " is-grid" : ""}`}>{q.answers.map((a, i) => <button key={i} className={`lq-tile lq-tone-${i}`} onClick={() => void answer(i)} disabled={left === 0}><span className="lq-shape" aria-hidden="true">{SHAPES[i]}</span><span className="lq-tile-text">{translateUi(a)}</span></button>)}</div>
              </div>);
    }
    else if (state.status === "reveal") {
        const a = state.answer;
        content = (<div className={`lq-result ${a?.correct ? "is-correct" : "is-wrong"}`}>
          <span className="lq-result-icon" aria-hidden="true">{a?.correct ? <Check size={44}/> : <X size={44}/>}</span>
          <h1>{translateUi(!a ? "Time’s up" : a.correct ? "Correct!" : "Not this time")}</h1>
          {a?.correct && <p className="lq-points">+{a.points}</p>}
          {state.question?.correct !== undefined && !a?.correct && <p>{translateUi("The right answer was: {p0}", { p0: state.question.answers[state.question.correct] })}</p>}
          <p className="lq-standing">{translateUi("You’re in {p0} place with {p1} points.", { p0: ordinal(state.rank, lang), p1: state.score })}</p>
        </div>);
    }
    else if (state.status === "finished") {
        content = (<div className="lq-final">
          <div className="lq-panel lq-center">
            <span className={`lq-join-icon${state.rank === 1 ? " is-gold" : ""}`}><Trophy size={30} aria-hidden="true"/></span>
            <h1>{translateUi(state.rank === 1 ? "You won!" : "Game over")}</h1>
            <p>{translateUi("You finished {p0} of {p1} with {p2} points.", { p0: ordinal(state.rank, lang), p1: state.players, p2: state.score })}</p>
          </div>
          {state.podium && <Podium rows={state.podium} lang={lang}/>}
          <button className="lq-btn lq-btn-ghost-light lq-wide" onClick={() => leave()}>{translateUi("Join another game")}</button>
        </div>);
    }
    return (<div className="hub-app lq-scene lq-play">
      <header className="lq-bar">
        <a href={siteOrigin()} className="lq-bar-brand" aria-label={translateUi("Peace and Love Proclaimers website")}><span className="lq-bar-logo"><img src="/favicon.svg" alt="" width={28} height={28}/></span></a>
        {state ? <span className="lq-chip"><strong>{state.nickname}</strong> · {state.score}</span> : <span className="lq-bar-title"><Gamepad2 size={18} aria-hidden="true"/>{translateUi("Live quiz")}</span>}
      </header>
      <main className="lq-stage lq-phone">{content}</main>
    </div>);
}
