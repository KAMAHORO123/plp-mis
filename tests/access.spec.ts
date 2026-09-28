import { test, expect, type Page } from "@playwright/test";
async function devSignIn(page: Page, role = "Administrator") {
  if (role === "Trainer") {
    await page.goto("/dev/access");
    await page.evaluate(() => sessionStorage.removeItem("plp-hub-session-v1"));
    await page.goto("/sign-in");
    await page.getByRole("button", {name:"Trainer trainer@demo.plp.test"}).click();
    await expect(page).toHaveURL(/\/hub$/);
    return;
  }
  await page.goto("/dev/access");
  await page
    .getByRole("button", { name: `Continue as ${role}`, exact: true })
    .click();
  await expect(page).toHaveURL(/\/hub$/);
}
async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
}
async function join(page: Page, email = "member@example.test", name = "New Member") {
  await page.goto("/join");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Member-pass-123!");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/hub$/);
}
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
function applicantCard(page: Page, name = "New Applicant") {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
}

test("visitors see public content only; direct member URLs require sign-in", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Join PLP", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Preview member" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Hub navigation" }),
  ).toHaveCount(0);
  await page.goto("/courses");
  await expect(
    page.getByRole("heading", { name: "Learning with PLP" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enroll in this course" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Start with self-awareness", { exact: true }),
  ).toHaveCount(0);
  for (const path of [
    "/hub",
    "/academy",
    "/academy/personal-leadership",
    "/alx",
    "/opportunities",
    "/mentorship",
    "/clubs",
    "/community",
    "/passport",
    "/certificates",
    "/credits",
    "/verify/test",
    "/studio",
    "/hub-analytics",
    "/memberships",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in\?returnTo=/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Hub navigation" }),
    ).toHaveCount(0);
  }
  await page.goto("/student/old-shared-link");
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(errors).toEqual([]);
});
test("members join immediately, sign back in, and cannot access staff tools", async ({ page }) => {
  await join(page);
  await page.goto("/academy/personal-leadership");
  await expect(page.getByRole("button", { name: "Enroll in this course" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Enroll in this course" })).toBeVisible();
  await page.goto("/memberships");
  await expect(page.getByRole("heading", { name: "This workspace isn’t part of your role." })).toBeVisible();
  await signOut(page);
  await signIn(page, "member@example.test", "wrong-password");
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await page.goto("/academy/personal-leadership");
  await page.getByLabel("Email address").fill("member@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Member-pass-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/academy\/personal-leadership$/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("plp-hub-v1")!));
  const member = saved.profiles.find((p: {email:string}) => p.email === "member@example.test");
  expect(member.membership).toBe("Approved");
  expect(member.role).toBe("Community member");
  expect(member.credentialHash).toMatch(/^pbkdf2:/);
  expect(JSON.stringify(saved)).not.toContain("Member-pass-123!");
  expect(saved.membershipRequests).toHaveLength(0);
  await signOut(page);
  await page.goto("/join");
  await page.getByLabel("Full name").fill("Duplicate Member");
  await page.getByLabel("Email address").fill("MEMBER@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Member-pass-123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toContainText("already uses this email");
});
test("staff routes are role restricted; joining another club does not grant management", async ({
  page,
}) => {
  await devSignIn(page, "Student member");
  for (const route of ["/studio", "/hub-analytics", "/memberships"]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", {
        name: "This workspace isn’t part of your role.",
      }),
    ).toBeVisible();
  }
  await page.goto("/clubs");
  await page.getByRole("button", { name: "Join this community" }).click();
  await expect(
    page.getByRole("heading", { name: "Member register" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download club report" }),
  ).toHaveCount(0);
  await devSignIn(page, "Club leader");
  await page.goto("/clubs");
  await expect(
    page.getByRole("heading", { name: "Member register" }),
  ).toBeVisible();
  await page
    .getByRole("button")
    .filter({ hasText: "University Changemakers" })
    .click();
  await page.getByRole("button", { name: "Join this community" }).click();
  await expect(
    page.getByRole("heading", { name: "Create a club activity" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Member register" }),
  ).toHaveCount(0);
  await page.goto("/memberships");
  await expect(page.getByLabel("Club").locator("option")).toHaveCount(1);
  await expect(page.getByLabel("Club")).toHaveValue("club-school");
  await devSignIn(page, "Trainer");
  await page.goto("/hub-analytics");
  await expect(
    page.getByRole("heading", {
      name: "This workspace isn’t part of your role.",
    }),
  ).toBeVisible();
});
test("trainer sees only assigned courses and related submissions", async ({
  page,
}) => {
  await devSignIn(page);
  await page.goto("/studio");
  await page
    .getByLabel("Trainer for Personal Leadership", { exact: true })
    .selectOption("");
  await devSignIn(page, "Trainer");
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Personal Leadership", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "CV Writing & Interview Skills",
      exact: true,
    }),
  ).toBeVisible();
});
test("invitation grants approved membership once and binds the invited email", async ({
  page,
}) => {
  await devSignIn(page, "Club leader");
  await page.goto("/memberships");
  await page.getByLabel("Invitee email").fill("invited@example.test");
  await page.getByRole("button", { name: "Create invitation" }).click();
  const url = await page.getByTestId("invitation-url").innerText();
  await signOut(page);
  await page.goto(url);
  await page.getByLabel("Full name").fill("Invited Member");
  await page.getByLabel("Password", { exact: true }).fill("Invited-pass-123!");
  await page.getByLabel("Email address").fill("wrong@example.test");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toContainText("invitation");
  await page.getByLabel("Email address").fill("invited@example.test");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/hub$/);
  await page.goto("/clubs");
  await expect(
    page.getByRole("button", { name: "You’re a member" }),
  ).toBeDisabled();
  await signOut(page);
  await page.goto(url);
  await expect(
    page.getByText(
      "This invitation is invalid, already used, or no longer active.",
      { exact: false },
    ),
  ).toBeVisible();
});
test("suspended member loses access on reload; persisted currentId is not a session", async ({
  page,
}) => {
  await devSignIn(page);
  await page.goto("/memberships");
  await page.getByRole("button", { name: /^Approved/ }).click();
  const card = applicantCard(page, "Alex Member");
  await card
    .getByLabel("Review feedback for Alex Member")
    .fill("Your membership is paused for review.");
  await card.getByRole("button", { name: "Pause membership" }).click();
  await page.goto('/dev/access');
  await page.getByRole('button',{name:'Continue as Student member',exact:true}).click();
  await expect(page).toHaveURL(/\/application-status$/);
  await page.goto("/passport");
  await expect(page).toHaveURL(/\/application-status$/);
  await expect(
    page.getByRole("heading", { name: "Your membership is paused" }),
  ).toBeVisible();
  await signOut(page);
  await page.goto("/hub");
  await expect(page).toHaveURL(/\/sign-in\?/);
});
test("public access pages and member navigation fit mobile screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/courses", "/sign-in", "/join"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      path,
    ).toBeTruthy();
    await expect(
      page.getByRole("combobox", { name: "Preview member" }),
    ).toHaveCount(0);
  }
  await page.goto("/sign-in");
  await page.screenshot({
    path: "/tmp/plp-member-signin-mobile.png",
    fullPage: true,
  });
  await devSignIn(page, "Student member");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Youth passport" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Digital youth passport" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});
