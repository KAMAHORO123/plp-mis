import { test } from 'node:test';
import assert from 'node:assert/strict';
import { removeSeededAccounts } from '../src/features/hub/account-cleanup.ts';

test('removes legacy accounts and their data, preserves signup accounts, and is repeatable', () => {
  const real = { id: 'real-account', email: 'realmember@gmail.com', membership: 'Pending' };
  const state = {
    profiles: [{ id: 'demo-0' }, { id: 'preview-admin' }, { id: 'old-linda', email: ' KamahoroLinda@gmail.com ' }, { id: 'fake', email: 'someone@example.com' }, real], currentId: 'demo-0',
    sessions: [{ memberId: 'real-account', mentorId: 'preview-trainer' }],
    invitations: [{ createdBy: 'preview-admin' }, { createdBy: 'real-account', usedBy: 'demo-0' }],
    activities: [{ authorId: 'demo-3', attendees: [] }, { authorId: 'real-account', attendees: ['demo-0', 'real-account'] }],
    courses: [{ ownerId: 'preview-trainer' }, { ownerId: 'real-account' }],
    schoolRecords: { members: [{ id: 'school-member-0' }, { id: 'real-student' }, { id: 'old-student', email: 'kamahorolinda@gmail.com' }], requests: [{ id: 'PLP-DEMO-WELCOME' }] },
    operations: { activities: [{ authorId: 'demo-3' }], requests: [{ memberId: 'demo-0' }], completions: [{ by: 'preview-coordinator' }] },
  };
  for (const key of ['membershipRequests', 'enrollments', 'certificates', 'credits', 'applications', 'saved', 'proofs', 'posts', 'projects', 'redemptions', 'outcomes']) state[key] = [{ memberId: 'demo-0' }, { memberId: 'real-account' }];
  removeSeededAccounts(state);
  assert.deepEqual(state.profiles, [real]);
  assert.equal(state.currentId, '');
  assert.deepEqual(state.activities[0].attendees, ['real-account']);
  assert.deepEqual(state.schoolRecords.members, [{ id: 'real-student' }]);
  assert.equal(state.sessions.length, 0);
  assert.deepEqual(state.invitations, [{ createdBy: 'real-account' }]);
  assert.deepEqual(state.courses, [{}, { ownerId: 'real-account' }]);
  assert.deepEqual(state.credits, [{ memberId: 'real-account' }]);
  const cleaned = structuredClone(state);
  assert.deepEqual(removeSeededAccounts(state), cleaned);
  state.profiles = []; state.currentId = '';
  assert.equal(removeSeededAccounts(state).profiles.length, 0);
});
