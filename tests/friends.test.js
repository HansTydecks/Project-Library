import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFriends, FRIENDS } from '../src/npc/friends.js';

function fakeProgress() {
  const s = new Set();
  return { friend: (id) => (s.has(id) ? false : (s.add(id), true)), has: (k, id) => k === 'friends' && s.has(id) };
}

test('jede Figur hat Name, Raum und mindestens einen Spruch; IDs sind eindeutig', () => {
  const ids = new Set();
  for (const f of FRIENDS) {
    assert.ok(f.name && f.room && f.lines.length, f.id);
    assert.ok(!ids.has(f.id), `doppelt: ${f.id}`);
    ids.add(f.id);
  }
});

test('meet merkt Bekanntschaften nur einmal', () => {
  const fr = createFriends({ progress: fakeProgress() });
  assert.equal(fr.meet('puschel'), true);
  assert.equal(fr.meet('puschel'), false);
  assert.equal(fr.meet('gibtsnicht'), false);
  assert.equal(fr.count(), 1);
  assert.equal(fr.list().find((f) => f.id === 'puschel').found, true);
});

test('next liefert die Sprüche der Reihe nach und beginnt dann von vorn', () => {
  const fr = createFriends({ progress: fakeProgress() });
  const lines = FRIENDS.find((f) => f.id === 'gustav').lines;
  const got = lines.map(() => fr.next('gustav'));
  assert.deepEqual(got, lines);
  assert.equal(fr.next('gustav'), lines[0]);
});
