import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "../src/db.mjs";
import { createServer } from "../src/server.mjs";
import {digest,sessionToken,sessionJwt} from "../src/auth.mjs";
const testDatabase = process.env.TEST_DATABASE_URL;
if (testDatabase) {
  if (!new URL(testDatabase).pathname.endsWith("_test"))
    throw Error("Dedicated test database required");
  process.env.DATABASE_URL = testDatabase;
}
test(
  "school certificate correction, cross-school access and idempotent batch issuance",
  { skip: !testDatabase },
  async () => {
    const db = connectDatabase(),
      origin = "https://school.example.test",
      server = createServer({ db, origin });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`,
      school = randomUUID(),
      other = randomUUID();
    const call = async (p, cookie, method = "GET", body) => {
      const r = await fetch(base + p, {
        method,
        headers: {
          Origin: origin,
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: r.status, body: await r.json() };
    };
    try {
      await db.query(
        "INSERT INTO schools(id,name) VALUES($1,'School One'),($2,'School Two')",
        [school, other],
      );
      const actors = [];
      for (const [role, schoolId] of [
        ["leader", school],
        ["leader", other],
        ["admin", null],
        ["member", school],
      ]) {
        const id = randomUUID(),
          token = sessionToken();
        await db.query(
          "INSERT INTO users(id,email,name,password_hash,role,status,school_id,email_verified_at) VALUES($1,$2,'School tester','unused',$3,'approved',$4,now())",
          [id, id + "@example.test", role, schoolId],
        );
        await db.query(
          "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
          [digest(token), id],
        );
        actors.push({ id, cookie: "plp_session=" + sessionJwt(id, token) });
      }
      const [leader, outsider, admin, member] = actors;
      const entry = await call("/records/members", leader.cookie, "POST", {
        title: "School register member",
        email: member.id + "@example.test",
      });
      assert.equal(entry.status, 201);
      assert.equal(
        (await call("/certificate-requests", member.cookie)).status,
        403,
      );
      assert.equal(
        (
          await call("/certificate-requests", outsider.cookie, "POST", {
            school_id: school,
            member_ids: [entry.body.id],
          })
        ).status,
        403,
      );
      const wording = { title: "Certificate of Leadership", programme: "Peace Club Leadership 2026", citation: "For leading weekly peace dialogues with dedication.", period_from: "2026-01-10", period_to: "2026-07-30", roles: { [entry.body.id]: "Club President" } };
      // Wording is checked: a term must end after it starts, and text cannot contain markup.
      assert.equal((await call("/certificate-requests", leader.cookie, "POST", { school_id: school, member_ids: [entry.body.id], ...wording, period_from: "2026-08-01" })).status, 400);
      assert.equal((await call("/certificate-requests", leader.cookie, "POST", { school_id: school, member_ids: [entry.body.id], ...wording, title: "<b>Hacked</b>" })).status, 400);
      const request = await call("/certificate-requests", leader.cookie, "POST", { school_id: school, member_ids: [entry.body.id], ...wording });
      assert.equal(request.status, 201);
      const id = request.body.id;
      // School certificates wait for an administrator's approval.
      assert.equal(request.body.status, "submitted");
      const stored = (await call("/certificate-requests", leader.cookie)).body.find((r) => r.id === id);
      assert.deepEqual([stored.title, stored.programme, stored.period_from, stored.members[0].role], ["Certificate of Leadership", "Peace Club Leadership 2026", "2026-01-10", "Club President"]);
      const twice = await call("/certificate-requests", leader.cookie, "POST", { school_id: school, member_ids: [entry.body.id] });
      assert.equal(twice.status, 409);
      assert.match(twice.body.error, /waiting for approval/);
      assert.equal((await call("/certificate-requests/" + id + "/review", leader.cookie, "POST", { decision: "issued" })).status, 403);
      assert.equal((await call("/certificate-requests/" + id + "/review", admin.cookie, "POST", { decision: "returned", note: "Please confirm the spelling." })).status, 200);
      assert.equal((await call("/certificate-requests/" + id, outsider.cookie, "PUT", { member_ids: [entry.body.id] })).status, 404);
      assert.equal((await call("/certificate-requests/" + id, leader.cookie, "PUT", { member_ids: [entry.body.id], roles: wording.roles, citation: "For leading weekly peace dialogues." })).status, 200);
      assert.equal((await call("/certificate-requests", leader.cookie)).body.find((r) => r.id === id).status, "corrected");
      // The administrator can polish the wording while approving.
      assert.equal((await call("/certificate-requests/" + id + "/review", admin.cookie, "POST", { decision: "issued", citation: "For leading weekly peace dialogues with courage and care." })).status, 200);
      assert.equal((await call("/certificate-requests/" + id + "/review", admin.cookie, "POST", { decision: "issued" })).status, 409);
      const again = await call("/certificate-requests", leader.cookie, "POST", { school_id: school, member_ids: [entry.body.id] });
      assert.equal(again.status, 409);
      assert.match(again.body.error, /already has a membership certificate/);
      // Each person sees only their own certificate: the recipient, not the club leader who requested it.
      assert.equal((await call("/certificates", leader.cookie)).body.length, 0);
      assert.equal((await call("/certificates", admin.cookie)).body.length, 0);
      const certs = (await call("/certificates", member.cookie)).body;
      assert.equal(certs.length, 1);
      assert.equal(certs[0].recipient, "School register member");
      assert.equal(certs[0].kind, "school");
      assert.equal(
        (await call("/certificates", outsider.cookie)).body.length,
        0,
      );
      const verified = (await call("/public/certificates/" + certs[0].id, "")).body;
      assert.deepEqual([verified.title, verified.programme, verified.citation, verified.role, verified.period_to], ["Certificate of Leadership", "Peace Club Leadership 2026", "For leading weekly peace dialogues with courage and care.", "Club President", "2026-07-30"]);

      const material = await call("/records/materials", admin.cookie, "POST", {
        title: "School learning guide",
        school_ids: [school],
      });
      assert.equal(material.status, 201);
      assert.equal(
        (await call("/records/materials/" + material.body.id, outsider.cookie))
          .status,
        404,
      );
      assert.equal(
        (
          await call(
            "/materials/" + material.body.id + "/completion",
            outsider.cookie,
            "PUT",
            { school_id: other },
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await call(
            "/materials/" + material.body.id + "/completion",
            leader.cookie,
            "PUT",
            { school_id: school },
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await call(
            "/materials/" + material.body.id + "/completion",
            leader.cookie,
            "PUT",
            { school_id: school },
          )
        ).status,
        200,
      );
      assert.equal(
        (await call("/material-completions", leader.cookie)).body.filter(
          (r) => r.material_id === material.body.id,
        ).length,
        1,
      );
      const event = await call("/records/events", leader.cookie, "POST", {
        title: "Peace volunteering",
        date: "2026-10-12",
        activity_type: "Volunteering",
        description: "Students volunteered at the health centre.",
      });
      assert.equal(event.status, 201);
      assert.equal(
        (
          await call(
            "/events/" + event.body.id + "/attendance",
            leader.cookie,
            "PUT",
            { member_ids: [member.id], register_member_ids: [entry.body.id] },
          )
        ).status,
        200,
      );
      const report = {
        report: "Members worked together to support a peaceful community.",
      };
      assert.equal(
        (
          await call(
            "/events/" + event.body.id + "/report",
            leader.cookie,
            "POST",
            report,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await call(
            "/events/" + event.body.id + "/report",
            leader.cookie,
            "POST",
            report,
          )
        ).status,
        200,
      );
      const credits = (await call("/credits", member.cookie)).body;
      assert.equal(credits.length, 1);
      assert.equal(credits[0].amount, 20);
      assert.equal((await call("/reports", leader.cookie)).body.length, 1);
      assert.equal(
        (await call("/reports", leader.cookie)).body[0].completed_materials,
        1,
      );
    } finally {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
      await db.end();
    }
  },
);
