import { jsPDF } from "jspdf";

export interface PassportData {
  name: string;
  email: string;
  role: string;
  joined: string;
  bio: string;
  photo?: string;
  skills: string[];
  leadership: string[];
  communities: string[];
  credits: number;
  volunteerHours: number;
  coursesInProgress: string[];
  achievements: { title: string; kind: string; date: string; reference: string }[];
}

const NAVY: [number, number, number] = [12, 46, 75];
const BLUE: [number, number, number] = [29, 117, 219];
const MUTED: [number, number, number] = [102, 112, 133];
const LINE: [number, number, number] = [228, 231, 236];

async function imageData(src: string) {
  const blob = await (await fetch(src, { credentials: "same-origin" })).blob();
  return await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(blob); });
}

/** A printable one-page record of the member's development, replacing the old raw data export. */
export async function downloadPassportPDF(d: PassportData) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 16;
  let y = 0;
  pdf.setFillColor(...NAVY);
  pdf.rect(0, 0, W, 50, "F");
  let textX = M;
  if (d.photo) {
    try {
      const data = await imageData(d.photo);
      pdf.addImage(data, data.includes("image/png") ? "PNG" : "JPEG", M, 11, 28, 28);
      textX = M + 34;
    } catch { /* The passport is still useful without the photo. */ }
  }
  pdf.setTextColor(161, 201, 231).setFont("helvetica", "bold").setFontSize(8).text("PEACE AND LOVE PROCLAIMERS · DIGITAL YOUTH PASSPORT", textX, 17);
  pdf.setTextColor(255, 255, 255).setFontSize(20).text(d.name || "PLP member", textX, 27);
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(219, 233, 245).text(`${d.role} · ${d.email}${d.joined ? ` · Member since ${d.joined}` : ""}`, textX, 34);
  pdf.text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, textX, 40);
  y = 60;

  const stats: [string, string][] = [["Verified credits", String(d.credits)], ["Achievements", String(d.achievements.length)], ["Volunteer hours", String(d.volunteerHours)], ["Communities", String(d.communities.length)]];
  const cw = (W - M * 2 - 9) / 4;
  stats.forEach(([label, value], i) => {
    const x = M + i * (cw + 3);
    pdf.setDrawColor(...LINE).setFillColor(250, 251, 252).roundedRect(x, y, cw, 20, 2, 2, "FD");
    pdf.setTextColor(...NAVY).setFont("helvetica", "bold").setFontSize(15).text(value, x + 5, y + 10);
    pdf.setTextColor(...MUTED).setFont("helvetica", "normal").setFontSize(8).text(label, x + 5, y + 16);
  });
  y += 30;

  const ensure = (h: number) => { if (y + h > 285) { pdf.addPage(); y = 20; } };
  const section = (title: string) => {
    ensure(14);
    pdf.setTextColor(...BLUE).setFont("helvetica", "bold").setFontSize(9).text(title.toUpperCase(), M, y);
    pdf.setDrawColor(...LINE).line(M, y + 2, W - M, y + 2);
    y += 8;
  };
  const paragraph = (text: string) => {
    pdf.setTextColor(52, 64, 84).setFont("helvetica", "normal").setFontSize(10);
    for (const line of pdf.splitTextToSize(text, W - M * 2)) { ensure(6); pdf.text(line, M, y); y += 5; }
    y += 3;
  };
  const tags = (items: string[], empty: string) => {
    if (!items.length) return paragraph(empty);
    pdf.setFontSize(9).setFont("helvetica", "normal");
    let x = M;
    for (const item of items) {
      const w = pdf.getTextWidth(item) + 8;
      if (x + w > W - M) { x = M; y += 9; }
      ensure(9);
      pdf.setFillColor(234, 243, 252).roundedRect(x, y - 5, w, 7, 1.5, 1.5, "F");
      pdf.setTextColor(23, 93, 148).text(item, x + 4, y);
      x += w + 3;
    }
    y += 11;
  };

  section("About");
  paragraph(d.bio || "No personal statement added yet.");
  section("Skills");
  tags(d.skills, "Skills are added as courses are completed.");
  section("Leadership & communities");
  tags([...d.leadership, ...d.communities], "No leadership roles or communities recorded yet.");
  section("Achievements & certificates");
  if (!d.achievements.length) paragraph("No certificates issued yet.");
  for (const a of d.achievements) {
    ensure(14);
    pdf.setTextColor(...NAVY).setFont("helvetica", "bold").setFontSize(10).text(a.title, M, y);
    pdf.setTextColor(...MUTED).setFont("helvetica", "normal").setFontSize(8.5).text(`${a.kind} · issued ${a.date} · reference ${a.reference}`, M, y + 5);
    y += 12;
  }
  if (d.coursesInProgress.length) { section("Currently learning"); tags(d.coursesInProgress, ""); }

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setTextColor(...MUTED).setFontSize(7.5).text("Certificates can be verified at the PLP website using their reference. This passport is generated from the member's PLP Hub record.", M, 292);
  }
  pdf.save(`PLP-youth-passport-${(d.name || "member").replace(/\W+/g, "-")}.pdf`);
}
