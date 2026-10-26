const testDatabase = process.env.TEST_DATABASE_URL;
if (testDatabase) {
  if (!new URL(testDatabase).pathname.endsWith("_test"))
    throw Error("Use a dedicated database ending in _test");
  process.env.DATABASE_URL = testDatabase;
}
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { connectDatabase } from "../src/db.mjs";
import { createServer } from "../src/server.mjs";
import {digest,sessionToken,sessionJwt} from "../src/auth.mjs";
test(
  "private files, publication permissions and protected deletion",
  { skip: !testDatabase },
  async () => {
    const db = connectDatabase(),
      directory = await mkdtemp(path.join(tmpdir(), "plp-files-test-")),
      origin = "https://files.example.test",
      server = createServer({ db, origin, uploadDirectory: directory });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const users = [];
    for (const role of ["member", "member", "admin"]) {
      const id = randomUUID(),
        token = sessionToken();
      await db.query(
        "INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'File tester','unused',$3,'approved',now())",
        [id, id + "@example.test", role],
      );
      await db.query(
        "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
        [digest(token), id],
      );
      users.push({ id, cookie: "plp_session=" + sessionJwt(id, token) });
    }
    const call = (p, method = "GET", body, cookie = users[0].cookie) =>
      fetch(base + p, {
        method,
        headers: {
          Origin: origin,
          Cookie: cookie,
          "Content-Type":
            typeof body === "string" ? "application/json" : "application/pdf",
          "X-File-Name": "test.pdf",
        },
        body,
      });
    try {
      assert.equal(
        (await call("/files", "POST", Buffer.from("not a PDF"))).status,
        400,
      );
      const data = Buffer.from("%PDF-1.7\nfile-access-test");
      const uploaded = await call("/files", "POST", data);
      assert.equal(uploaded.status, 201);
      const file = await uploaded.json();
      assert.equal(
        (await call("/files/" + file.id, "GET", undefined, users[1].cookie))
          .status,
        404,
      );
      assert.equal(
        (await call("/files/" + file.id, "GET", undefined, "")).status,
        401,
      );
      assert.deepEqual(
        Buffer.from(await (await call("/files/" + file.id)).arrayBuffer()),
        data,
      );
      assert.equal(
        (
          await call(
            "/records/proofs",
            "POST",
            JSON.stringify({
              title: "Forged attachment",
              attachments: [file.id],
            }),
            users[1].cookie,
          )
        ).status,
        400,
      );
      const record = await call(
        "/records/proofs",
        "POST",
        JSON.stringify({ title: "Private evidence", category: "alx-ai", attachments: [file.id] }),
      );
      assert.equal(record.status, 201);
      const proof = await record.json();
      // ALX certificates are recognised on upload, without waiting for an administrator.
      assert.equal((await (await call("/records/proofs/" + proof.id, "GET")).json()).data.status, "approved");
      assert.equal((await call("/files/" + file.id, "DELETE")).status, 409);
      assert.equal(
        (await call("/files/" + file.id, "GET", undefined, users[1].cookie))
          .status,
        404,
      );
      assert.equal(
        (
          await call(
            "/records/materials",
            "POST",
            JSON.stringify({
              title: "Shared resource",
              attachments: [file.id],
            }),
            users[2].cookie,
          )
        ).status,
        201,
      );
      assert.equal(
        (await call("/files/" + file.id, "GET", undefined, users[1].cookie))
          .status,
        200,
      );
      await call("/records/proofs/" + proof.id, "DELETE");
    } finally {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
      await db.end();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
