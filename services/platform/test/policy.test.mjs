import { test } from "node:test";
import assert from "node:assert/strict";
import { canRead, canWrite, publicRecord } from "../src/policy.mjs";
test("school boundaries, private evidence and unpublished courses", () => {
  const member = {
    id: "a",
    status: "approved",
    role: "member",
    school_id: "one",
  };
  const leader = { ...member, role: "leader" };
  const trainer = { ...member, role: "trainer" };
  const event = {
    kind: "events",
    owner_id: "b",
    school_id: "two",
    data: { title: "Event" },
  };
  assert.equal(canWrite(leader, "events", event), false);
  assert.equal(canWrite({ ...leader, school_id: null }, "events"), false);
  assert.equal(canWrite(member, "events"), false);
  assert.equal(
    canWrite(leader, "events", { ...event, school_id: "one" }),
    true,
  );
  const privateRecord = { ...event, kind: "proofs" };
  assert.equal(canRead(member, privateRecord), false);
  assert.equal(canWrite(member, "proofs", privateRecord), false);
  const course = {
    ...event,
    kind: "courses",
    data: { published: false, answer: 0 },
  };
  assert.equal(canRead(member, course), false);
  assert.equal(canWrite(trainer, "courses", course), false);
  assert.equal(publicRecord(course, member).data.answer, undefined);
  assert.equal(
    canWrite({ ...member, status: "suspended", role: "admin" }, "events"),
    false,
  );
});
