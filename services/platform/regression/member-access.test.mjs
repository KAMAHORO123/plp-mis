import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connectDatabase } from '../src/db.mjs';
import { createServer } from '../src/server.mjs';
import { digest, sessionToken, sessionJwt } from '../src/auth.mjs';
const database = process.env.TEST_DATABASE_URL;
if (database) {
  if (!new URL(database).pathname.endsWith('_test')) throw Error('Dedicated test DB required');
  process.env.DATABASE_URL = database;
}
test('member materials, mentor school boundaries and reversible leader learning stages', { skip: !database }, async () => {
  const db = connectDatabase(), origin = 'http://localhost:5173';
  const server = createServer({ db, origin, secure: false, google: null });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const users = [], schools = [], records = [];
  async function account(role, school = null) {
    const id = randomUUID(), token = sessionToken(); users.push(id);
    await db.query("INSERT INTO users(id,email,name,password_hash,role,status,school_id,email_verified_at) VALUES($1,$2,'Access tester','unused',$3,'approved',$4,now())", [id, `${id}@example.test`, role, school]);
    await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [digest(token), id]);
    return { id, cookie: `plp_session=${sessionJwt(id, token)}` };
  }
  async function call(user, path, method = 'GET', body) {
    const r = await fetch(base + path, { method, headers: { Origin: origin, Cookie: user.cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, data: await r.json() };
  }
  try {
    for (let i = 0; i < 2; i++) { const id = randomUUID(); schools.push(id); await db.query("INSERT INTO schools(id,name,district) VALUES($1,$2,'Kigali')", [id, `Test school ${id}`]); }
    const admin = await account('admin'), leader = await account('leader', schools[0]), mentor = await account('mentor', schools[0]), unassigned = await account('mentor'), member = await account('member');
    for (const [kind, school, data] of [['members', schools[0], { title: 'Our student' }], ['members', schools[1], { title: 'Other student' }], ['materials', null, { title: 'Shared learning', school_ids: [] }], ['materials', null, { title: 'Private learning', school_ids: [schools[1]] }]]) {
      const id = randomUUID(); records.push(id);
      await db.query('INSERT INTO records(id,kind,owner_id,school_id,data) VALUES($1,$2,$3,$4,$5)', [id, kind, admin.id, school, data]);
    }
    const shared = records[2];
    // Learning materials are for club leaders only (administrators manage them).
    const materials = await call(leader, '/records/materials'); assert.equal(materials.status, 200);
    assert.ok(materials.data.some(r => r.id === shared)); assert.ok(!materials.data.some(r => r.id === records[3]));
    for (const user of [member, mentor, unassigned]) {
      const response = await call(user, '/records/materials'); assert.equal(response.status, 200);
      assert.equal(response.data.length, 0);
    }
    assert.equal((await call(mentor, '/material-completions')).status, 403);
    const register = await call(mentor, '/records/members'); assert.equal(register.status, 200);
    assert.ok(register.data.some(r => r.id === records[0])); assert.ok(!register.data.some(r => r.id === records[1]));
    assert.equal((await call(unassigned, '/school-members')).status, 403);
    assert.equal((await call(mentor, '/school-members')).status, 200);
    assert.equal((await call(mentor, '/records/members', 'POST', { title: 'Unauthorized student' })).status, 403);
    for (const stage of ['In progress', 'Completed', 'Not started']) {
      assert.equal((await call(leader, `/materials/${shared}/completion`, 'PUT', { school_id: schools[0], stage })).status, 200);
      const progress = await call(leader, '/material-completions');
      assert.equal(progress.data.find(r => r.material_id === shared).stage, stage);
      const report = await call(mentor, '/reports');
      assert.equal(report.data.length, 1);
      assert.equal(report.data[0].completed_materials, stage === 'Completed' ? 1 : 0);
    }
    assert.equal((await call(leader, `/materials/${shared}/completion`, 'PUT', { school_id: schools[1], stage: 'Completed' })).status, 403);
    assert.equal((await call(mentor, `/materials/${shared}/completion`, 'PUT', { school_id: schools[0], stage: 'Completed' })).status, 403);
    assert.equal((await call(member, `/materials/${shared}/completion`, 'PUT', { school_id: schools[0], stage: 'Completed' })).status, 403);
    assert.equal((await call(leader, `/materials/${shared}/completion`, 'PUT', { school_id: schools[0], stage: 'Invalid' })).status, 400);
  } finally {
    try {
    await db.query('DELETE FROM material_completions WHERE material_id=ANY($1::uuid[])', [records]);
    await db.query('DELETE FROM records WHERE id=ANY($1::uuid[])', [records]);
    await db.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])', [users]);
    await db.query('UPDATE audit_log SET actor_id=NULL WHERE actor_id=ANY($1::uuid[])', [users]);
    await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [users]);
    await db.query('DELETE FROM schools WHERE id=ANY($1::uuid[])', [schools]);
    } finally { await new Promise(resolve => server.close(resolve)); await db.end(); }
  }
});
