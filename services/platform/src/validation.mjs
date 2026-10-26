// Business rules for records, on top of the shape checks in recordSchema. Messages are shown to people as written.
// On updates only fields that changed are checked, so older records stay editable.
const fail = (message) => { throw Object.assign(new Error(message), { status: 400 }); };
export const kigaliToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kigali" }).format(new Date());
// Invalid dates such as month 13 make Date throw on toISOString, so check for NaN first.
const realDate = (s) => { if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; };
const yearsAhead = (n) => `${Number(kigaliToday().slice(0, 4)) + n}${kigaliToday().slice(4)}`;

export function validateRecord(kind, data, before) {
  const changed = (key) => !before || JSON.stringify(before[key]) !== JSON.stringify(data[key]);
  const text = (key, label, min, max, required = true) => {
    if (!changed(key)) return;
    const value = typeof data[key] === "string" ? data[key].trim() : "";
    if (!value) { if (required) fail(`${label} is required.`); return; }
    if (value.length < min) fail(`${label} must be at least ${min} characters.`);
    if (value.length > max) fail(`${label} must be ${max} characters or fewer.`);
  };
  const date = (key, label, { required = true, notPast = false } = {}) => {
    if (!changed(key)) return;
    if (!data[key]) { if (required) fail(`${label} is required.`); return; }
    if (!realDate(data[key])) fail(`${label} is not a real date.`);
    if (data[key] < "2020-01-01" || data[key] > yearsAhead(2)) fail(`${label} must be between 2020 and two years from today.`);
    if (notPast && data[key] < kigaliToday()) fail(`${label} cannot be in the past.`);
  };

  if (kind === "events") {
    text("title", "Activity title", 3, 120);
    date("date", "Activity date");
    text("description", "Activity details", 10, 2000);
    text("activity_type", "Activity type", 2, 40, false);
    text("category", "Activity host", 2, 120, false);
    if (changed("hours") && data.hours !== undefined && !(data.hours >= 0.5 && data.hours <= 24 && Number.isInteger(data.hours * 2)))
      fail("Activity hours must be between 0.5 and 24, in half hours.");
  }
  if (kind === "opportunities") {
    text("title", "Opportunity title", 3, 120);
    text("description", "Description", 10, 10000);
    text("organization", "Organisation", 2, 100, false);
    date("deadline", "Application deadline", { required: false, notPast: !before || changed("deadline") });
  }
  if (kind === "members") {
    text("title", "Member name", 2, 100);
    text("category", "Member category", 2, 60, false);
  }
  if (kind === "materials") {
    text("title", "Material title", 3, 120);
  }
  if (kind === "proofs") {
    if (!/^alx-[a-z0-9-]{1,40}$/.test(data.category ?? "")) fail("Choose an ALX programme.");
    if (data.attachments?.length !== 1) fail("Upload exactly one certificate file.");
  }
}

/** What a course needs to work for learners. The trainer studio's checklist adds presentation items (outcomes, pathway). */
export function validatePublishable(data) {
  // Older courses use one knowledge check instead of module quizzes and an exam; they stay publishable.
  if (!data.exam?.length && data.question && data.options?.length >= 2 && data.answer !== undefined) {
    if (!data.title?.trim() || !data.lessons?.length || data.lessons.some((l) => !l.content?.trim())) fail("Before publishing, add a title and lessons with content.");
    return;
  }
  const missing = [];
  if (!data.title?.trim() || !data.description?.trim()) missing.push("a title and summary");
  if (!data.lessons?.length || data.lessons.some((l) => !l.title?.trim() || !l.content?.trim())) missing.push("modules that each have a reading");
  if (!data.lessons?.length || data.lessons.some((l) => !l.quiz?.length)) missing.push("a knowledge check in every module");
  if ((data.assignment ?? "").trim().split(/\s+/).filter(Boolean).length < 5) missing.push("an assignment brief");
  if ((data.exam?.length ?? 0) < 3) missing.push("a final exam with at least three questions");
  if (missing.length) fail(`Before publishing, add ${missing.join(", ")}.`);
}
