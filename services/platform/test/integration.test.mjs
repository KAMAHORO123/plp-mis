const testDatabase = process.env.TEST_DATABASE_URL;
if (testDatabase) {
  if (!new URL(testDatabase).pathname.endsWith("_test"))
    throw Error("Use a dedicated database ending in _test");
  process.env.DATABASE_URL = testDatabase;
}
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "../src/db.mjs";
import { createServer } from "../src/server.mjs";
import {hashPassword,digest,sessionToken,sessionJwt} from "../src/auth.mjs";
test(
  "database auth, authorization, concurrency, learning and public verification",
  { skip: !testDatabase },
  async () => {
    const db = connectDatabase(),
      origin = "http://localhost:5175",
      server = createServer({ db, origin, secure: false, recoveryEnabled: true });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const password = "A-long-test-password-42";
    let adminCookie = "",
      memberCookie = "";
    const call = async (path, { method = "GET", body, cookie = "" } = {}) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return {
        status: response.status,
        body: await response.json(),
        cookie: response.headers.get("set-cookie")?.split(";")[0],
      };
    };
    const tag = randomUUID(),
      adminId = randomUUID(),
      email = `member-${tag}@example.test`;
    try {
      await db.query(
        "INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Admin',$3,'admin','approved',now())",
        [adminId, `admin-${tag}@example.test`, await hashPassword(password)],
      );
      assert.equal(
        (
          await call("/auth/register", {
            method: "POST",
            body: { name: "Member", email, password, role: "admin" },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call("/auth/register", {
            method: "POST",
            body: { name: "Member", email, password },
          })
        ).status,
        202,
      );
      assert.equal(
        (
          await call("/auth/login", {
            method: "POST",
            body: { email, password },
          })
        ).status,
        403,
      );
      adminCookie = (
        await call("/auth/login", {
          method: "POST",
          body: { email: `admin-${tag}@example.test`, password },
        })
      ).cookie;
      const member = (await call("/users", { cookie: adminCookie })).body.find(
        (u) => u.email === email,
      );
      assert.ok(member);
      assert.equal(member.password_hash, undefined);
      assert.equal(
        (
          await call("/users/" + member.id, {
            method: "PATCH",
            cookie: adminCookie,
            body: { role: "member", status: "approved", school_id: null },
          })
        ).status,
        200,
      );
      // Administrative approval alone must not bypass inbox verification.
      assert.equal((await call("/auth/login", { method: "POST", body: { email, password } })).status, 403);
      const code = (await db.query("SELECT token FROM recovery_mail WHERE recipient=$1 AND purpose='verification'", [email])).rows[0].token;
      assert.equal((await call("/auth/verification/confirm", { method: "POST", body: { email, code } })).status, 200);
      memberCookie = (
        await call("/auth/login", { method: "POST", body: { email, password } })
      ).cookie;
      assert.equal(
        (await call("/users", { cookie: memberCookie })).status,
        403,
      );
      assert.equal(
        (
          await call("/records/events", {
            method: "POST",
            cookie: memberCookie,
            body: { title: "Unauthorized" },
          })
        ).status,
        403,
      );
      const course = {
        title: "Peace learning",
        description: "A course",
        published: true,
        lessons: [{ title: "Listen", content: "Listen respectfully." }],
        question: "Which action builds peace?",
        options: ["Listen", "Harm"],
        answer: 0,
      };
      const trainerId = randomUUID(), trainerToken = sessionToken();
      await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Trainer','unused','trainer','approved',now())", [trainerId, trainerId + "@example.test"]);
      await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [digest(trainerToken), trainerId]);
      const created = await call("/records/courses", {
        method: "POST",
        cookie: "plp_session=" + sessionJwt(trainerId, trainerToken),
        body: { ...course, published: false },
      });
      assert.equal(created.status, 201);
      const courseId = created.body.id;
      assert.equal((await call("/records/courses/" + courseId, { method: "PUT", cookie: adminCookie, body: { version: 1, data: course } })).status, 200);
      assert.equal(
        (await call("/records/courses/" + courseId, { cookie: memberCookie }))
          .body.data.answer,
        undefined,
      );
      assert.equal(
        (
          await call("/records/courses/" + courseId, {
            method: "PUT",
            cookie: adminCookie,
            body: { version: 99, data: course },
          })
        ).status,
        409,
      );
      await call("/enrollments", {
        method: "POST",
        cookie: memberCookie,
        body: { course_id: courseId },
      });
      const enrollment = (
        await call("/enrollments", { cookie: memberCookie })
      ).body.find((e) => e.course_id === courseId);
      assert.equal(
        (
          await call(`/enrollments/${enrollment.id}/progress`, {
            method: "POST",
            cookie: memberCookie,
            body: { answer: 0 },
          })
        ).status,
        400,
      );
      await call(`/enrollments/${enrollment.id}/progress`, {
        method: "POST",
        cookie: memberCookie,
        body: {
          lesson: 0,
          assignment:
            "I will listen and help resolve disagreements peacefully.",
          answer: 0,
        },
      });
      const cert = (
        await call("/certificates", { cookie: memberCookie })
      ).body.find((c) => c.programme === "Peace learning");
      assert.ok(cert);
      assert.equal(
        (await call("/credits", { cookie: memberCookie })).body[0].amount,
        50,
      );
      assert.equal(
        (
          await call("/records/courses/" + courseId, {
            method: "PUT",
            cookie: "plp_session=" + sessionJwt(trainerId, trainerToken),
            body: { version: 2, data: { ...course, title: "Changed course" } },
          })
        ).status,
        409,
      );
      await call(`/enrollments/${enrollment.id}/progress`, {
        method: "POST",
        cookie: memberCookie,
        body: { answer: 1 },
      });
      assert.equal(
        (await call("/enrollments", { cookie: memberCookie })).body.find(
          (e) => e.id === enrollment.id,
        ).passed,
        true,
      );
      assert.equal(
        (await call("/certificates", { cookie: memberCookie })).body.length,
        1,
      );
      assert.equal(
        (await call("/certificates/" + cert.id + "/download")).status,
        401,
      );
      if (process.env.CREDENTIAL_URL) {
        const pdf = await fetch(
          base + "/certificates/" + cert.id + "/download",
          { headers: { Cookie: memberCookie } },
        );
        assert.equal(pdf.status, 200);
        assert.equal(
          Buffer.from(await pdf.arrayBuffer())
            .subarray(0, 4)
            .toString(),
          "%PDF",
        );
      }

      assert.equal(
        (await call("/public/certificates/" + cert.id)).body.recipient,
        "Member",
      );
      await call("/certificates/" + cert.id + "/revoke", {
        method: "POST",
        cookie: adminCookie,
        body: { reason: "Test revocation" },
      });
      assert.ok(
        (await call("/public/certificates/" + cert.id)).body.revoked_at,
      );
      assert.equal(
        (
          await fetch(base + "/auth/logout", {
            method: "POST",
            headers: { Cookie: memberCookie, Origin: "https://evil.test" },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call("/certificates/" + cert.id + "/download", {
            cookie: memberCookie,
          })
        ).status,
        409,
      );
      const token = sessionToken();
      await db.query(
        "INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",
        [digest(token), member.id],
      );
      assert.equal(
        (
          await call("/auth/reset", {
            method: "POST",
            body: { token, password: "Replacement-test-password-42" },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call("/auth/reset", {
            method: "POST",
            body: { token, password: "Replacement-test-password-42" },
          })
        ).status,
        400,
      );
      await call("/auth/logout", { method: "POST", cookie: memberCookie });
      assert.equal((await call("/me", { cookie: memberCookie })).status, 401);
    } finally {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
      await db.end();
    }
  },
);
