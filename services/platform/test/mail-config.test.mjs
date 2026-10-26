import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnvironment } from "../src/environment.mjs";
import {
  missingMailSettings,
  createMailTransport,
} from "../src/mail-config.mjs";
test("private environment loading preserves shell precedence and quoted passwords", () => {
  const dir = mkdtempSync(join(tmpdir(), "plp-env-"));
  try {
    const file = join(dir, ".env");
    writeFileSync(
      file,
      'SMTP_USER="private-user"\nSMTP_PASSWORD="has#symbols"\nSMTP_PORT=465\n',
    );
    const env = { SMTP_USER: "shell-user" };
    loadEnvironment([join(dir, "missing"), file], env);
    assert.equal(env.SMTP_USER, "shell-user");
    assert.equal(env.SMTP_PASSWORD, "has#symbols");
    assert.equal(env.SMTP_PORT, "465");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("SMTP requires complete settings and encrypted transport", () => {
  assert.deepEqual(
    missingMailSettings({ SMTP_USER: "x", SMTP_PASSWORD: "y" }),
    ["SMTP_HOST", "MAIL_FROM"],
  );
  const env = {
    SMTP_HOST: "smtp.example.test",
    SMTP_USER: "user",
    SMTP_PASSWORD: "private",
    MAIL_FROM: "mail@example.test",
  };
  for (const port of [465, 587]) {
    const transport = createMailTransport({ ...env, SMTP_PORT: String(port) });
    assert.equal(transport.options.secure, port === 465);
    assert.equal(transport.options.requireTLS, port !== 465);
    transport.close();
  }
  assert.throws(
    () => createMailTransport({ ...env, SMTP_PORT: "invalid" }),
    /SMTP_PORT/,
  );
});
test("SMTP greets relays with the sender's domain unless overridden", () => {
  const env = {
    SMTP_HOST: "smtp-relay.example.test",
    SMTP_USER: "user",
    SMTP_PASSWORD: "private",
    MAIL_FROM: "PLP <info@peaceloveproclaimers.org>",
  };
  assert.equal(createMailTransport(env).options.name, "peaceloveproclaimers.org");
  assert.equal(
    createMailTransport({ ...env, SMTP_HELO_NAME: "hub.example.test" }).options.name,
    "hub.example.test",
  );
});
test("SMTP allows an IP-authorised relay without credentials, but not half a login", () => {
  const relay = { SMTP_HOST: "smtp-relay.example.test", MAIL_FROM: "info@example.test" };
  assert.deepEqual(missingMailSettings(relay), []);
  assert.equal(createMailTransport(relay).options.auth, undefined);
  assert.deepEqual(missingMailSettings({ ...relay, SMTP_USER: "user" }), ["SMTP_PASSWORD"]);
  assert.deepEqual(missingMailSettings({ ...relay, SMTP_PASSWORD: "secret" }), ["SMTP_USER"]);
});
