import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { createServer } from "../../services/platform/src/server.mjs";
import { connectDatabase } from "../../services/platform/src/db.mjs";
import { digest, hashPassword } from "../../services/platform/src/auth.mjs";
if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")
)
  throw Error("Dedicated test database required");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const db = connectDatabase(),
  origin = "http://127.0.0.1:5177";
const server = createServer({
  db,
  origin,
  secure: false,
  google: null,
  recoveryEnabled: true,
});
await new Promise((r) => server.listen(8085, "127.0.0.1", r));
const vite = spawn(
  process.execPath,
  [
    "system/node_modules/vite/bin/vite.js",
    "--config",
    "system/vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    "5177",
    "system",
  ],
  {
    env: { ...process.env, PLATFORM_DEV_URL: "http://127.0.0.1:8085" },
    stdio: "ignore",
  },
);
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const email = `recovery-browser-${randomUUID()}@example.test`;
  await db.query(
    "INSERT INTO users(id,email,name,password_hash,status) VALUES($1,$2,'Recovery test',$3,'approved')",
    [randomUUID(), email, await hashPassword("Original-password-123")],
  );
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/sign-in", "/join", "/forgot-password"]) {
      await page.goto(origin + path);
      await page.locator("h1").waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      if (path === "/sign-in")
        assert.equal(await page.getByText(/Google/).count(), 0);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/sign-in");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await page.getByRole("heading", { name: "Forgot your password?" }).waitFor();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Verify your email" }).waitFor();
  const code = (
    await db.query(
      "SELECT token FROM recovery_mail WHERE recipient=$1 AND purpose='reset_code'",
      [email],
    )
  ).rows[0].token;
  assert.match(code, /^\d{6}$/);
  await page.getByLabel("Digit 1").fill(code === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("alert").waitFor();
  for (const [i, digit] of [...code].entries())
    await page.getByLabel(`Digit ${i + 1}`).fill(digit);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Choose a new password" }).waitFor();
  await page.getByLabel("New password", { exact: true }).fill("Changed-password-123");
  await page.getByLabel("Confirm new password", { exact: true }).fill("Changed-password-123");
  await page.getByRole("button", { name: "Update password" }).click();
  await page.getByText("Password updated. Log in with your new password.").waitFor();
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Changed-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  // Operator-issued recovery links (src/reset-link.mjs) still work.
  await page.context().clearCookies();
  const link = "operator-" + randomUUID() + randomUUID();
  await db.query(
    "INSERT INTO password_resets(token_hash,user_id,expires_at) SELECT $1,id,now()+interval '30 minutes' FROM users WHERE email=$2",
    [digest(link), email],
  );
  await page.goto(origin + "/reset#" + link);
  await page.getByLabel("New password").fill("Linked-password-123");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await page.getByText("Password updated. You can sign in.").waitFor();
  assert.equal(new URL(page.url()).hash, "");
  await page.context().clearCookies();
  await page.goto(origin + "/sign-in");
  await page.screenshot({ path: "/tmp/plp-auth-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: mobile/desktop sign-in, emailed-code recovery, operator reset link, new-password login and no horizontal overflow",
  );
} finally {
  await browser?.close();
  vite.kill("SIGTERM");
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await db.end();
}
