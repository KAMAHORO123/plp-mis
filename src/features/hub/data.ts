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
  "Mentor",
  "Administrator",
] as const;
export type HubRole = (typeof roles)[number];
export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
}
export interface Lesson {
  title: string;
  content: string;
  /** Module knowledge check. Learners complete a module only by passing it. */
  quiz?: Question[];
  quizMinutes?: number;
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
  outcomes?: string[];
  exam?: Question[];
  examMinutes?: number;
  passMark?: number;
  maxAttempts?: number;
}
/** Courses come only from PLP trainers (published through the platform); there are no built-in samples. */
export const courses: Course[] = [];
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
  /** "external" sends applicants to the organiser's own application page. */
  applyMode?: "internal" | "external";
  applyUrl?: string;
  format?: "On-site" | "Remote" | "Hybrid";
  commitment?: string;
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
  organization: "PLP Connect",
  location: i % 2 ? "Online / Rwanda" : "Kigali, Rwanda",
  deadline: "2026-12-15",
  description:
    "Save this opportunity to your shortlist and prepare your application with your CV, cover letter and supporting documents.",
  eligibility:
    "PLP members interested in learning and community impact. Full requirements are provided by the organizer.",
  published: true,
}));
export interface Mentor {
  id: string;
  name: string;
  email: string;
  role: string;
  area: string;
  title: string;
  bio: string;
  initials: string;
  avatar: string;
  /** False while the mentor has paused new session requests. */
  accepting?: boolean;
}
export const mentors: Mentor[] = [
  {
    id: "mentor-1",
    name: "Aline M.",
    email: "aline.m@peaceloveproclaimers.org",
    role: "Mentor",
    area: "Leadership Development",
    title: "Community leadership & public speaking",
    bio: "Supports members with goal setting and leadership conversations.",
    initials: "AM",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80",
  },
  {
    id: "mentor-2",
    name: "Eric K.",
    email: "eric.k@peaceloveproclaimers.org",
    role: "Industry expert",
    area: "Digital Skills",
    title: "Digital careers & portfolio reviews",
    bio: "Focused on practical digital skills and career direction.",
    initials: "EK",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&h=400&q=80",
  },
  {
    id: "mentor-3",
    name: "Diane U.",
    email: "diane.u@peaceloveproclaimers.org",
    role: "Coach",
    area: "Entrepreneurship",
    title: "From an idea to your first experiment",
    bio: "Guides venture discovery, customer interviews, and action planning.",
    initials: "DU",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&h=400&q=80",
  },
  {
    id: "mentor-4",
    name: "Kevin N.",
    email: "kevin.n@peaceloveproclaimers.org",
    role: "Career Advisor",
    area: "Employability Skills",
    title: "Resume strategy & workplace readiness",
    bio: "Helps members prepare for interviews, professional communication, and job applications.",
    initials: "KN",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
  },
  {
    id: "mentor-5",
    name: "Sandrine B.",
    email: "sandrine.b@peaceloveproclaimers.org",
    role: "Fellow",
    area: "Civic & Peace Leadership",
    title: "Community dialogue & conflict resolution",
    bio: "Passionate about youth peace initiatives and community service facilitation.",
    initials: "SB",
    avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=400&h=400&q=80",
  },
];
export const clubs = [
  {
    id: "club-school",
    name: "Kigali School Club",
    type: "School",
    location: "Kigali, Rwanda",
    description: "A school club learning leadership through service.",
  },
  {
    id: "club-university",
    name: "University Changemakers",
    type: "University",
    location: "Huye, Rwanda",
    description:
      "A university club connecting practical skills to community projects.",
  },
  {
    id: "club-homegroup",
    name: "Kigali Community Homegroup",
    type: "Homegroup",
    location: "Kigali, Rwanda",
    description:
      "A community homegroup for mentorship, dialogue, and volunteering.",
  },
  {
    id: "club-canada",
    name: "Canada Youth Community",
    type: "Community",
    location: "Canada",
    description:
      "PLP’s international chapter community.",
  },
];
export const rewards = [
  {
    id: "training",
    title: "Premium training pass",
    cost: 100,
    detail: "Unlock an advanced learning workshop.",
  },
  {
    id: "event",
    title: "Event ticket",
    cost: 75,
    detail: "Reserve a Youth for Change event pass.",
  },
  {
    id: "merch",
    title: "PLP merchandise",
    cost: 150,
    detail: "Request PLP merchandise.",
  },
  {
    id: "mentoring",
    title: "Mentorship session",
    cost: 50,
    detail: "Unlock a focused mentoring session.",
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
