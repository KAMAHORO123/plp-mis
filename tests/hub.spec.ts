import { test, expect, type Page } from "@playwright/test";
const state = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("plp-hub-v1") || "null"));
const demoRoles: Record<string, string> = {
  "demo-0": "Student member",
  "demo-1": "University member",
  "demo-2": "Community member",
  "demo-3": "Club leader",
  "demo-4": "Trainer",
  "demo-5": "Administrator",
};
async function role(page: Page, id: string) {
  const previous = new URL(page.url()).pathname;
  await page.goto("/dev/access");
  await page
    .getByRole("button", { name: `Continue as ${demoRoles[id]}`, exact: true })
    .click();
  await expect(page).toHaveURL(/\/hub$/);
  if (previous !== "/dev/access" && previous !== "/") await page.goto(previous);
}
test.beforeEach(async ({ page }) => {
  await page.goto("/dev/access");
  await page
    .getByRole("button", { name: "Continue as Student member", exact: true })
    .click();
  await expect(page).toHaveURL(/\/hub$/);
});

async function complete(page: Page) {
  await page.goto("/academy/personal-leadership");
  await page.getByRole("button", { name: "Enroll in this course" }).click();
  await expect(
    page.getByRole("button", { name: "Submit & complete course" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Mark lesson complete", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mark lesson complete", exact: true })
    .click();
  await page
    .getByLabel(
      "Describe one strength, one community need, and a measurable action you will take this month.",
    )
    .fill(
      "I will organize a listening circle for five classmates by the end of this month and record their feedback.",
    );
  await page.getByLabel("Become a better leader someday").check();
  await page.getByRole("button", { name: "Submit & complete course" }).click();
  await expect(page.getByRole("status")).toContainText("Not quite");
  expect((await state(page)).certificates).toHaveLength(0);
  await page
    .getByLabel(
      "Host one listening circle with five peers by the end of the month",
    )
    .check();
  await page.getByRole("button", { name: "Submit & complete course" }).click();
  await expect(
    page.getByRole("heading", { name: "You earned it." }),
  ).toBeVisible();
}
test("learning gates, completion, PDF, verification, credits, reload and member isolation", async ({
  page,
}) => {
  await complete(page);
  let data = await state(page);
  expect(data.certificates).toHaveLength(1);
  expect(data.credits[0].amount).toBe(50);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Course completed", exact: true }),
  ).toBeDisabled();
  data = await state(page);
  expect(data.certificates).toHaveLength(1);
  expect(data.credits).toHaveLength(1);
  await page.goto("/learning-certificates");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const pdf = await downloaded;
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  await pdf.saveAs("/tmp/plp-test-certificate.pdf");
  await page.getByRole("link", { name: "Verify record" }).click();
  await expect(page.getByText("Found in this browser")).toBeVisible();
  await page.goto("/credits");
  const reward = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Mentorship session",
      exact: true,
    }),
  });
  await reward.getByRole("button", { name: "Redeem reward" }).click();
  await expect(
    reward.getByRole("button", { name: "Reward redeemed" }),
  ).toBeDisabled();
  data = await state(page);
  expect(
    data.credits.reduce((n: number, c: { amount: number }) => n + c.amount, 0),
  ).toBe(0);
  await role(page, "demo-1");
  await page.goto("/learning-certificates");
  await expect(
    page.getByRole("heading", { name: "Your first milestone is waiting." }),
  ).toBeVisible();
});
test("opportunity search, shortlist, application, withdrawal and persistence", async ({
  page,
}) => {
  await page.goto("/opportunities");
  await page.getByLabel("Opportunity type").selectOption("Internship");
  await expect(
    page.getByRole("heading", { name: "Community research internship" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Save Community research internship",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Prepare application" }).click();
  await page
    .getByLabel("Why are you interested?")
    .fill("I want to build practical community research and teamwork skills.");
  await page
    .getByRole("button", { name: "Record practice application" })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "My applications", exact: true })
    .click();
  await expect(
    page.getByText("Practice application recorded", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Withdraw practice application" })
    .click();
  await expect(
    page.getByText("No opportunities in this view.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Community research internship" }),
  ).toBeVisible();
});
test("mentor matching, booking, reflection and cancellation", async ({
  page,
}) => {
  await page.goto("/mentorship");
  await page.getByLabel("Mentor focus area").selectOption("Digital Skills");
  await page.getByRole("button", { name: "Request a session" }).click();
  const date = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 16);
  await page.getByLabel("Preferred date & time").fill(date);
  await page
    .getByLabel("What would you like to work on?")
    .fill("Review my digital learning goals and portfolio.");
  await page.getByRole("button", { name: "Save session request" }).click();
  await page
    .getByLabel("Session reflection")
    .fill(
      "We agreed that I should complete a small portfolio project this month.",
    );
  await page.getByRole("button", { name: "Mark completed" }).click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Request a session" }).click();
  await page
    .getByLabel("Preferred date & time")
    .fill(new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 16));
  await page
    .getByLabel("What would you like to work on?")
    .fill("Discuss my next project and learning goals.");
  await page.getByRole("button", { name: "Save session request" }).click();
  await page.getByRole("button", { name: "Cancel request" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
});
test("club membership, leader attendance, credits, report and administrator review", async ({
  page,
}) => {
  await page.goto("/clubs");
  await page.getByRole("button", { name: "Join this community" }).click();
  await role(page, "demo-3");
  await page.getByLabel("Alex Member", { exact: true }).check();
  await expect(
    page.getByLabel("Alex Member · recorded", { exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Activity report", { exact: true })
    .fill(
      "Members discussed leadership goals and agreed to organize a listening circle next month.",
    );
  await page
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await role(page, "demo-5");
  await page.getByRole("button", { name: "Mark report reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await role(page, "demo-0");
  await page.goto("/credits");
  await expect(
    page.getByText("Meeting: Welcome & leadership circle", { exact: true }),
  ).toBeVisible();
  const data = await state(page);
  expect(
    data.credits.filter((c: { memberId: string }) => c.memberId === "demo-0"),
  ).toHaveLength(1);
  expect(
    data.credits.find((c: { memberId: string }) => c.memberId === "demo-0")
      .amount,
  ).toBe(10);
});
test("trainer draft publication and administrator outcome analytics", async ({
  page,
}) => {
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", {
      name: "This workspace isn’t part of your role.",
    }),
  ).toBeVisible();
  await role(page, "demo-4");
  const fields: { [key: string]: string } = {
    "Course title": "Test community planning",
    "Estimated duration": "20 min",
    "Course summary": "Learn to plan a small community activity together.",
    "Skills (comma separated)": "Planning, Listening",
    "Lesson title": "Plan with your community",
    "Lesson content":
      "Start by listening to your community and documenting their priorities. Agree on a simple action, a realistic date, and a shared way of reviewing the outcome.",
    "Assignment instructions":
      "Describe one local action you could organize with your club.",
    "Assessment question": "What should you do first when planning?",
    "Answer option 1": "Listen to the community",
    "Answer option 2": "Ignore all feedback",
    "Answer option 3": "Spend all the budget",
  };
  for (const [label, value] of Object.entries(fields))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Save draft course" }).click();
  const card = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Test community planning",
      exact: true,
    }),
  });
  await card.getByRole("button", { name: "Publish", exact: true }).click();
  await page.goto("/academy");
  await expect(
    page.getByRole("heading", { name: "Test community planning", exact: true }),
  ).toBeVisible();
  await role(page, "demo-5");
  await page.goto("/hub-analytics");
  await page.getByLabel("Outcome date").fill("2026-09-19");
  await page
    .getByLabel("Outcome details")
    .fill("Recorded a sample community research internship placement.");
  await page.getByRole("button", { name: "Record outcome" }).click();
  await expect(
    page.getByText(
      "Recorded a sample community research internship placement.",
      { exact: true },
    ),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export impact report" }).click();
  expect((await download).suggestedFilename()).toBe("plp-hub-impact.csv");
});
test("ALX proof upload and recognition workflow", async ({ page }) => {
  await page.goto("/alx");
  const card = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "AI Career Essentials",
      exact: true,
    }),
  });
  await card.getByLabel("Your progress (%)").fill("100");
  await card.getByLabel("Completion proof", { exact: false }).setInputFiles({
    name: "completion.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("wrong file"),
  });
  await card
    .getByRole("button", { name: "Save progress / submit proof" })
    .click();
  await expect(page.getByText("Use a PDF, PNG, or JPG.")).toBeVisible();
  await card.getByLabel("Completion proof", { exact: false }).setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nSample evidence"),
  });
  await card
    .getByRole("button", { name: "Save progress / submit proof" })
    .click();
  await expect(card.getByText("Pending review", { exact: true })).toBeVisible();
  await role(page, "demo-5");
  await page.goto("/studio");
  await page.getByRole("button", { name: "ALX reviews", exact: true }).click();
  await page.getByRole("button", { name: "Recognize completion" }).click();
  await role(page, "demo-0");
  await page.goto("/passport");
  await expect(
    page.getByText("ALX recognition", { exact: true }),
  ).toBeVisible();
});
test("passport project, discussion and reply", async ({ page }) => {
  await page.goto("/passport");
  await page.getByLabel("Project title").fill("Community learning circle");
  await page
    .getByLabel("What changed because of your work?")
    .fill("Five classmates shared feedback and agreed on a service project.");
  await page.getByLabel("Date completed").fill("2026-09-19");
  await page.getByLabel("Hours contributed").fill("3");
  await page.getByRole("button", { name: "Add project" }).click();
  await expect(
    page.getByRole("heading", { name: "Community learning circle" }),
  ).toBeVisible();
  await page.goto("/community");
  await page.getByLabel("Discussion title").fill("What helps you lead a team?");
  await page
    .getByLabel("Your message", { exact: true })
    .fill(
      "I learned that listening to everyone before making a plan is useful.",
    );
  await page.getByRole("button", { name: "Start discussion" }).click();
  await page
    .getByLabel("Reply to What helps you lead a team?")
    .fill("Agreeing on a shared goal also helps.");
  await page.getByRole("button", { name: "Post reply" }).click();
  await expect(
    page.getByText("Agreeing on a shared goal also helps.", { exact: true }),
  ).toBeVisible();
});
test("mobile routes render without page errors or horizontal overflow and navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const api: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api")) api.push(r.url());
  });
  for (const path of [
    "/",
    "/about",
    "/stories",
    "/join",
    "/hub",
    "/academy",
    "/alx",
    "/opportunities",
    "/mentorship",
    "/community",
    "/clubs",
    "/passport",
    "/certificates",
    "/credits",
    "/verify/missing",
    "/studio",
    "/hub-analytics",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      path,
    ).toBeTruthy();
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Learning academy", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Learning academy", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(api).toEqual([]);
  await page.screenshot({ path: "/tmp/plp-hub-mobile.png", fullPage: true });
});
