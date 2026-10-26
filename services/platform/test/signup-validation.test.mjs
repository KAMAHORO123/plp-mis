import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.mjs";

test("signup rejects malformed emails and refuses registration when mail is unavailable", async () => {
  const db = { async query(sql) {
    assert.match(sql, /^INSERT INTO auth_limits/);
    return { rows: [{ count: 1 }] };
  } };
  const origin = "http://localhost:5173";
  const server = createServer({ db, origin, google: null, recoveryEnabled: false });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    for (const [email, expected] of [["not-an-email", 400], ["member@example.com", 503]]) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/auth/register`, {
        method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Member", email, password: "A-long-test-password-42" }),
      });
      assert.equal(response.status, expected);
      if (expected === 503) assert.match((await response.json()).error, /Email delivery/);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
