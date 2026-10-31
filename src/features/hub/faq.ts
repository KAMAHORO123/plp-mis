export type FaqLanguage = 'en' | 'rw' | 'fr';
export type FaqLanguageChoice = FaqLanguage | 'auto';
type FaqEntry = { id: string; q: Record<FaqLanguage, string>; words: Record<FaqLanguage, string[]>; answer: Record<FaqLanguage, string> };
export const faqEntries: FaqEntry[] = [
{
  "id": "opportunities",
  "q": {
    "en": "How do I apply?",
    "rw": "Nasaba amahirwe nte?",
    "fr": "Comment postuler ?"
  },
  "words": {
    "en": [
      "opportunity",
      "opportunities",
      "apply",
      "application",
      "scholarship",
      "internship"
    ],
    "rw": [
      "amahirwe",
      "gusaba",
      "nasaba"
    ],
    "fr": [
      "opportunité",
      "opportunités",
      "postuler",
      "candidature",
      "bourse",
      "stage"
    ]
  },
  "answer": {
    "en": "Open an opportunity and choose View details to check eligibility and the deadline. Use Apply now for a PLP application, or follow the external application link. External applications are completed on the organiser’s website.",
    "rw": "Fungura amahirwe ukande “View details” urebe ibisabwa n’itariki ntarengwa. Kanda “Apply now” cyangwa ukurikire ihuza ry’urubuga rw’abateguye ayo mahirwe.",
    "fr": "Ouvrez une offre puis « View details » pour consulter les critères et la date limite. Utilisez « Apply now » ou le lien externe vers le site de l’organisateur."
  }
},
{
  "id": "opportunity-documents",
  "q": {
    "en": "Which documents do I need?",
    "rw": "Nkeneye izihe nyandiko?",
    "fr": "Quels documents préparer ?"
  },
  "words": {
    "en": [
      "documents",
      "cv",
      "resume",
      "cover letter",
      "eligibility",
      "eligible",
      "requirements"
    ],
    "rw": [
      "inyandiko",
      "ibisabwa",
      "nkeneye"
    ],
    "fr": [
      "documents",
      "cv",
      "lettre",
      "éligibilité",
      "critères"
    ]
  },
  "answer": {
    "en": "Requirements vary by opportunity. Check Who can apply in the details. PLP applications can include a CV, cover letter and supporting letter. For external applications, follow the organiser’s requirements.",
    "rw": "Ibisabwa biterwa n’amahirwe wahisemo. Reba “Who can apply”. Ushobora kongeraho CV, ibaruwa isaba n’ibaruwa igushyigikira. Ku mbuga zo hanze, kurikiza ibisabwa n’abateguye ayo mahirwe.",
    "fr": "Les critères varient selon l’offre. Consultez « Who can apply ». Une candidature PLP peut inclure un CV, une lettre de motivation et une lettre de soutien. Pour les candidatures externes, suivez les consignes de l’organisateur."
  }
},
{
  "id": "opportunity-saved",
  "q": {
    "en": "Where are my saved opportunities?",
    "rw": "Amahirwe nabitse nayabona he?",
    "fr": "Où retrouver mes offres enregistrées ?"
  },
  "words": {
    "en": [
      "saved",
      "bookmark",
      "shortlist",
      "deadline",
      "closing"
    ],
    "rw": [
      "nabitse",
      "nabika",
      "ntarengwa"
    ],
    "fr": [
      "enregistrées",
      "favoris",
      "échéance",
      "date limite"
    ]
  },
  "answer": {
    "en": "Use the bookmark on an opportunity to add it to Saved. Check the deadline before applying: saving does not reserve a place or submit an application. Submitted applications appear under My applications.",
    "rw": "Kanda ikimenyetso cyo kubika amahirwe, uyasange muri “Saved”. Kubika ntibivuze gusaba cyangwa gufatirwa umwanya. Ibyo wasabye biboneka muri “My applications”.",
    "fr": "Utilisez le marque-page pour retrouver une offre dans « Saved ». Enregistrer une offre ne réserve pas de place et n’envoie pas de candidature. Vos candidatures figurent dans « My applications »."
  }
},
  {
    "id": "join",
    "q": {
      "en": "How do I join PLP?",
      "rw": "Nakwiyandikisha muri PLP nte?",
      "fr": "Comment rejoindre PLP ?"
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
      ],
      "fr": [
        "rejoindre",
        "inscription",
        "inscrire",
        "adhérer",
        "adherer"
      ]
    },
    "answer": {
      "en": "Choose Join PLP, enter your name and email, choose Member, and set a password. Member access is immediate. Staff roles require an authorized assignment by an administrator.",
      "rw": "Kanda “Join PLP”, wandike amazina yawe na imeri, uhitemo “Member”, ushyireho ijambo ry’ibanga. Inshingano z’abakozi zitangwa n’umuyobozi ubifitiye uburenganzira.",
      "fr": "Choisissez « Join PLP », saisissez votre nom et votre adresse e-mail, sélectionnez « Member » et définissez un mot de passe. Les rôles du personnel sont attribués par un administrateur autorisé."
    }
  },
  {
    "id": "certificates",
    "q": {
      "en": "How do I get a certificate?",
      "rw": "Nabona icyemezo nte?",
      "fr": "Comment obtenir un certificat ?"
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
      ],
      "fr": [
        "certificat",
        "certificats",
        "attestation",
        "attestations",
        "télécharger",
        "telecharger"
      ]
    },
    "answer": {
      "en": "Academy course certificates are awarded automatically when you complete the required lessons, assignment, and assessment. Club leaders add students in School members, then select recipients to request standard PLP membership certificates. An administrator approves and issues the request. The coordinator can then download one PDF or the full batch. Members with a matching email can see their own issued certificates.",
      "rw": "Icyemezo cy’isomo rya Academy gitangwa iyo urangije amasomo, umukoro n’isuzuma bisabwa. Ku byemezo by’abanyamuryango bo mu mashuri, umuyobozi wa club abanza kwandika abanyeshuri muri “School members”, agahitamo abo asabira ibyemezo. Umuyobozi wa sisitemu arabyemeza akabitanga; umuhuzabikorwa akabikuramo nka PDF. Umunyamuryango ufite imeri ihuye n’iyanditswe ku cyemezo ashobora kukibona kuri konti ye.",
      "fr": "Les certificats des cours Academy sont délivrés automatiquement une fois les leçons, le devoir et l’évaluation requis terminés. Pour les certificats d’adhésion scolaires, le responsable du club inscrit les élèves dans « School members », puis sélectionne les bénéficiaires. Un administrateur approuve et délivre les certificats. Le coordinateur peut ensuite télécharger un PDF individuel ou le lot complet. Un membre dont l’adresse e-mail correspond peut consulter ses propres certificats."
    }
  },
  {
    "id": "students",
    "q": {
      "en": "Do students need an account?",
      "rw": "Abanyeshuri bakeneye konti?",
      "fr": "Les élèves ont-ils besoin d’un compte ?"
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
      ],
      "fr": [
        "élève",
        "élèves",
        "eleve",
        "eleves",
        "compte",
        "comptes",
        "école",
        "ecole"
      ]
    },
    "answer": {
      "en": "Students do not need an account for a coordinator to request their certificates. An optional matching email connects an issued certificate to a member account.",
      "rw": "Abanyeshuri ntibakeneye konti kugira ngo umuhuzabikorwa abasabire ibyemezo. Iyo bashyizeho imeri ihuye n’iyo kuri konti yabo, icyemezo cyatanzwe gishobora kugaragara kuri iyo konti.",
      "fr": "Les élèves n’ont pas besoin de compte pour qu’un coordinateur demande leurs certificats. Une adresse e-mail correspondante permet de relier le certificat délivré au compte du membre."
    }
  },
  {
    "id": "roles",
    "q": {
      "en": "Who is the administrator?",
      "rw": "Umuyobozi wa sisitemu akora iki?",
      "fr": "Quel est le rôle de l’administrateur ?"
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
      ],
      "fr": [
        "administrateur",
        "administratrice",
        "coordinateur",
        "coordinatrice",
        "formateur",
        "formatrice",
        "rôle",
        "rôles"
      ]
    },
    "answer": {
      "en": "The administrator manages staff access and issues certificates. Coordinators manage their assigned school only. Trainers manage their assigned courses.",
      "rw": "Umuyobozi wa sisitemu atanga uburenganzira bw’abakozi n’ibyemezo. Abahuzabikorwa bacunga amashuri bashinzwe gusa, naho abatoza bagacunga amasomo bashinzwe.",
      "fr": "L’administrateur gère les accès du personnel et délivre les certificats. Les coordinateurs gèrent uniquement l’école qui leur est attribuée. Les formateurs gèrent les cours qui leur sont confiés."
    }
  },
  {
    "id": "contact",
    "q": {
      "en": "How can I contact PLP?",
      "rw": "Navugana na PLP nte?",
      "fr": "Comment contacter PLP ?"
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
      ],
      "fr": [
        "contacter",
        "contactez",
        "joindre",
        "courriel",
        "aide"
      ]
    },
    "answer": {
      "en": "Email PLP at info@peaceloveproclaimers.org for help.",
      "rw": "Ukeneye ubufasha, andikira PLP kuri info@peaceloveproclaimers.org.",
      "fr": "Pour obtenir de l’aide, écrivez à PLP à l’adresse info@peaceloveproclaimers.org."
    }
  },
  {
    "id": "greeting",
    "q": {
      "en": "Hello",
      "rw": "Muraho",
      "fr": "Bonjour"
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
      ],
      "fr": [
        "bonjour",
        "salut",
        "bonsoir"
      ]
    },
    "answer": {
      "en": "Hello! Ask me about joining PLP, certificates, student accounts, or staff roles.",
      "rw": "Muraho! Mushobora kumbaza uko mwakwiyandikisha muri PLP, ibyemezo, konti z’abanyeshuri cyangwa inshingano z’abakozi.",
      "fr": "Bonjour ! Posez vos questions sur l’adhésion à PLP, les certificats, les comptes des élèves ou les rôles du personnel."
    }
  }
];
const normalize = (text: string) => text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const contains = (text: string, phrase: string) => ` ${text} `.includes(` ${normalize(phrase)} `);
export function detectFaqLanguage(question: string, previous: FaqLanguage = 'en'): FaqLanguage {
  const text = normalize(question);
  if (['nte', 'iki', 'ese', 'nshaka', 'ndashaka', 'murakoze', 'mwiriwe', 'nabona', 'nshobora', 'muri'].some(word => contains(text, word)) || faqEntries.some(entry => entry.words.rw.some(word => contains(text, word)))) return 'rw';
  if (['comment', 'quel', 'quelle', 'besoin', 'merci'].some(word => contains(text, word)) || faqEntries.some(entry => entry.words.fr.some(word => contains(text, word)))) return 'fr';
  if (['how', 'what', 'can', 'do', 'hello', 'please', 'who'].some(word => contains(text, word)) || faqEntries.some(entry => entry.words.en.some(word => contains(text, word)))) return 'en';
  return previous;
}
export function answerFaq(question: string, choice: FaqLanguageChoice = 'auto', previous: FaqLanguage = 'en') {
  const language = choice === 'auto' ? detectFaqLanguage(question, previous) : choice;
  const text = normalize(question);
  const ranked = faqEntries.map(entry => ({ entry, score: [...entry.words.en, ...entry.words.rw, ...entry.words.fr].reduce((sum, word) => sum + (contains(text, word) ? (entry.id === 'greeting' ? 0.1 : normalize(word).split(' ').length) : 0), 0) })).sort((a,b) => b.score - a.score);
  const best = ranked[0];
  const ambiguous = best.score > 0 && ranked[1]?.score === best.score;
  const fallback = language === 'rw'
    ? 'Mushobora gusobanura ikibazo cyanyu? Nshobora gusubiza ku kwiyandikisha muri PLP, ibyemezo, konti z’abanyeshuri n’inshingano z’abakozi. Ku bindi bibazo, mwandikire info@peaceloveproclaimers.org.'
    : language === 'fr' ? 'Pouvez-vous préciser votre question ? Je peux vous aider sur l’adhésion à PLP, les certificats, les comptes des élèves et les rôles du personnel. Pour toute autre question, écrivez à info@peaceloveproclaimers.org.'
    : 'Could you clarify your question? I can help with joining PLP, certificates, student accounts, and staff roles. For other questions, contact info@peaceloveproclaimers.org.';
  return { language, topic: best.score && !ambiguous ? best.entry.id : null, text: best.score && !ambiguous ? best.entry.answer[language] : fallback };
}
