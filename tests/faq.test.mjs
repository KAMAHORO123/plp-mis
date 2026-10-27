import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFaq } from '../src/features/hub/faq.ts';

for (const [question, topic, language] of [
  ['Nakwiyandikisha muri PLP nte?', 'join', 'rw'],
  ['Ndashaka kuba umunyamuryango', 'join', 'rw'],
  ['Nabona icyemezo nte?', 'certificates', 'rw'],
  ['MWAMPAYE IBYEMEZO?', 'certificates', 'rw'],
  ['Ese abanyeshuri bakeneye konti?', 'students', 'rw'],
  ['Umuhuzabikorwa akora iki?', 'roles', 'rw'],
  ['Nabona certificate nte?', 'certificates', 'rw'],
  ['Muraho, nakwiyandikisha nte?', 'join', 'rw'],
  ['How do I join PLP?', 'join', 'en'],
  ['Download certificate', 'certificates', 'en'],
  ['Navugana na PLP nte?', 'contact', 'rw'],
]) test(question, () => {
  const result = answerFaq(question);
  assert.equal(result.topic, topic);
  assert.equal(result.language, language);
  assert.ok(result.text.length > 20);
});

test('unrelated words do not match substrings', () => {
  assert.equal(answerFaq('This shipping relationship is strange').topic, null);
});
test('unknown Kinyarwanda question gets a Kinyarwanda fallback', () => {
  const answer = answerFaq('Ese ikirere kimeze gite?');
  assert.equal(answer.topic, null);
  assert.equal(answer.language, 'rw');
  assert.match(answer.text, /info@peaceloveproclaimers.org/);
});
test('manual language choice overrides detection', () => {
  assert.equal(answerFaq('How do I join?', 'rw').language, 'rw');
  assert.equal(answerFaq('Nabona icyemezo nte?', 'en').language, 'en');
});
test('ambiguous topics request clarification', () => {
  assert.equal(answerFaq('certificate account').topic, null);
});
test('unrecognized follow-up keeps previous language', () => {
  assert.equal(answerFaq('???', 'auto', 'rw').language, 'rw');
});
