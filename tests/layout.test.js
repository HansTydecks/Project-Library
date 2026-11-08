import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layout, cellKey, levelAt, FLOOR_H } from '../src/world/world.js';

const defs = [
  { id: 'a', cell: [0, 0] },
  { id: 'b', cell: [1, 0] },
  { id: 'turm', cell: [2, 0], levels: [0, 1] },
  { id: 'oben', cell: [1, 0], level: 1 },
  { id: 'geheim', cell: [3, 0], secretDoors: ['turm'] },
];

test('Belegung: Ebene 0 ohne Suffix, höhere Ebenen mit', () => {
  const { occ } = layout(defs);
  assert.equal(occ.get(cellKey(1, 0)), 'b');
  assert.equal(occ.get(cellKey(1, 0, 1)), 'oben');
  assert.equal(occ.get('2,0'), 'turm');
  assert.equal(occ.get('2,0,1'), 'turm');
});

test('Türen nur innerhalb derselben Ebene; der Turm verbindet die Ebenen', () => {
  const { doors } = layout(defs);
  const pair = (d) => [d.a, d.b].sort().join('-') + '@' + d.level;
  const list = doors.map(pair).sort();
  assert.deepEqual(list, ['a-b@0', 'b-turm@0', 'geheim-turm@0', 'oben-turm@1']);
  const up = doors.find((d) => d.level === 1);
  assert.equal(up.y, FLOOR_H);
  assert.equal(doors.find((d) => d.a === 'geheim' || d.b === 'geheim').secret, true);
});

test('levelAt ordnet Fußhöhen den Etagen zu', () => {
  assert.equal(levelAt(0), 0);
  assert.equal(levelAt(10), 0);
  assert.equal(levelAt(FLOOR_H), 1);
  assert.equal(levelAt(FLOOR_H * 2 + 3), 2);
});
