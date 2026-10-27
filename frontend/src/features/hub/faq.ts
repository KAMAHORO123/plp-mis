export type FaqLanguage = 'en' | 'rw';
export type FaqLanguageChoice = FaqLanguage | 'auto';
type FaqEntry = { id: string; q: Record<FaqLanguage, string>; words: Record<FaqLanguage, string[]>; answer: Record<FaqLanguage, string> };
export const faqEntries: FaqEntry[] = [
  {
    "id": "join",
    "q": {
      "en": "How do I join PLP?",
      "rw": "Nakwiyandikisha muri PLP nte?"
    },
    "words": {
      "en": [
        "join",
        "signup",
        "sign up",
        "register"
      ],
      "rw": [
        "kwiyandikisha",
        "niyandikisha",
        "nakwiyandikisha",
        "kwinjira muri plp",
        "kuba umunyamuryango",
        "kuba muri plp",
        "nshaka kwiyandikisha"
      ]
    },
    "answer": {
      "en": "Choose Join PLP, enter your name and email, choose Member, and set a password. Member access is immediate. Staff roles require an authorized assignment by an administrator.",
      "rw": "Kanda “Join PLP”, wandike amazina yawe na imeri, uhitemo “Member”, ushyireho ijambo ry’ibanga. Inshingano z’abakozi zitangwa n’umuyobozi ubifitiye uburenganzira."
    }
  },
  {
    "id": "certificates",
    "q": {
      "en": "How do I get a certificate?",
      "rw": "Nabona icyemezo nte?"
    },
    "words": {
      "en": [
        "certificate",
        "pdf",
        "download"
      ],
      "rw": [
        "icyemezo",
        "ibyemezo",
        "cyemezo",
        "impamyabumenyi",
        "impamyabushobozi"
      ]
    },
    "answer": {
      "en": "Academy course certificates are awarded automatically when you complete the required lessons, assignment, and assessment. Club leaders add students in School members, then select recipients to request standard PLP membership certificates. An administrator approves and issues the request. The coordinator can then download one PDF or the full batch. Members with a matching email can see their own issued certificates.",
      "rw": "Icyemezo cy’isomo rya Academy gitangwa iyo urangije amasomo, umukoro n’isuzuma bisabwa. Ku byemezo by’abanyamuryango bo mu mashuri, umuyobozi wa club abanza kwandika abanyeshuri muri “School members”, agahitamo abo asabira ibyemezo. Umuyobozi wa sisitemu arabyemeza akabitanga; umuhuzabikorwa akabikuramo nka PDF. Umunyamuryango ufite imeri ihuye n’iyanditswe ku cyemezo ashobora kukibona kuri konti ye."
    }
  },
  {
    "id": "students",
    "q": {
      "en": "Do students need an account?",
      "rw": "Abanyeshuri bakeneye konti?"
    },
    "words": {
      "en": [
        "student",
        "account",
        "school"
      ],
      "rw": [
        "abanyeshuri",
        "umunyeshuri",
        "konti",
        "ishuri",
        "amashuri"
      ]
    },
    "answer": {
      "en": "Students do not need an account for a coordinator to request their certificates. An optional matching email connects an issued certificate to a member account.",
      "rw": "Abanyeshuri ntibakeneye konti kugira ngo umuhuzabikorwa abasabire ibyemezo. Iyo bashyizeho imeri ihuye n’iyo kuri konti yabo, icyemezo cyatanzwe gishobora kugaragara kuri iyo konti."
    }
  },
  {
    "id": "roles",
    "q": {
      "en": "Who is the administrator?",
      "rw": "Umuyobozi wa sisitemu akora iki?"
    },
    "words": {
      "en": [
        "admin",
        "coordinator",
        "role",
        "trainer"
      ],
      "rw": [
        "umuyobozi",
        "abayobozi",
        "umuhuzabikorwa",
        "umutoza",
        "abatoza",
        "inshingano"
      ]
    },
    "answer": {
      "en": "The administrator manages staff access and issues certificates. Coordinators manage their assigned school only. Trainers manage their assigned courses.",
      "rw": "Umuyobozi wa sisitemu atanga uburenganzira bw’abakozi n’ibyemezo. Abahuzabikorwa bacunga amashuri bashinzwe gusa, naho abatoza bagacunga amasomo bashinzwe."
    }
  },
  {
    "id": "contact",
    "q": {
      "en": "How can I contact PLP?",
      "rw": "Navugana na PLP nte?"
    },
    "words": {
      "en": [
        "contact",
        "email",
        "support"
      ],
      "rw": [
        "kuvugana",
        "navugana",
        "mwavugana",
        "kubandikira",
        "twababona",
        "ubufasha"
      ]
    },
    "answer": {
      "en": "Email PLP at info@peaceloveproclaimers.org for help.",
      "rw": "Ukeneye ubufasha, andikira PLP kuri info@peaceloveproclaimers.org."
    }
  },
  {
    "id": "greeting",
    "q": {
      "en": "Hello",
      "rw": "Muraho"
    },
    "words": {
      "en": [
        "hello",
        "hi",
        "hey"
      ],
      "rw": [
        "muraho",
        "mwaramutse",
        "mwiriwe",
        "bite"
      ]
    },
    "answer": {
      "en": "Hello! Ask me about joining PLP, certificates, student accounts, or staff roles.",
      "rw": "Muraho! Mushobora kumbaza uko mwakwiyandikisha muri PLP, ibyemezo, konti z’abanyeshuri cyangwa inshingano z’abakozi."
    }
  }
];
const normalize = (text: string) => text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const contains = (text: string, phrase: string) => ` ${text} `.includes(` ${normalize(phrase)} `);
export function detectFaqLanguage(question: string, previous: FaqLanguage = 'en'): FaqLanguage {
  const text = normalize(question);
  if (['nte', 'iki', 'ese', 'nshaka', 'ndashaka', 'murakoze', 'mwiriwe', 'nabona', 'nshobora', 'muri'].some(word => contains(text, word)) || faqEntries.some(entry => entry.words.rw.some(word => contains(text, word)))) return 'rw';
  if (['how', 'what', 'can', 'do', 'hello', 'please', 'who'].some(word => contains(text, word)) || faqEntries.some(entry => entry.words.en.some(word => contains(text, word)))) return 'en';
  return previous;
}
export function answerFaq(question: string, choice: FaqLanguageChoice = 'auto', previous: FaqLanguage = 'en') {
  const language = choice === 'auto' ? detectFaqLanguage(question, previous) : choice;
  const text = normalize(question);
  const ranked = faqEntries.map(entry => ({ entry, score: [...entry.words.en, ...entry.words.rw].reduce((sum, word) => sum + (contains(text, word) ? (entry.id === 'greeting' ? 0.1 : normalize(word).split(' ').length) : 0), 0) })).sort((a,b) => b.score - a.score);
  const best = ranked[0];
  const ambiguous = best.score > 0 && ranked[1]?.score === best.score;
  const fallback = language === 'rw'
    ? 'Mushobora gusobanura ikibazo cyanyu? Nshobora gusubiza ku kwiyandikisha muri PLP, ibyemezo, konti z’abanyeshuri n’inshingano z’abakozi. Ku bindi bibazo, mwandikire info@peaceloveproclaimers.org.'
    : 'Could you clarify your question? I can help with joining PLP, certificates, student accounts, and staff roles. For other questions, contact info@peaceloveproclaimers.org.';
  return { language, topic: best.score && !ambiguous ? best.entry.id : null, text: best.score && !ambiguous ? best.entry.answer[language] : fallback };
}
