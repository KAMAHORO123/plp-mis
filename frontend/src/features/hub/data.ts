import type { HubFile } from "./operations-data";
export const categories = [
  "Leadership Development",
  "Employability Skills",
  "Entrepreneurship",
  "Digital Skills",
  "Civic & Peace Leadership",
] as const;
export const roles = [
  "Student member",
  "University member",
  "Community member",
  "Club leader",
  "Trainer",
  "Administrator",
  "School coordinator",
] as const;
export type HubRole = (typeof roles)[number];
export interface Lesson {
  title: string;
  content: string;
}
export interface Course {
  id: string;
  title: string;
  category: string;
  summary: string;
  level: string;
  duration: string;
  skills: string[];
  lessons: Lesson[];
  assignment: string;
  question: string;
  options: string[];
  answer: number;
  published: boolean;
  ownerId?: string;
  documents?: HubFile[];
}
export const courses: Course[] = [
  {
    id: "personal-leadership",
    title: "Personal Leadership",
    category: categories[0],
    summary:
      "Understand your strengths, find your purpose, and turn intention into action.",
    level: "Beginner",
    duration: "25 min",
    skills: ["Self-awareness", "Goal setting"],
    lessons: [
      {
        title: "Start with self-awareness",
        content:
          "Leadership begins with understanding how your actions affect others. Identify a strength, a value, and an area you want to improve. Ask someone you trust for a concrete example of when you helped a team. Listen without defending yourself, then compare their feedback with your own reflection.",
      },
      {
        title: "Turn purpose into a plan",
        content:
          "Choose one small change you can make in your club or community. Define a specific action, a measurable result, and a date to review it. For example: invite five classmates to a listening circle this month and record one improvement they suggest. Review what worked and adjust your next step.",
      },
    ],
    assignment:
      "Describe one strength, one community need, and a measurable action you will take this month.",
    question: "Which goal gives you the clearest way to track progress?",
    options: [
      "Become a better leader someday",
      "Host one listening circle with five peers by the end of the month",
      "Wait until someone gives you a leadership role",
    ],
    answer: 1,
    published: true,
  },
  {
    id: "career-readiness",
    title: "CV Writing & Interview Skills",
    category: categories[1],
    summary:
      "Tell your story with evidence and prepare for your next career conversation.",
    level: "Beginner",
    duration: "30 min",
    skills: ["CV writing", "Professional communication"],
    lessons: [
      {
        title: "Build an evidence-based CV",
        content:
          "A useful CV connects your experience to the role. Include a short profile, education, relevant projects, volunteering, and skills. Describe what you did and what changed. Replace “good team player” with a specific example. Never invent qualifications or outcomes, and ask permission before listing a referee.",
      },
      {
        title: "Prepare for the conversation",
        content:
          "Research the role and prepare an example using situation, task, action, and result. Practice explaining your own contribution in two minutes. Prepare a question about the team, arrive on time, and follow up professionally. A learning experience can be valuable even if the outcome was imperfect.",
      },
    ],
    assignment:
      "Write a CV achievement and a short interview example from a real project or volunteer activity.",
    question: "What makes a CV achievement useful?",
    options: [
      "A long list of adjectives",
      "An unsupported claim of expertise",
      "A specific action and an honest result",
    ],
    answer: 2,
    published: true,
  },
  {
    id: "startup-fundamentals",
    title: "Startup Fundamentals",
    category: categories[2],
    summary:
      "Explore a community problem and test an idea before building a venture.",
    level: "Intermediate",
    duration: "30 min",
    skills: ["Problem discovery", "Business modeling"],
    lessons: [
      {
        title: "Understand the problem",
        content:
          "Start by listening to people who experience the problem. Ask about their current approach, what is difficult, and how often it happens. Avoid leading questions that encourage praise for your idea. Write down the evidence and separate what you heard from what you assume.",
      },
      {
        title: "Test a small solution",
        content:
          "Describe your customer, the value you offer, the way you reach them, and the resources needed. Test a small prototype with a few people before investing heavily. Decide what result would support your idea and what would cause you to change it.",
      },
    ],
    assignment:
      "Describe a customer problem, your proposed solution, and one low-cost experiment to test it.",
    question: "What is the best first step for a new venture idea?",
    options: [
      "Interview people who experience the problem",
      "Spend the entire budget on branding",
      "Assume everyone is a customer",
    ],
    answer: 0,
    published: true,
  },
  {
    id: "digital-literacy",
    title: "Digital Literacy & AI Tools",
    category: categories[3],
    summary:
      "Build confidence with digital tools, reliable information, and responsible AI.",
    level: "Beginner",
    duration: "25 min",
    skills: ["Digital literacy", "AI literacy"],
    lessons: [
      {
        title: "Work safely online",
        content:
          "Use unique passwords and multifactor authentication where available. Check the sender and destination before opening unexpected links. Keep personal information out of public documents. When evaluating information, compare the original source, its date, and the evidence supporting the claim.",
      },
      {
        title: "Use AI with judgment",
        content:
          "Give an AI tool a clear task, useful context, and an output format. Treat its answer as a draft: check facts, calculations, and sources. Do not upload private member records. You remain responsible for the final work and should disclose AI assistance when your school or organization requires it.",
      },
    ],
    assignment:
      "Write a useful AI prompt for a club task and describe how you would check the answer and protect privacy.",
    question: "What should you do before using an AI-generated fact?",
    options: [
      "Assume a confident answer is accurate",
      "Verify it against a reliable source",
      "Share it without checking",
    ],
    answer: 1,
    published: true,
  },
  {
    id: "peace-leadership",
    title: "Peacebuilding & Active Citizenship",
    category: categories[4],
    summary:
      "Practice listening, constructive dialogue, and service in your community.",
    level: "Beginner",
    duration: "30 min",
    skills: ["Active listening", "Conflict resolution"],
    lessons: [
      {
        title: "Listen before responding",
        content:
          "In a disagreement, allow each person to describe their experience without interruption. Reflect back what you heard and ask whether you understood correctly. Separate the person from the problem. Avoid stereotypes, blame, and assumptions about a group based on one person’s behavior.",
      },
      {
        title: "Build a shared next step",
        content:
          "Identify a shared need and agree on one practical action. Invite quieter participants to contribute without pressure. Set a time to review the agreement. If a situation involves threats or harm, seek support from a trusted responsible adult or appropriate local service rather than attempting to mediate alone.",
      },
    ],
    assignment:
      "Outline a respectful dialogue activity and a community action your club could organize.",
    question: "Which response supports constructive dialogue?",
    options: [
      "Interrupt to prove your point",
      "Make assumptions about the other person",
      "Reflect what you heard and check your understanding",
    ],
    answer: 2,
    published: true,
  },
];
export const opportunityTypes = [
  "Internship",
  "Scholarship",
  "Job",
  "Fellowship",
  "Competition",
  "Grant",
  "Volunteering",
  "Conference & Summit",
  "Training",
] as const;
export interface Opportunity {
  id: string;
  title: string;
  type: string;
  organization: string;
  location: string;
  deadline: string;
  description: string;
  eligibility: string;
  published: boolean;
}
export const opportunities: Opportunity[] = opportunityTypes.map((type, i) => ({
  id: `op-${i}`,
  title: [
    "Community research internship",
    "Youth leadership scholarship",
    "Junior digital coordinator",
    "Peace leadership fellowship",
    "Community innovation challenge",
    "Youth venture seed grant",
    "MegaCare service team",
    "Youth for Change summit",
    "Workplace readiness workshop",
  ][i],
  type,
  organization: "PLP Hub · Sample listing",
  location: i % 2 ? "Online / Rwanda" : "Kigali, Rwanda",
  deadline: "2026-12-15",
  description:
    "Explore this sample opportunity, save it to your shortlist, and record a practice application. No application is sent to an employer or partner.",
  eligibility:
    "Sample eligibility: PLP members interested in learning and community impact. Live requirements will be supplied by the organizer.",
  published: true,
}));
export const mentors = [
  {
    id: "mentor-1",
    name: "Aline M.",
    role: "Mentor",
    area: "Leadership Development",
    title: "Community leadership & public speaking",
    bio: "Sample mentor profile for practicing goal setting and leadership conversations.",
    initials: "AM",
  },
  {
    id: "mentor-2",
    name: "Eric K.",
    role: "Industry expert",
    area: "Digital Skills",
    title: "Digital careers & portfolio reviews",
    bio: "Sample industry expert profile focused on practical digital skills and career direction.",
    initials: "EK",
  },
  {
    id: "mentor-3",
    name: "Diane U.",
    role: "Coach",
    area: "Entrepreneurship",
    title: "From an idea to your first experiment",
    bio: "Sample coach profile for venture discovery, customer interviews, and action planning.",
    initials: "DU",
  },
];
export const clubs = [
  {
    id: "club-school",
    name: "Kigali School Club",
    type: "School",
    location: "Kigali, Rwanda",
    description: "A sample school club learning leadership through service.",
  },
  {
    id: "club-university",
    name: "University Changemakers",
    type: "University",
    location: "Huye, Rwanda",
    description:
      "A sample university club connecting practical skills to community projects.",
  },
  {
    id: "club-homegroup",
    name: "Kigali Community Homegroup",
    type: "Homegroup",
    location: "Kigali, Rwanda",
    description:
      "A sample community homegroup for mentorship, dialogue, and volunteering.",
  },
  {
    id: "club-canada",
    name: "Canada Youth Community",
    type: "Community",
    location: "Canada",
    description:
      "A sample chapter workspace inspired by PLP’s international expansion.",
  },
];
export const rewards = [
  {
    id: "training",
    title: "Premium training pass",
    cost: 100,
    detail: "Unlock a sample advanced learning workshop.",
  },
  {
    id: "event",
    title: "Event ticket",
    cost: 75,
    detail: "Reserve a sample Youth for Change event pass.",
  },
  {
    id: "merch",
    title: "PLP merchandise",
    cost: 150,
    detail: "Record a sample merchandise reward request.",
  },
  {
    id: "mentoring",
    title: "Mentorship session",
    cost: 50,
    detail: "Unlock a sample focused mentoring session.",
  },
];
export const alxPrograms = [
  {
    id: "alx-ai",
    title: "AI Career Essentials",
    focus: "Digital Skills",
    url: "https://www.alxafrica.com/programme/career-ready-skills-training/",
    description:
      "Explore practical AI skills through the official ALX programme catalogue.",
  },
  {
    id: "alx-data",
    title: "Data Analytics",
    focus: "Digital Skills",
    url: "https://www.alxafrica.com/programme/data-analytics/",
    description:
      "Explore a data-focused learning pathway and track your own progress here.",
  },
  {
    id: "alx-founder",
    title: "Founder Academy",
    focus: "Entrepreneurship",
    url: "https://www.alxafrica.com/programme/founder-academy/",
    description:
      "Explore entrepreneurship learning for developing an idea into a venture.",
  },
];
