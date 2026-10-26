import { test, expect, type Page } from "@playwright/test";
async function devSignIn(page: Page, role = "Administrator") {
  if (role === "Trainer") {
    await page.goto("/dev/access");
    await page.evaluate(() => sessionStorage.removeItem("plp-hub-session-v1"));
    await page.goto("/auth/login");
    await signIn(page, "trainer@demo.plp.test", "PlpDemo2026!");
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
  await expect(page).toHaveURL(/\/auth\/login$/);
}
async function join(page: Page, email = "member@example.test", name = "New Member") {
  await page.goto("/auth/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Member-pass-123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("Member-pass-123!");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/hub$/);
}
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("visitors see public content only; direct member URLs require sign-in", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Join PLP", exact: true }),
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
    await expect(page).toHaveURL(/\/auth\/login\?returnTo=/);
    await expect(
      page.getByRole("heading", { name: "Log in to your account" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Hub navigation" }),
    ).toHaveCount(0);
  }
  await page.goto("/student/old-shared-link");
  await expect(page).toHaveURL(/\/auth\/login$/);
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
  await page.goto("/auth/signup");
  await page.getByLabel("Full name").fill("Duplicate Member");
  await page.getByLabel("Email address").fill("MEMBER@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Member-pass-123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("Member-pass-123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toContainText("already uses this email");
});
test("staff routes are role restricted; browsing communities does not grant management", async ({
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
  await page.goto('/clubs');
  await expect(page.getByRole('button',{name:'Request to join',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'View activities',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'Publish an activity'})).toHaveCount(0);
  await devSignIn(page, 'Club leader');
  await page.goto('/clubs');
  await page.getByRole('button',{name:'Create a new activity'}).click();await expect(page.getByRole('heading',{name:'Publish an activity'})).toBeVisible();
  await expect(page.getByLabel('Activity host')).toHaveCount(0);
  await page.goto('/memberships');
  await expect(page.getByRole('heading',{name:'This workspace isn’t part of your role.'})).toBeVisible();
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
    page.getByRole("cell", { name: "Personal Leadership", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("cell", {
      name: "CV Writing & Interview Skills",
      exact: true,
    }),
  ).toBeVisible();
});
test("suspended member loses access on reload; persisted currentId is not a session", async ({
  page,
}) => {
  await devSignIn(page);
  await page.goto("/memberships");
  await page.getByLabel('Search members and staff').fill('Alex Member');
  await page.getByRole('button',{name:'Edit account'}).click();
  await page.getByLabel('Membership status').selectOption('Suspended');
  await page.getByLabel('Account note').fill('Your membership is paused for review.');
  await page.getByRole('button',{name:'Save account'}).click();
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
  await expect(page).toHaveURL(/\/auth\/login\?/);
});
test("public access pages and member navigation fit mobile screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/courses", "/auth/login", "/auth/signup"]) {
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
  await page.goto("/auth/login");
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
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("signup requires matching password confirmation before creating an account", async ({ page }) => {
  await page.goto('/auth/signup');
  await page.getByLabel('Full name').fill('Confirmation Test');
  await page.getByLabel('Email address').fill('confirmation@example.test');
  await page.getByLabel('School (if applicable)').fill('Green hills academy');
  await expect(page.getByLabel('School (if applicable)')).toHaveValue('GREEN HILLS ACADEMY');
  await page.getByLabel('Password', { exact: true }).fill('Member-pass-123!');
  await expect(page.getByLabel('Confirm password', { exact: true })).toHaveAttribute('required', '');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('Member-pass-123!');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show confirm password', exact: true }).click();
  await expect(page.getByLabel('Confirm password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByLabel('Confirm password', { exact: true }).fill('Different-pass-123!');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Passwords do not match');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('plp-hub-v1') || '{"profiles":[]}').profiles.some((p: {email:string}) => p.email === 'confirmation@example.test'))).toBe(false);
  await page.getByLabel('Confirm password', { exact: true }).fill('Member-pass-123!');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/\/hub$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('plp-hub-v1')!).profiles.find((p: {email:string}) => p.email === 'confirmation@example.test').schoolName)).toBe('GREEN HILLS ACADEMY');
});
test("sign-in has no demo shortcuts or Google, and forgot password sets a new password", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByText(/demo/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Google/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await page.getByLabel("Email address").fill("member@demo.plp.test");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("New password", { exact: true }).fill("Fresh-pass-2026");
  await page.getByLabel("Confirm new password", { exact: true }).fill("Fresh-pass-2026");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/auth\/login\?reset=1$/);
  await signIn(page, "member@demo.plp.test", "PlpDemo2026!");
  await expect(page.getByRole("alert")).toHaveText("The email or password is incorrect.");
  await signIn(page, "member@demo.plp.test", "Fresh-pass-2026");
  await expect(page).toHaveURL(/\/hub$/);
});
