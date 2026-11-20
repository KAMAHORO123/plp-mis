// PLP's management structure, as PLP management set it out ("PLP Website Feedback: Management Structure,
// Certificates and Branding"): the Executive Committee, the Special Oversight Teams and the Departments.
// Inside each group, teams run in reporting order. `photo` is the file name in /images/plp/team/
// (the -card.webp / -hd.webp versions); people without a photo yet keep a portrait space for one.
export interface Manager { name: string; role: string; detail?: string; photo?: string }
export interface ManagementTeam { title?: string; people: Manager[] }
export interface ManagementGroup { id: string; title: string; intro: string; teams: ManagementTeam[] }

export const executiveDirector: Manager = { name: 'Israel Nuru Mupenzi', role: 'Executive Director', photo: 'israel-nuru' };

export const managementTeam: ManagementGroup[] = [
  {
    id: 'executive', title: 'Executive Committee', intro: 'Sets PLP’s direction and leads its programmes, partnerships and finances.',
    teams: [
      { people: [
        { name: 'Aime Mutemura', role: 'Deputy Executive Director', detail: 'Programs & Impact', photo: 'aime-mutemura' },
        { name: 'Divin Ibambasi Manzi', role: 'Deputy Executive Director', detail: 'Strategic Planning & Development', photo: 'divin-ibambasi' },
        { name: 'Alida Gaju Rumanzi', role: 'Executive Secretary', photo: 'gaju-alidah' },
      ] },
      { people: [
        { name: 'Abdallah Ntwali', role: 'Director of Communications', photo: 'ntwari-abdallah' },
        { name: 'Jean de Dieu Ndayambaje', role: 'Creative Director', photo: 'n-jean-de-dieu' },
        { name: 'Marie Sandra Giramata', role: 'Director of Finance' },
        { name: 'Rita Sandrine Umuhoza', role: 'Director of Strategic Partnerships', photo: 'rita-sandrine' },
      ] },
    ],
  },
  {
    id: 'oversight', title: 'Special Oversight Teams', intro: 'Independent committees that keep PLP accountable and fair.',
    teams: [{ people: [
      { name: 'Eunice Ingabire Mugisha', role: 'Head of the Audit Committee', photo: 'ingabire-eunice' },
      { name: 'Mizero Parfine', role: 'Head of the Conflict Resolution Committee' },
    ] }],
  },
  {
    id: 'departments', title: 'Departments', intro: 'The teams who run PLP’s programmes, clubs and services every day.',
    teams: [
      { title: 'Administration', people: [
        { name: 'Divine Kayonga Ishimwe', role: 'Administrator', photo: 'divine-kayonga' },
      ] },
      { title: 'IT & Digital Systems', people: [
        { name: 'Linda Kellia Kamahoro', role: 'IT Manager', photo: 'kamahoro-linda-kellia-7' },
        { name: 'Livia Kirezi', role: 'IT Manager', photo: 'livia' },
        { name: 'Kelly Igisubizo', role: 'IT Manager', photo: 'kelly-gisubizo' },
      ] },
      { title: 'Programmes', people: [
        { name: 'Dan Shema', role: 'Program Lead', detail: 'Boardroom', photo: 'shema-dan' },
        { name: 'Munyaneza Denis', role: 'Program Lead', detail: 'Boardroom', photo: 'munyaneza-denis' },
        { name: 'Abi Benie Umwari', role: 'Program Lead', detail: 'Walk to Remember', photo: 'abi' },
        { name: 'Danny Kaberuka', role: 'Program Lead', detail: 'Anda Arts Festival', photo: 'danny-kaberuka' },
        { name: 'Dalynah Uwase Gasarasi', role: 'Program Lead', detail: 'MegaCare (Charity)', photo: 'dalynah' },
        { name: 'Akimana Micha Olga', role: 'Program Lead', detail: 'MegaCare (Charity)', photo: 'micha' },
        { name: 'Maniraguha Fabrice', role: 'Program Lead', detail: 'PLP Sober Nights & Entertainment', photo: 'maniraguha-fabrice' },
        { name: 'Maxine Mutavu', role: 'Program Lead', detail: 'PLP Sober Nights & Entertainment', photo: 'maxine' },
        { name: 'Arnold Mwumvaneza', role: 'Program Lead', detail: 'Youth Learning Hub' },
      ] },
      { title: 'Clubs, Homegroups & Membership', people: [
        { name: 'David Kanimba Mutabazi', role: 'Coordinator', detail: 'PLP School Clubs', photo: 'mutabazi' },
        { name: 'Amélia Banna Isaro', role: 'Coordinator', detail: 'PLP School Clubs', photo: 'amelia' },
        { name: 'Patrick Irumva Nyirimpeta', role: 'Coordinator', detail: 'Homegroups', photo: 'patrick' },
        { name: 'Phocas Byerekimana', role: 'Coordinator', detail: 'Homegroups', photo: 'phocas' },
        { name: 'Hirwa Djasri Carmel', role: 'Officer', detail: 'Membership & Engagement' },
        { name: 'Joie Chelda Igihozo', role: 'Officer', detail: 'Membership & Engagement', photo: 'igihozo-joie-chelda' },
        { name: 'Uwonkunda Princess', role: 'Coordinator', detail: 'PLP Mentorship Program', photo: 'princess-r' },
      ] },
      { title: 'Finance', people: [
        { name: 'Rita Kalisa Kaliza', role: 'Budgeting & Financial Planning Officer' },
        { name: 'Kazungu Collin M', role: 'Accounting & Payments' },
      ] },
      { title: 'Communications', people: [
        { name: 'Ornella Kayirangwa Kaliza', role: 'Communication Strategist', photo: 'ornella-nene' },
        { name: 'Albinah Loxane Ineza', role: 'Communication Strategist', photo: 'ineza-albinah-loxanne' },
        { name: 'Eunice Furaha Inema', role: 'Communication Strategist', photo: 'inema-furaha-eunice' },
      ] },
    ],
  },
];

/** "Marie Sandra Giramata" -> "MG": shown in the portrait space until a photo is added. */
export const initials = (name: string) => {
  const parts = name.replace(/\./g, '').split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};
