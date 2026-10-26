import { test, expect, type Page } from "@playwright/test";
import { finishPersonalLeadership } from "./academy-helpers";

// Runs without the platform service: /api is stubbed and local Hub state is seeded per test.
const mails: { kind: string; recipient_email: string }[] = [];
async function seed(page: Page) {
  mails.length = 0;
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (!new URL(url).pathname.startsWith("/api/")) return route.fallback();
    if (url.endsWith("/credits/balance")) return route.fulfill({ json: { balance: 0 } });
    if (url.endsWith("/credits")) return route.fulfill({ json: [] });
    if (url.endsWith("/mentorship/notify")) { mails.push(JSON.parse(route.request().postData() || "{}")); return route.fulfill({ status: 202, json: { queued: true } }); }
    return route.fulfill({ json: {} });
  });
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    const d = await import("/src/features/hub/data.ts");
    const s: Record<string, unknown> = { version: 1, emailCleanupVersion: 1, currentId: "", courses: d.courses, opportunities: d.opportunities, mentors: d.mentors };
    for (const k of ["invitations", "membershipRequests", "enrollments", "certificates", "credits", "applications", "saved", "proofs", "outcomes", "activities", "sessions", "posts", "projects", "redemptions", "mentorEmails"]) s[k] = [];
    const p = (id: string, name: string, email: string, role: string) => ({ id, name, email, role, membership: "Approved", bio: "", skills: [], leadership: [], clubIds: [], managedClubIds: [], joined: "2026-01-01" });
    s.profiles = [p("u-student", "Amani Student", "amani@plp-member.rw", "Student member"), p("u-mentor", "Aline M.", "aline.m@peaceloveproclaimers.org", "Mentor")];
    localStorage.setItem("plp-hub-v1", JSON.stringify(s));
  });
}
const signInAs = (page: Page, id: string) => page.evaluate((id) => sessionStorage.setItem("plp-hub-session-v1", JSON.stringify({ profileId: id, kind: "member" })), id);
const futureLocal = () => { const d = new Date(Date.now() + 3 * 86400000); d.setMinutes(0, 0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

test("a session request is emailed to the mentor, who accepts it from the mentor dashboard", async ({ page }) => {
  await seed(page);
  await signInAs(page, "u-student");
  await page.goto("/mentorship");
  await page.getByRole("button", { name: /Request a session/ }).first().click();
  await page.getByLabel("Preferred date & time").fill(futureLocal());
  await page.getByLabel("What would you like to work on?").fill("Guidance on leading our club's peace campaign.");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect.poll(() => mails.map((m) => `${m.kind}:${m.recipient_email}`)).toEqual(["requested:aline.m@peaceloveproclaimers.org"]);

  await signInAs(page, "u-mentor");
  await page.goto("/hub");
  await expect(page.getByRole("cell", { name: /Amani Student/ })).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByLabel("Meeting link or venue").fill("https://meet.google.com/abc-defg-hij");
  await page.getByRole("button", { name: "Confirm session" }).click();
  await page.getByRole("tab", { name: /Upcoming/ }).click();
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  await expect.poll(() => mails.at(-1)?.kind).toBe("confirmed");
  expect(mails.at(-1)?.recipient_email).toBe("amani@plp-member.rw");

  await signInAs(page, "u-student");
  await page.goto("/mentorship");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel session" }).click();
  await expect.poll(() => mails.at(-1)?.kind).toBe("cancelled");
  await page.getByRole("tab", { name: "Past" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
});

test("modules complete only by passing timed quizzes, and expired attempts submit automatically", async ({ page }) => {
  await page.clock.install();
  await seed(page);
  await signInAs(page, "u-student");
  await page.goto("/academy/personal-leadership");
  await page.getByRole("button", { name: /Enroll in this course/ }).first().click();
  await expect(page.getByRole("button", { name: /Mark lesson complete/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Go to knowledge check/ }).click();
  await page.getByRole("button", { name: /Start quiz/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Turn on camera & start" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByLabel("Camera is on for this assessment")).toBeVisible();
  // Navigation is locked while the attempt is open.
  await page.getByRole("link", { name: "Opportunities" }).first().click();
  await expect(page).toHaveURL(/\/academy\/personal-leadership$/);
  await expect(page.getByText("Finish and submit your assessment before leaving this page.")).toBeVisible();
  await page.clock.fastForward("07:00");
  await expect(page.getByText(/Latest attempt: 0% \(0\/3\) · Not passed/)).toBeVisible();
  await expect(page.getByText(/time expired/)).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("plp-hub-v1")!).enrollments[0]);
  expect(state.lessons).toEqual([]);
  expect(state.attempts[0].reason).toBe("time");

  await page.getByRole("button", { name: /Retake quiz/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Turn on camera & start" }).click();
  for (const [q, a] of [["Where does leadership begin", "With understanding how your actions affect others"], ["A friend gives you feedback", "Listen without defending yourself"], ["Which combination", "A strength, a value, and an area to improve"]])
    await page.locator("fieldset", { hasText: q }).getByLabel(a).check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.getByText(/Latest attempt: 100%/)).toBeVisible();
  await page.getByRole("tab", { name: "Grades" }).click();
  await expect(page.getByRole("row", { name: /Module 1 knowledge check.*Passed.*100%/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Final graded exam.*Not started/ })).toBeVisible();
});

test("a course completes and issues a certificate only after every assessment is passed", async ({ page }) => {
  await seed(page);
  await signInAs(page, "u-student");
  await finishPersonalLeadership(page);
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("plp-hub-v1")!));
  expect(s.enrollments[0].completedAt).toBeTruthy();
  expect(s.enrollments[0].attempts.filter((a: { passed: boolean }) => a.passed)).toHaveLength(3);
  expect(s.certificates).toHaveLength(1);
});
