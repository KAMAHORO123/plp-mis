import type { Course, Question } from "./data";

export const QUIZ_PASS_MARK = 80;
export const EXAM_PASS_MARK = 70;
export const MAX_ATTEMPTS = 3;
export const ATTEMPT_WINDOW_HOURS = 24;
export const MAX_FOCUS_LOSSES = 1;
export const MIN_ASSIGNMENT_WORDS = 60;

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  startedAt: string;
  submittedAt: string;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  reason: "submitted" | "time" | "focus";
  focusLosses: number;
  results: boolean[];
}
export interface ActiveAttempt {
  assessmentId: string;
  startedAt: string;
  endsAt: string;
  order: string[];
  answers: Record<string, number>;
  focusLosses: number;
}
export interface Assessment {
  id: string;
  kind: "quiz" | "exam";
  title: string;
  questions: Question[];
  minutes: number;
  passMark: number;
  maxAttempts: number;
  moduleIndex?: number;
}
interface AttemptRecord {
  attempts?: AssessmentAttempt[];
}

const q = (id: string, prompt: string, options: string[], answer: number): Question => ({ id, prompt, options, answer });

// Assessments for the built-in courses. Trainer-authored quizzes on the course take precedence.
const bank: Record<string, { outcomes: string[]; modules: Question[][]; exam: Question[] }> = {
  "personal-leadership": {
    outcomes: [
      "Identify your strengths, values, and one area for growth",
      "Use feedback from people you trust without becoming defensive",
      "Turn a leadership intention into a measurable, dated action",
    ],
    modules: [
      [
        q("pl1-1", "Where does leadership begin, according to this module?", ["With a formal title", "With understanding how your actions affect others", "With being the loudest voice in the room", "With having every answer"], 1),
        q("pl1-2", "A friend gives you feedback about a team project. What is the best first response?", ["Explain why they are wrong", "Listen without defending yourself", "Ignore it if it is uncomfortable", "Ask someone else instead"], 1),
        q("pl1-3", "Which combination does the module ask you to identify about yourself?", ["A strength, a value, and an area to improve", "Your grades, hobbies, and friends", "Three weaknesses only", "A role model and a slogan"], 0),
      ],
      [
        q("pl2-1", "Which of these is a measurable result?", ["Be more confident", "Invite five classmates to a listening circle this month", "Try to help more", "Become popular"], 1),
        q("pl2-2", "What three parts make a purpose into a plan?", ["A specific action, a measurable result, and a review date", "A dream, a poster, and a hashtag", "A title, a budget, and a team", "A promise, a speech, and applause"], 0),
        q("pl2-3", "After trying your action, what should you do next?", ["Stop if it was hard", "Review what worked and adjust your next step", "Blame the participants", "Start a completely different project"], 1),
      ],
    ],
    exam: [
      q("plx-1", "Which goal gives you the clearest way to track progress?", ["Become a better leader someday", "Host one listening circle with five peers by the end of the month", "Wait until someone gives you a leadership role", "Read about leadership when there is time"], 1),
      q("plx-2", "Why ask a trusted person for a concrete example of when you helped a team?", ["To collect compliments", "To compare outside evidence with your own reflection", "To avoid self-reflection", "To prove you are already a leader"], 1),
      q("plx-3", "Your listening circle drew only two people. What is the most useful leadership response?", ["Cancel future circles", "Ask what would make it easier to attend and adjust the plan", "Tell others it was a success", "Wait for someone else to organize it"], 1),
      q("plx-4", "Which statement best describes a leadership value?", ["A principle that guides how you act", "A grade on a report card", "A position in a club", "An award from an organization"], 0),
      q("plx-5", "What makes a plan realistic for a student leader?", ["It is small, specific, and has a date to review it", "It changes the whole country at once", "It has no deadline so there is no pressure", "It depends entirely on adults"], 0),
      q("plx-6", "Which behaviour shows self-awareness?", ["Noticing how your tone affects a discussion", "Always speaking first", "Avoiding feedback", "Assuming others think the same way"], 0),
    ],
  },
  "career-readiness": {
    outcomes: [
      "Write evidence-based CV achievements that connect to a role",
      "Prepare interview examples using situation, task, action, and result",
      "Follow up professionally and honestly after an interview",
    ],
    modules: [
      [
        q("cr1-1", "What should a useful CV connect?", ["Your experience to the role", "Your favourite colours to the company logo", "Every job you could ever do", "Your social media followers to your grades"], 0),
        q("cr1-2", "Which line is the strongest CV achievement?", ["Good team player", "Organized a clean-up with 20 volunteers that cleared two school compounds", "Hard worker and passionate", "Expert in everything"], 1),
        q("cr1-3", "Before listing someone as a referee you should…", ["Ask their permission", "Invent their job title", "List as many names as possible", "Use a famous person"], 0),
      ],
      [
        q("cr2-1", "What does STAR stand for in interview preparation?", ["Situation, task, action, result", "Smile, talk, agree, repeat", "Skills, talent, attitude, rank", "Start, try, adjust, retry"], 0),
        q("cr2-2", "How long should you practise explaining your own contribution?", ["About two minutes", "Twenty minutes", "Ten seconds", "As long as possible"], 0),
        q("cr2-3", "After an interview, what is a professional next step?", ["Follow up politely", "Post the questions online", "Call every day", "Say nothing ever again"], 0),
      ],
    ],
    exam: [
      q("crx-1", "What makes a CV achievement useful?", ["A long list of adjectives", "An unsupported claim of expertise", "A specific action and an honest result", "A copied description from the internet"], 2),
      q("crx-2", "You led a project that only partly succeeded. How should you describe it in an interview?", ["Pretend it fully succeeded", "Explain your actions, the result, and what you learned", "Avoid mentioning it", "Blame your teammates"], 1),
      q("crx-3", "Which section belongs on an evidence-based CV?", ["Relevant projects and volunteering", "Your passwords", "Unverified awards", "Private family details"], 0),
      q("crx-4", "Why prepare a question about the team?", ["It shows genuine interest and helps you decide if the role fits", "It fills time so you do not need examples", "Interviewers expect you to ask about holidays first", "It replaces research"], 0),
      q("crx-5", "Which statement about qualifications is correct?", ["Never invent qualifications or outcomes", "Small exaggerations are expected", "List courses you plan to take as completed", "Copy a friend's CV"], 0),
      q("crx-6", "In STAR, the 'result' should be…", ["What changed because of your action", "Your opinion of the manager", "The name of the organization", "A promise for the future"], 0),
    ],
  },
  "startup-fundamentals": {
    outcomes: [
      "Interview people about a problem without leading questions",
      "Separate evidence from assumptions",
      "Design a low-cost experiment before investing heavily",
    ],
    modules: [
      [
        q("sf1-1", "Who should you listen to first when exploring a venture idea?", ["People who experience the problem", "Investors only", "Your closest friends who like you", "Nobody, trust your instinct"], 0),
        q("sf1-2", "Which is a leading question to avoid?", ["How do you currently handle this?", "Wouldn't my amazing app solve your problem?", "What is difficult about it?", "How often does it happen?"], 1),
        q("sf1-3", "Why separate what you heard from what you assume?", ["To make decisions based on evidence", "To make the notes longer", "Assumptions are always wrong", "It is not important"], 0),
      ],
      [
        q("sf2-1", "Before investing heavily you should…", ["Test a small prototype with a few people", "Buy branded merchandise", "Hire a large team", "Sign a long lease"], 0),
        q("sf2-2", "Which is NOT part of describing a simple business model?", ["Your customer", "The value you offer", "How you reach customers", "Your favourite logo font"], 3),
        q("sf2-3", "Why decide in advance what result would change your idea?", ["So the experiment honestly tests the idea", "So you can ignore bad results", "It wastes time", "Investors require it by law"], 0),
      ],
    ],
    exam: [
      q("sfx-1", "What is the best first step for a new venture idea?", ["Interview people who experience the problem", "Spend the entire budget on branding", "Assume everyone is a customer", "Register a company immediately"], 0),
      q("sfx-2", "Three of ten people you interviewed have the problem weekly. What does this tell you?", ["Some evidence of need; explore that group further", "Everyone needs your product", "The idea is useless", "You should stop interviewing"], 0),
      q("sfx-3", "Which is a low-cost experiment?", ["A paper prototype shown to five potential customers", "A national advertising campaign", "Building a factory", "Hiring ten employees"], 0),
      q("sfx-4", "A customer says 'I love it!' but will not try it. What should you conclude?", ["Praise is not the same as evidence of demand", "The idea is proven", "They are lying", "Raise the price"], 0),
      q("sfx-5", "Which resource question belongs in early planning?", ["What do we need to deliver the value?", "Which office chair is best?", "What will our IPO price be?", "Which celebrity will endorse us?"], 0),
      q("sfx-6", "What should happen when results contradict your assumption?", ["Change the idea or the test", "Hide the results", "Repeat until you get the answer you want", "Blame the customers"], 0),
    ],
  },
  "digital-literacy": {
    outcomes: [
      "Protect accounts with unique passwords and multifactor authentication",
      "Evaluate online information using source, date, and evidence",
      "Use AI tools responsibly and verify their output",
    ],
    modules: [
      [
        q("dl1-1", "What best protects your accounts?", ["One strong password everywhere", "Unique passwords and multifactor authentication", "Writing passwords on your desk", "Sharing passwords with friends"], 1),
        q("dl1-2", "Before opening an unexpected link you should…", ["Check the sender and the destination", "Click quickly before it expires", "Forward it to everyone", "Enter your password to test it"], 0),
        q("dl1-3", "Which three things help evaluate information?", ["The original source, its date, and supporting evidence", "Number of likes, colours, and length", "The font, the author's photo, and emojis", "Whether you agree with it"], 0),
      ],
      [
        q("dl2-1", "A clear AI prompt includes…", ["A task, useful context, and an output format", "Only one word", "Private member records for accuracy", "No instructions at all"], 0),
        q("dl2-2", "How should you treat an AI answer?", ["As a draft to check", "As guaranteed truth", "As your own original work without review", "As a legal document"], 0),
        q("dl2-3", "Which data should never be uploaded to an AI tool?", ["Private member records", "A public article", "Your own practice question", "A general topic"], 0),
      ],
    ],
    exam: [
      q("dlx-1", "What should you do before using an AI-generated fact?", ["Assume a confident answer is accurate", "Verify it against a reliable source", "Share it without checking", "Ask the AI if it is sure"], 1),
      q("dlx-2", "You receive an email asking you to confirm your password urgently. What is the safest action?", ["Reply with your password", "Check the sender and go to the service directly instead of the link", "Click the link to see what happens", "Forward it to your club"], 1),
      q("dlx-3", "Who is responsible for work you submit that used AI assistance?", ["You are", "The AI company", "Nobody", "Your teacher"], 0),
      q("dlx-4", "Which is the most reliable way to check a statistic you found online?", ["Find the original source and its date", "Count how many people shared it", "Check if it matches your opinion", "Ask in a comment section"], 0),
      q("dlx-5", "What should you do when your school requires disclosure of AI use?", ["Disclose that you used AI assistance", "Hide it", "Rewrite it so it looks different", "Stop using any computer"], 0),
      q("dlx-6", "Multifactor authentication means…", ["A second check such as a code in addition to your password", "Using two browsers", "Having two email accounts", "Changing your password daily"], 0),
    ],
  },
  "peace-leadership": {
    outcomes: [
      "Practise active listening in disagreements",
      "Facilitate a shared next step that includes quieter voices",
      "Recognize when to seek support instead of mediating alone",
    ],
    modules: [
      [
        q("pc1-1", "In a disagreement, what should each person be allowed to do first?", ["Describe their experience without interruption", "Vote on who is right", "Leave the room", "Prepare a counter-argument"], 0),
        q("pc1-2", "Reflecting back what you heard helps to…", ["Check you understood correctly", "Win the argument", "Repeat the conflict", "Show you were not listening"], 0),
        q("pc1-3", "What does 'separate the person from the problem' mean?", ["Address the issue without attacking the person", "Ignore the person", "Blame their group", "Change the subject"], 0),
      ],
      [
        q("pc2-1", "A good shared next step is…", ["One practical action everyone agrees on", "A long list nobody owns", "A punishment for one side", "Waiting until the problem disappears"], 0),
        q("pc2-2", "How should quieter participants be included?", ["Invite their contribution without pressure", "Force them to speak first", "Ignore them", "Speak for them"], 0),
        q("pc2-3", "If a situation involves threats or harm you should…", ["Seek support from a trusted responsible adult or local service", "Mediate alone", "Post about it online", "Ignore it"], 0),
      ],
    ],
    exam: [
      q("pcx-1", "Which response supports constructive dialogue?", ["Interrupt to prove your point", "Make assumptions about the other person", "Reflect what you heard and check your understanding", "Raise your voice"], 2),
      q("pcx-2", "Two club members disagree about an event budget. What is the best first step?", ["Let each describe their view without interruption", "Decide for them immediately", "Remove both from the club", "Ask the group to vote without discussion"], 0),
      q("pcx-3", "Why avoid stereotypes in conflict?", ["They judge a group based on one person's behaviour", "They make meetings shorter", "They are always accurate", "They help people agree"], 0),
      q("pcx-4", "What makes an agreement more likely to last?", ["Setting a time to review it", "Keeping it secret", "Having no clear action", "Only the leader knows about it"], 0),
      q("pcx-5", "A peer reports being threatened. What should a peace leader do?", ["Help them reach a trusted adult or appropriate service", "Confront the person alone", "Promise to keep it secret no matter what", "Tell them to ignore it"], 0),
      q("pcx-6", "Active citizenship is best shown by…", ["Organizing a practical community action", "Complaining online", "Waiting for others to act", "Only attending meetings"], 0),
    ],
  },
};

export function outcomesFor(course: Course) {
  return course.outcomes?.length ? course.outcomes : bank[course.id]?.outcomes ?? course.skills.map(s => `Build practical ${s.toLowerCase()} skills`);
}

export function assessmentsFor(course: Course): Assessment[] {
  const preset = bank[course.id];
  const modules = course.lessons.flatMap((lesson, i): Assessment[] => {
    const questions = lesson.quiz?.length ? lesson.quiz : preset?.modules[i] ?? [];
    return questions.length ? [{ id: `module-${i}`, kind: "quiz", title: `Module ${i + 1} knowledge check`, questions, minutes: lesson.quizMinutes ?? Math.max(3, questions.length * 2), passMark: QUIZ_PASS_MARK, maxAttempts: MAX_ATTEMPTS, moduleIndex: i }] : [];
  });
  const fallback = course.question && course.options.length >= 2 ? [{ id: `${course.id}-legacy`, prompt: course.question, options: course.options, answer: course.answer }] : [];
  const exam = course.exam?.length ? course.exam : preset?.exam ?? fallback;
  return exam.length ? [...modules, { id: "final", kind: "exam", title: "Final graded exam", questions: exam, minutes: course.examMinutes ?? Math.max(5, exam.length * 2), passMark: course.passMark ?? EXAM_PASS_MARK, maxAttempts: course.maxAttempts ?? MAX_ATTEMPTS }] : modules;
}

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function attemptsFor(record: AttemptRecord | undefined, assessmentId: string) {
  return (record?.attempts ?? []).filter(a => a.assessmentId === assessmentId);
}
export function bestAttempt(record: AttemptRecord | undefined, assessmentId: string) {
  return attemptsFor(record, assessmentId).reduce<AssessmentAttempt | undefined>((best, a) => (!best || a.percent > best.percent ? a : best), undefined);
}
export const hasPassed = (record: AttemptRecord | undefined, assessmentId: string) => attemptsFor(record, assessmentId).some(a => a.passed);

/** Attempts are limited per rolling window; returns when the next attempt opens, or null if one is available now. */
export function nextAttemptAt(record: AttemptRecord | undefined, assessment: Assessment, now = Date.now()) {
  const windowMs = ATTEMPT_WINDOW_HOURS * 3600_000;
  const recent = attemptsFor(record, assessment.id).filter(a => now - Date.parse(a.submittedAt) < windowMs && !a.passed);
  if (recent.length < assessment.maxAttempts) return null;
  return new Date(Math.min(...recent.map(a => Date.parse(a.submittedAt))) + windowMs);
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function grade(assessment: Assessment, active: ActiveAttempt, reason: AssessmentAttempt["reason"], id: string): AssessmentAttempt {
  const questions = active.order.map(qid => assessment.questions.find(x => x.id === qid)).filter((x): x is Question => !!x);
  const results = questions.map(x => active.answers[x.id] === x.answer);
  const score = results.filter(Boolean).length;
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
  return { id, assessmentId: assessment.id, startedAt: active.startedAt, submittedAt: new Date().toISOString(), score, total: questions.length, percent, passed: reason !== "focus" && percent >= assessment.passMark, reason, focusLosses: active.focusLosses, results };
}
