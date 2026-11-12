import { test } from "node:test";
import assert from "node:assert/strict";
import { canRead, canWrite } from "../src/policy.mjs";
test('all roles share member resources; mentors read only their assigned school register', () => {
  for (const role of ['member', 'mentor', 'trainer', 'leader', 'admin']) {
    const user = { id: 'a', role, status: 'approved', school_id: 'one' };
    // Learning materials are for club leaders and mentors (and administrators).
    assert.equal(canRead(user, { kind: 'materials', data: { school_ids: [] } }), ['leader', 'mentor', 'admin'].includes(role));
    assert.equal(canRead(user, { kind: 'courses', data: { published: true } }), true);
    assert.equal(canWrite(user, 'alx'), true);
  }
  const mentor = { id: 'a', role: 'mentor', status: 'approved', school_id: 'one' };
  const record = { kind: 'members', school_id: 'one', owner_id: 'b', data: {} };
  assert.equal(canRead(mentor, record), true);
  assert.equal(canRead(mentor, { ...record, school_id: 'two' }), false);
  assert.equal(canRead({ ...mentor, school_id: null }, record), false);
  assert.equal(canWrite(mentor, 'members', record), false);
  assert.equal(canRead(mentor, { kind: 'materials', data: { school_ids: ['two'] } }), false);
});
