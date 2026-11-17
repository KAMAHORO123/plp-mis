// PLP's management structure, as PLP management set it out ("PLP Website Feedback: Management Structure,
// Certificates and Branding"). Three groups; inside each, the rows run in reporting order.
// `photo` is the file name in /images/plp/team/ (the -card.webp version is shown); people without a photo
// yet get an empty square so their picture can be added later.
// `tone` colours the card like the mockup: who the role sits under.
export type Tone = 'lead' | 'programmes' | 'strategy' | 'office' | 'oversight';
export interface Manager { name: string; role: string; detail?: string; photo?: string; tone: Tone }
export interface ManagementGroup { id: string; title: string; dashed?: boolean; align: 'center' | 'start'; rows: Manager[][] }

export const managementTeam: ManagementGroup[] = [
  {
    id: 'executive', title: 'Executive Committee', align: 'center',
    rows: [
      [{ name: 'Israel Nuru Mupenzi', role: 'Executive Director', photo: 'israel-nuru', tone: 'lead' }],
      [
        { name: 'Aime Mutemura', role: 'Deputy Executive Director', detail: 'Programs & Impact', photo: 'aime-mutemura', tone: 'programmes' },
        { name: 'Divin Ibambasi Manzi', role: 'Deputy Executive Director', detail: 'Strategic Planning & Development', photo: 'divin-ibambasi', tone: 'strategy' },
      ],
      [{ name: 'Alida Gaju Rumanzi', role: 'Executive Secretary', photo: 'gaju-alidah', tone: 'office' }],
      [
        { name: 'Abdallah Ntwali', role: 'Director of Communications', photo: 'ntwari-abdallah', tone: 'programmes' },
        { name: 'Jean de Dieu Ndayambaje', role: 'Creative Director', photo: 'n-jean-de-dieu', tone: 'programmes' },
        { name: 'Marie Sandra Giramata', role: 'Director of Finance', tone: 'strategy' },
        { name: 'Rita Sandrine Umuhoza', role: 'Director of Strategic Partnerships', photo: 'rita-sandrine', tone: 'strategy' },
      ],
    ],
  },
  {
    id: 'oversight', title: 'Special Oversight Teams', dashed: true, align: 'center',
    rows: [[
      { name: 'Eunice Ingabire Mugisha', role: 'Head of the Audit Committee', photo: 'ingabire-eunice', tone: 'oversight' },
      { name: 'Mizero Parfine', role: 'Head of the Conflict Resolution Committee', tone: 'oversight' },
    ]],
  },
  {
    id: 'departments', title: 'Departments', align: 'start',
    rows: [
      [{ name: 'Divine Kayonga Ishimwe', role: 'Administrator', photo: 'divine-kayonga', tone: 'office' }],
      [
        { name: 'Linda Kellia Kamahoro', role: 'IT Manager', photo: 'kamahoro-linda-kellia-7', tone: 'programmes' },
        { name: 'Livia Kirezi', role: 'IT Manager', photo: 'livia', tone: 'programmes' },
        { name: 'Kelly Igisubizo', role: 'IT Manager', photo: 'kelly-gisubizo', tone: 'programmes' },
      ],
      [
        { name: 'Dan Shema', role: 'Program Lead', detail: 'Boardroom', photo: 'shema-dan', tone: 'programmes' },
        { name: 'Munyaneza Denis', role: 'Program Lead', detail: 'Boardroom', photo: 'munyaneza-denis', tone: 'programmes' },
        { name: 'Abi Benie Umwari', role: 'Program Lead', detail: 'Walk to Remember', photo: 'abi', tone: 'programmes' },
        { name: 'Danny Kaberuka', role: 'Program Lead', detail: 'Anda Arts Festival', photo: 'danny-kaberuka', tone: 'programmes' },
      ],
      [
        { name: 'Dalynah Uwase Gasarasi', role: 'Program Lead', detail: 'MegaCare (Charity)', photo: 'dalynah', tone: 'programmes' },
        { name: 'Akimana Micha Olga', role: 'Program Lead', detail: 'MegaCare (Charity)', photo: 'micha', tone: 'programmes' },
        { name: 'Maniraguha Fabrice', role: 'Program Lead', detail: 'PLP Sober Nights & Entertainment', photo: 'maniraguha-fabrice', tone: 'programmes' },
        { name: 'Maxine Mutavu', role: 'Program Lead', detail: 'PLP Sober Nights & Entertainment', photo: 'maxine', tone: 'programmes' },
      ],
      [
        { name: 'Arnold Mwumvaneza', role: 'Program Lead', detail: 'Youth Learning Hub', tone: 'programmes' },
        { name: 'David Kanimba Mutabazi', role: 'PLP School Clubs', detail: 'Coordinator', photo: 'mutabazi', tone: 'programmes' },
        { name: 'Amélia Banna Isaro', role: 'PLP School Clubs', detail: 'Coordinator', photo: 'amelia', tone: 'programmes' },
        { name: 'Patrick Irumva Nyirimpeta', role: 'Homegroups', detail: 'Coordinator', photo: 'patrick', tone: 'programmes' },
      ],
      [
        { name: 'Phocas Byerekimana', role: 'Homegroups', detail: 'Coordinator', photo: 'phocas', tone: 'programmes' },
        { name: 'Hirwa Djasri Carmel', role: 'Membership & Engagement', detail: 'Officer', tone: 'programmes' },
        { name: 'Joie Chelda Igihozo', role: 'Membership & Engagement', detail: 'Officer', photo: 'igihozo-joie-chelda', tone: 'programmes' },
        { name: 'Uwonkunda Princess', role: 'PLP Mentorship Program', detail: 'Coordinator', photo: 'princess-r', tone: 'programmes' },
      ],
      [
        { name: 'Rita Kalisa Kaliza', role: 'Budgeting & Financial Planning Officer', tone: 'strategy' },
        { name: 'Kazungu Collin M', role: 'Accounting & Payments', tone: 'strategy' },
      ],
      [
        { name: 'Ornella Kayirangwa Kaliza', role: 'Communication Strategist', photo: 'ornella-nene', tone: 'programmes' },
        { name: 'Albinah Loxane Ineza', role: 'Communication Strategist', photo: 'ineza-albinah-loxanne', tone: 'programmes' },
        { name: 'Eunice Furaha Inema', role: 'Communication Strategist', photo: 'inema-furaha-eunice', tone: 'programmes' },
      ],
    ],
  },
];
