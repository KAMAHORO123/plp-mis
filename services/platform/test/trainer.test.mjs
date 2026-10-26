import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "../src/db.mjs";
import { createServer } from "../src/server.mjs";
import {sessionToken,digest,sessionJwt} from "../src/auth.mjs";
const database = process.env.TEST_DATABASE_URL;
if (database) {
  if (!new URL(database).pathname.endsWith("_test"))
    throw Error("Dedicated test database required");
  process.env.DATABASE_URL = database;
}
test(
  "admin assignment, trainer ownership, publication and submission review",
  { skip: !database },
  async () => {
    const db = connectDatabase(),
      origin = "https://trainer.example.test",
      server = createServer({ db, origin });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const call = async (p, actor, method = "GET", body) => {
      const r = await fetch(base + p, {
        method,
        headers: {
          Cookie: actor.cookie,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: r.status, body: await r.json() };
    };
    try {
      const actors = [];
      for (const role of ["admin", "trainer", "trainer", "member"]) {
        const id = randomUUID(),
          token = sessionToken();
        await db.query(
          "INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Trainer test','unused',$3,'approved',now())",
          [id, id + "@example.test", role],
        );
        await db.query(
          "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
          [digest(token), id],
        );
        actors.push({ id, cookie: "plp_session=" + sessionJwt(id, token) });
      }
      const [admin, trainer, other, member] = actors;
      // Trainers author courses; administrators cannot create or assign them.
      assert.equal((await call("/course-assignments", admin, "POST", { title: "Assigned peace course", trainer_id: trainer.id })).status, 403);
      assert.equal((await call("/records/courses", admin, "POST", { title: "Admin course", published: false })).status, 403);
      const assigned = await call("/records/courses", trainer, "POST", { title: "Assigned peace course", description: "", published: false });
      assert.equal(assigned.status, 201);
      const id = assigned.body.id;
      assert.equal(
        (await call("/records/courses/" + id, trainer)).body.owner_id,
        trainer.id,
      );
      assert.equal((await call("/records/courses/" + id, other)).status, 404);
      const prepared = {
        title: "Assigned peace course",
        description: "Prepared by trainer",
        published: false,
        lessons: [
          { title: "Listening", content: "Listen to understand others." },
        ],
        question: "Which builds peace?",
        options: ["Respect", "Harm"],
        answer: 0,
      };
      assert.equal(
        (
          await call("/records/courses/" + id, other, "PUT", {
            version: 1,
            data: prepared,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call("/records/courses/" + id, trainer, "PUT", {
            version: 1,
            data: { ...prepared, lessons: [], published: true },
          })
        ).status,
        400,
        "an incomplete course cannot be published",
      );
      assert.equal(
        (
          await call("/records/courses/" + id, trainer, "PUT", {
            version: 1,
            data: prepared,
          })
        ).status,
        200,
      );
      assert.equal((await call("/records/courses/" + id, admin, "PUT", { version: 2, data: { ...prepared, title: "Rewritten by admin" } })).status, 403);
      assert.equal(
        (
          await call("/records/courses/" + id, admin, "PUT", {
            version: 2,
            data: { ...prepared, published: true },
          })
        ).status,
        200,
      );
      // Trainers publish and unpublish their own complete courses without waiting for review.
      assert.equal((await call("/records/courses/" + id, trainer, "PUT", { version: 3, data: { ...prepared, published: false } })).status, 200);
      assert.equal((await call("/records/courses/" + id, trainer, "PUT", { version: 4, data: { ...prepared, published: true, review_state: "approved" } })).status, 200, "the studio's Publish button marks the course approved");
      assert.equal(
        (await call("/records/courses/" + id, member)).body.data.answer,
        undefined,
      );
      assert.equal(
        (
          await call("/records/proofs", member, "POST", {
            title: "Forged review",
            status: "approved",
          })
        ).status,
        403,
      );
      assert.equal((await call("/records/proofs", member, "POST", { title: "No file or programme" })).status, 400);
      const upload = await fetch(`${base}/files`, { method: "POST", headers: { Origin: origin, Cookie: member.cookie, "Content-Type": "application/pdf", "x-file-name": "alx.pdf" }, body: "%PDF-1.4\n%%EOF\n" }).then((r) => r.json());
      const proof = await call("/records/proofs", member, "POST", {
        title: "Learning evidence", category: "alx-ai", attachments: [upload.id],
      });
      assert.equal(proof.status, 201);
      assert.equal(
        (
          // Recognised on upload; an administrator can still revoke a certificate afterwards.
          await call("/records/proofs/" + proof.body.id, admin, "PUT", {
            version: 1,
            data: { ...(await call("/records/proofs/" + proof.body.id, admin)).body.data, status: "rejected", feedback: "This certificate could not be verified." },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call("/records/proofs/" + proof.body.id, member, "PUT", {
            version: 2,
            data: {
              title: "Learning evidence",
              category: "alx-ai",
              attachments: [upload.id],
              description: "Changed",
              status: "approved",
            },
          })
        ).status,
        403,
      );
    } finally {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
      await db.end();
    }
  },
);
