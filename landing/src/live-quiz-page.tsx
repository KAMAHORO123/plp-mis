// The public Live quiz page: join a game with the PIN from the host's screen, see how it works, and host your own.
// Games run in the PLP Hub (/play for players, /live-quiz for hosts, who sign in first).
import { translateUi, useSiteLanguage } from './i18n/language';
import { ArrowRight, ArrowUpRight, Gamepad2, Trophy, Users } from 'lucide-react';
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
          <p className="lqp-eyebrow"><Gamepad2 size={16} aria-hidden="true"/>{translateUi("LIVE QUIZ")}</p>
          <h1 id="lqp-title">{translateUi("Play together,")}<br/><em>{translateUi("live.")}</em></h1>
          <p>{translateUi("A quick quiz for meetings, classes and conferences, played from your phone.")}</p>
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
        <div className="lqp-steps-head"><p className="lqp-kicker">{translateUi("HOW IT WORKS")}</p><h2 id="lqp-how">{translateUi("Three steps to play")}</h2></div>
        <ol>
          <li>
            <div className="lqp-art lqp-art-pin" aria-hidden="true"><span className="lqp-art-label">{translateUi("Game PIN")}</span><span className="lqp-art-input">836 665</span><span className="lqp-art-name">Amina</span></div>
            <span className="lqp-step-no">01</span>
            <h3>{translateUi("Enter the PIN")}</h3>
            <p>{translateUi("Type the PIN from the host’s screen and pick a nickname. No account needed.")}</p>
          </li>
          <li>
            <div className="lqp-art lqp-art-answer" aria-hidden="true"><span className="lqp-art-timer">12</span><span className="lqp-art-grid"><i className="lqp-t-0">▲</i><i className="lqp-t-1">◆</i><i className="lqp-t-2">●</i><i className="lqp-t-3">■</i></span></div>
            <span className="lqp-step-no">02</span>
            <h3>{translateUi("Answer fast")}</h3>
            <p>{translateUi("Tap the colour that matches your answer. Faster correct answers score more.")}</p>
          </li>
          <li>
            <div className="lqp-art lqp-art-podium" aria-hidden="true"><span className="lqp-art-crown"><Trophy size={18}/></span><span className="lqp-art-bars"><i>2</i><i>1</i><i>3</i></span></div>
            <span className="lqp-step-no">03</span>
            <h3>{translateUi("Celebrate the winner")}</h3>
            <p>{translateUi("See the right answer and the leaderboard. The top three take the podium.")}</p>
          </li>
        </ol>
      </section>
      <section className="lqp-host" aria-labelledby="lqp-host-title">
        <div><p className="lqp-eyebrow"><Users size={16} aria-hidden="true"/>{translateUi("FOR FACILITATORS AND CLUB LEADERS")}</p><h2 id="lqp-host-title">{translateUi("Host your own quiz")}</h2><p>{translateUi("Write your questions, tick the right answers and start a game. Sign in to the PLP Hub to create and host quizzes.")}</p></div>
        <a className="lqp-host-link" href={`${hub()}/live-quiz`}>{translateUi("Create a quiz")}<ArrowUpRight size={18}/></a>
      </section>
    </div>;
}
