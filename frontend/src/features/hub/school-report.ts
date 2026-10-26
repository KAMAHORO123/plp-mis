// A school's report for administrators: figures, activities, members and the activity reports,
// for a chosen period, as a printable PDF or a spreadsheet.
import type { HubState } from './store';
import { today } from './store';
import { downloadCSV } from './ui';
import { certificateFileName } from './certificate-pdf';

export interface SchoolReport {
  school: string; district: string; leaders: string; from: string; to: string;
  totals: { members: number; held: number; upcoming: number; attendance: number; reported: number; hours: number; certificates: number; materials: number };
  activities: { id: string; date: string; title: string; type: string; hours: number; attended: number; status: string; report?: string }[];
  members: { id: string; name: string; email: string; category: string; attended: number; certificate: string }[];
}

export function buildSchoolReport(state: HubState, schoolId: string, schoolName: string, district: string, leaders: string, from = '', to = ''): SchoolReport {
  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to);
  const activities = state.operations.activities.filter((a) => a.hostId === schoolId && inRange(a.date)).sort((a, b) => b.date.localeCompare(a.date));
  const register = state.schoolRecords.members.filter((m) => m.schoolId === schoolId);
  const issued = state.schoolRecords.requests.filter((r) => r.schoolId === schoolId && r.status === 'Issued');
  const certificateOf = (id: string) => issued.find((r) => r.members.some((m) => m.id === id));
  const held = activities.filter((a) => a.date <= today());
  return {
    school: schoolName, district, leaders, from, to,
    totals: {
      members: register.length,
      held: held.length,
      upcoming: activities.length - held.length,
      attendance: activities.reduce((n, a) => n + a.attendees.length, 0),
      reported: held.filter((a) => a.report).length,
      hours: held.reduce((n, a) => n + (a.hours ?? 0) * a.attendees.length, 0),
      certificates: issued.filter((r) => inRange(r.issued ?? r.submitted)).reduce((n, r) => n + r.members.length, 0),
      materials: state.operations.completions.filter((c) => c.schoolId === schoolId && inRange(c.completedAt.slice(0, 10))).length,
    },
    activities: activities.map((a) => ({
      id: a.id, date: a.date, title: a.title, type: a.type ?? 'Meeting', hours: a.hours ?? 0, attended: a.attendees.length,
      status: a.report ? 'Report submitted' : a.date > today() ? 'Not held yet' : 'Awaiting report', report: a.report,
    })),
    members: register.map((m) => ({
      id: m.id, name: m.name, email: m.email, category: m.category,
      attended: activities.filter((a) => a.attendees.includes(m.id)).length,
      certificate: certificateOf(m.id) ? `Issued ${certificateOf(m.id)!.issued ?? ''}`.trim() : '—',
    })).sort((a, b) => b.attended - a.attended || a.name.localeCompare(b.name)),
  };
}

export const periodLabel = (r: Pick<SchoolReport, 'from' | 'to'>) => (r.from && r.to ? `${r.from} to ${r.to}` : r.from ? `Since ${r.from}` : r.to ? `Up to ${r.to}` : 'All time');

/** One sheet: the activities, then the members. */
export function downloadSchoolReportCSV(r: SchoolReport) {
  downloadCSV(certificateFileName(r.school, 'School report', periodLabel(r)).replace(/\.pdf$/, '.csv'), [
    ['School report', r.school], ['District', r.district], ['Club leaders', r.leaders], ['Period', periodLabel(r)], [],
    ['Activities'], ['Date', 'Activity', 'Type', 'Hours', 'Attended', 'Report status'],
    ...r.activities.map((a) => [a.date, a.title, a.type, a.hours, a.attended, a.status]), [],
    ['Members'], ['Name', 'Email', 'Category', 'Activities attended', 'Certificate'],
    ...r.members.map((m) => [m.name, m.email, m.category, m.attended, m.certificate]),
  ]);
}

/** A printable A4 report with a summary, tables that continue across pages, and the activity reports in full. */
export async function downloadSchoolReportPDF(r: SchoolReport) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 16, bottom = 280, NAVY: [number, number, number] = [12, 46, 75], INK: [number, number, number] = [16, 24, 40], MUTED: [number, number, number] = [102, 112, 133], LINE: [number, number, number] = [228, 231, 236];
  let y = 0;
  const newPage = () => { pdf.addPage(); y = 20; };
  const ensure = (h: number) => { if (y + h > bottom) newPage(); };
  const heading = (text: string) => { ensure(18); y += 6; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(...INK); pdf.text(text, M, y); y += 6; };

  // Header band
  pdf.setFillColor(...NAVY); pdf.rect(0, 0, W, 40, 'F');
  pdf.setTextColor(161, 201, 231); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text('PEACE AND LOVE PROCLAIMERS · SCHOOL REPORT', M, 13);
  pdf.setTextColor(255, 255, 255); pdf.setFontSize(20); pdf.text(r.school, M, 25);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(212, 231, 246);
  pdf.text(`${r.district ? `${r.district} · ` : ''}Club leaders: ${r.leaders}`, M, 32);
  pdf.text(`${periodLabel(r)} · Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, M, 37);
  y = 50;

  // Summary figures, three per row
  const figures: [string, string][] = [
    ['Register members', String(r.totals.members)], ['Activities held', String(r.totals.held)], ['Attendance recorded', String(r.totals.attendance)],
    ['Reports filed', `${r.totals.reported} of ${r.totals.held}`], ['Activity hours (people × hours)', String(r.totals.hours)], ['Certificates issued', String(r.totals.certificates)],
  ];
  const boxW = (W - 2 * M - 8) / 3;
  figures.forEach(([label, value], i) => {
    const x = M + (i % 3) * (boxW + 4), by = y + Math.floor(i / 3) * 24;
    pdf.setDrawColor(...LINE); pdf.setFillColor(248, 250, 252); pdf.roundedRect(x, by, boxW, 20, 2, 2, 'FD');
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MUTED); pdf.text(label, x + 4, by + 7);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.setTextColor(...INK); pdf.text(value, x + 4, by + 16);
  });
  y += 50;
  if (r.totals.upcoming) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MUTED); pdf.text(`${r.totals.upcoming} more activit${r.totals.upcoming === 1 ? 'y is' : 'ies are'} planned in this period. ${r.totals.materials} learning material completion${r.totals.materials === 1 ? '' : 's'} recorded.`, M, y); y += 4; }

  // A simple table that repeats its header on each new page
  const table = (columns: { label: string; width: number; align?: 'right' }[], rows: string[][]) => {
    const head = () => {
      pdf.setFillColor(242, 244, 247); pdf.rect(M, y, W - 2 * M, 8, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...MUTED);
      let x = M + 2; for (const c of columns) { pdf.text(c.label, c.align === 'right' ? x + c.width - 4 : x, y + 5.5, { align: c.align ?? 'left' }); x += c.width; }
      y += 8;
    };
    ensure(16); head();
    if (!rows.length) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MUTED); pdf.text('Nothing recorded in this period.', M + 2, y + 6); y += 10; return; }
    for (const row of rows) {
      if (y + 8 > bottom) { newPage(); head(); }
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...INK);
      let x = M + 2;
      row.forEach((cell, i) => { const c = columns[i]; const lines = pdf.splitTextToSize(cell, c.width - 6) as string[]; const text = lines.length > 1 ? `${lines[0].replace(/[\s·,-]+$/, '')}…` : lines[0] ?? ''; pdf.text(text, c.align === 'right' ? x + c.width - 4 : x, y + 5.5, { align: c.align ?? 'left' }); x += c.width; });
      pdf.setDrawColor(...LINE); pdf.line(M, y + 8, W - M, y + 8); y += 8;
    }
  };

  heading(`Activities (${r.activities.length})`);
  table([{ label: 'Date', width: 24 }, { label: 'Activity', width: 62 }, { label: 'Type', width: 28 }, { label: 'Hours', width: 14, align: 'right' }, { label: 'Attended', width: 18, align: 'right' }, { label: 'Report', width: 32 }],
    r.activities.map((a) => [a.date, a.title, a.type, String(a.hours), String(a.attended), a.status]));

  heading(`Register members (${r.members.length})`);
  table([{ label: 'Name', width: 50 }, { label: 'Email', width: 56 }, { label: 'Category', width: 26 }, { label: 'Attended', width: 18, align: 'right' }, { label: 'Certificate', width: 28 }],
    r.members.map((m) => [m.name, m.email || '—', m.category, String(m.attended), m.certificate]));

  const reports = r.activities.filter((a) => a.report);
  heading(`Activity reports (${reports.length})`);
  if (!reports.length) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MUTED); pdf.text('No reports were submitted in this period.', M, y + 4); y += 8; }
  for (const a of reports) {
    const lines = pdf.splitTextToSize(a.report ?? '', W - 2 * M) as string[];
    ensure(14 + Math.min(lines.length, 6) * 4.5);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...INK); pdf.text(a.title, M, y + 5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MUTED); pdf.text(`${a.date} · ${a.type} · ${a.attended} attended`, M, y + 10);
    y += 14; pdf.setFontSize(9); pdf.setTextColor(52, 64, 84);
    for (const l of lines) { ensure(5); pdf.text(l, M, y); y += 4.5; }
    y += 4;
  }

  // Page footers
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MUTED);
    pdf.text(`Peace and Love Proclaimers · ${r.school} · ${periodLabel(r)}`, M, 290);
    pdf.text(`Page ${i} of ${total}`, W - M, 290, { align: 'right' });
  }
  pdf.save(certificateFileName(r.school, 'School report', periodLabel(r)));
}
