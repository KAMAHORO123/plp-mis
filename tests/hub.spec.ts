import { test, expect, type Page } from "@playwright/test";
import { finishPersonalLeadership } from "./academy-helpers";
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

// Completion now requires passing every timed quiz, the assignment, and the final exam.
async function complete(page: Page) {
  expect((await state(page))?.certificates ?? []).toHaveLength(0);
  await finishPersonalLeadership(page);
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
  await expect(page.getByText("Record found")).toBeVisible();
  await page.goto("/credits");
  await expect(page.getByRole('heading',{name:'Unlock something new'})).toHaveCount(0);
  data = await state(page);
  expect(data.credits.reduce((n:number,c:{amount:number})=>n+c.amount,0)).toBe(50);
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
// Mentorship request, mentor confirmation, and email notifications: see mentorship-academy.spec.ts.
test("ALX proof upload and recognition workflow", async ({ page }) => {
  await page.goto("/alx");
  const card = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "AI Career Essentials",
      exact: true,
    }),
  });
  await expect(card.getByLabel("Your progress (%)")).toHaveCount(0);
  await expect(card.locator('input[type="file"]')).toHaveAttribute("required", "");
  await card.getByLabel("Completion certificate", { exact: false }).setInputFiles({
    name: "completion.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("wrong file"),
  });
  await card
    .getByRole("button", { name: "Submit certificate" })
    .click();
  await expect(page.getByText("Use a PDF, PNG, or JPG.")).toBeVisible();
  await card.getByLabel("Completion certificate", { exact: false }).setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nSample evidence"),
  });
  await card
    .getByRole("button", { name: "Submit certificate" })
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
    "/auth/signup",
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
