import { jsPDF } from "jspdf";
import fs from "node:fs";
fs.mkdirSync("public/resources", { recursive: true });
const docs = [
  [
    "plp-impact-brief.pdf",
    "PLP impact brief",
    [
      [
        "Source",
        "Summary of the organization portfolio supplied for this project. Figures are historical claims in that portfolio, not live platform analytics.",
      ],
      [
        "Youth-led since 2007",
        "Peace and Love Proclaimers develops leadership, unity, peace, cultural identity, and practical skills.",
      ],
      [
        "Reported reach",
        "The portfolio reports 141 high schools, 2 universities, 10,000+ members and 2,000 active youth leaders since inception, and impact reaching 40,000+ young people. These figures have different scopes and should not be combined.",
      ],
      [
        "Pathways to opportunity",
        "The portfolio reports more than 100 volunteers placed across AMI Africa projects. A Canada chapter launched on July 26, 2025.",
      ],
      [
        "Peace and memory",
        "PLP initiated Walk to Remember in 2009. The portfolio describes it as a national commemoration initiative organized in more than 25 countries.",
      ],
      [
        "2026 targets, not achieved results",
        "The portfolio sets targets of 200 high schools, 5 universities, 4,000 active members with 60% women, and 100 internship/apprenticeship placements.",
      ],
      [
        "Contact",
        "info@peaceloveproclaimers.org | +250 788 236 141 | Kigali, Rwanda",
      ],
    ],
  ],
  [
    "plp-hub-brochure.pdf",
    "Discover your PLP journey",
    [
      [
        "PLP Hub - Discover & Develop",
        "Learn leadership, employability, entrepreneurship, digital skills, and civic and peace leadership. Join through a school, university, club, homegroup, or community.",
      ],
      [
        "Learn and grow",
        "Explore the learning academy, ALX learning zone, mentors, and community discussions. Record your skills, certificates, volunteering, and completed projects in a Digital Youth Passport.",
      ],
      [
        "PLP Connect - Do",
        "Explore internships, jobs, scholarships, fellowships, grants, competitions, volunteering, conferences, and training. Apply your skills through practical experience.",
      ],
      [
        "Demonstrate - Leadership in action",
        "Showcase learning, projects, ventures, career milestones, and community service. PLP initiatives include Walk to Remember, Ku Gicaniro, Anda Arts, Urungano Space, and MegaCare.",
      ],
      [
        "Every step counts",
        "The concept paper proposes credits for completing courses, attending meetings, volunteering, recruiting members, and participating in challenges. Credits unlock learning, events, merchandise, and mentoring.",
      ],
      [
        "Preview information",
        "This brochure summarizes the supplied PLP Hub concept paper and portfolio. The current frontend uses sample content and local browser storage; it is not an official membership application or live service.",
      ],
    ],
  ],
];
for (const [name, title, sections] of docs) {
  const doc = new jsPDF();
  doc.setTextColor(23, 49, 80);
  doc.setFontSize(25);
  doc.text(title, 20, 28);
  doc.setFontSize(11);
  doc.text("Peace and Love Proclaimers | Youth for Change", 20, 39);
  let y = 57;
  for (const [heading, body] of sections) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(heading, 20, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(body, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5.3 + 12;
  }
  doc.setFontSize(8);
  doc.text(
    "Prepared from supplied documents for the PLP Hub frontend preview.",
    20,
    286,
  );
  doc.save("public/resources/" + name);
}
