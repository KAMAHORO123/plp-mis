// The public Live quiz page: join a game with the PIN from the host's screen, see how it works, and host your own.
// Games run in the PLP Hub (/play for players, /live-quiz for hosts, who sign in first).
import { translateUi, useSiteLanguage } from './i18n/language';
import { ArrowRight, ArrowUpRight, Gamepad2, Smartphone, Timer, Trophy, Users } from 'lucide-react';
import './live-quiz-page.css';

const hub = () => (import.meta.env.VITE_HUB_URL || '').replace(/\/$/, '');
const SHAPES = ['▲', '◆', '●', '■'];

export function LiveQuizPage() {
    useSiteLanguage();
    const join = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const pin = String(new FormData(event.currentTarget).get('pin') || '').replace(/\D/g, '');
        window.location.href = `${hub()}/play${pin ? `?pin=${pin}` : ''}`;
    };
    return <div className="lqp">
      <section className="lqp-hero" aria-labelledby="lqp-title">
        <div className="lqp-hero-copy">
          <p className="lqp-eyebrow"><Gamepad2 size={16} aria-hidden="true"/>{translateUi("FUN CORNER · LIVE QUIZ")}</p>
          <h1 id="lqp-title">{translateUi("Play together,")}<br/><em>{translateUi("live.")}</em></h1>
          <p>{translateUi("A quick, friendly quiz for meetings, classes and conferences. The host shows the questions on the big screen, and everyone answers from their phone.")}</p>
          <form className="lqp-join" onSubmit={join}>
            <label htmlFor="lqp-pin">{translateUi("Have a game PIN?")}</label>
            <div><input id="lqp-pin" name="pin" inputMode="numeric" autoComplete="off" maxLength={7} pattern="\d{3}\s?\d{3}" placeholder="123 456" required/><button>{translateUi("Join")}<ArrowRight size={18}/></button></div>
          </form>
        </div>
        <div className="lqp-visual" aria-hidden="true">
          <div className="lqp-screen">
            <span className="lqp-screen-q">{translateUi("In which year did PLP start?")}</span>
            <div className="lqp-screen-tiles">{['2003', '2007', '2012', '2015'].map((a, i) => <span key={a} className={`lqp-t lqp-t-${i}`}><b>{SHAPES[i]}</b>{a}</span>)}</div>
          </div>
          <div className="lqp-phone"><span className="lqp-t lqp-t-0"><b>▲</b></span><span className="lqp-t lqp-t-1"><b>◆</b></span><span className="lqp-t lqp-t-2"><b>●</b></span><span className="lqp-t lqp-t-3"><b>■</b></span></div>
          <span className="lqp-badge"><Trophy size={16}/>{translateUi("+972")}</span>
        </div>
      </section>
      <section className="lqp-steps" aria-labelledby="lqp-how">
        <h2 id="lqp-how">{translateUi("How it works")}</h2>
        <ol>
          <li><span><Smartphone size={22}/></span><h3>{translateUi("Join with the PIN")}</h3><p>{translateUi("Open this page on your phone, enter the PIN on the host’s screen and choose a nickname. No account needed.")}</p></li>
          <li><span><Timer size={22}/></span><h3>{translateUi("Answer fast")}</h3><p>{translateUi("Tap the colour and shape that matches your answer. Correct answers score more the faster you are.")}</p></li>
          <li><span><Trophy size={22}/></span><h3>{translateUi("Celebrate the winner")}</h3><p>{translateUi("After each question, see the right answer and the leaderboard. The top three take the podium at the end.")}</p></li>
        </ol>
      </section>
      <section className="lqp-host" aria-labelledby="lqp-host-title">
        <div><p className="lqp-eyebrow"><Users size={16} aria-hidden="true"/>{translateUi("FOR FACILITATORS AND CLUB LEADERS")}</p><h2 id="lqp-host-title">{translateUi("Host your own quiz")}</h2><p>{translateUi("Write your questions, tick the right answers and start a game. Sign in to the PLP Hub to create and host quizzes.")}</p></div>
        <a className="lqp-host-link" href={`${hub()}/live-quiz`}>{translateUi("Create a quiz")}<ArrowUpRight size={18}/></a>
      </section>
    </div>;
}
