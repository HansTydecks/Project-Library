import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/core/rng.js';
import {
  shellSwaps, followBall, createSequenceGame, createMemory, turnGear, gearsSolved, scrambleGears,
  createConstellation, ballStep, inBasket, throughRing, formatTime, pickCatch,
} from '../src/core/minigames.js';

test('Hütchenspiel: Vertauschungen sind gültig und die Kugel wandert mit', () => {
  const sw = shellSwaps(mulberry32(1), 20);
  assert.equal(sw.length, 20);
  for (const [a, b] of sw) { assert.notEqual(a, b); assert.ok(a >= 0 && a < 3 && b >= 0 && b < 3); }
  assert.equal(followBall(0, [[0, 1], [1, 2]]), 2);
  assert.equal(followBall(1, [[0, 2]]), 1);
});

test('Folgenspiel: richtig, falsch, Runde komplett', () => {
  const g = createSequenceGame(mulberry32(2), ['a', 'b', 'c']);
  const s1 = g.grow();
  assert.equal(g.input(s1[0]), 'round');
  const s2 = g.grow();
  assert.equal(s2.length, 2);
  assert.equal(g.input(s2[0]), 'ok');
  assert.equal(g.input(s2[1] === 'a' ? 'b' : 'a'), 'wrong');
  assert.equal(g.input(s2[0]), 'ok');
  assert.equal(g.input(s2[1]), 'round');
});

test('Memory: Paare finden, Fehlversuche zählen', () => {
  const m = createMemory(mulberry32(3), 4);
  assert.equal(m.deck.length, 8);
  const first = m.deck[0];
  const pair = m.deck.findIndex((v, i) => i > 0 && v === first);
  const wrong = m.deck.findIndex((v) => v !== first);
  assert.equal(m.flip(0).type, 'first');
  assert.equal(m.flip(0).type, 'invalid');
  assert.equal(m.flip(wrong).type, 'miss');
  m.flip(0);
  assert.equal(m.flip(pair).type, 'match');
  assert.equal(m.moves, 2);
  // Rest lösen
  for (let i = 0; i < m.deck.length; i++) for (let j = i + 1; j < m.deck.length; j++) {
    if (!m.isSolved(i) && !m.isSolved(j) && m.deck[i] === m.deck[j]) { m.flip(i); m.flip(j); }
  }
  assert.ok(m.done);
});

test('Zahnräder: Drehen wirkt auf Nachbarn, Mischung ist lösbar', () => {
  const links = [[1], [0, 2], [1, 3], [2]];
  assert.deepEqual(turnGear([0, 0, 0, 0], 1, links), [1, 1, 1, 0]);
  const s = scrambleGears(mulberry32(4), links, 8);
  assert.ok(!gearsSolved(s));
  // Brute force: Lösung in ≤ 4^4 Kombinationen von Drehzahlen
  let found = false;
  for (let n = 0; n < 256 && !found; n++) {
    let t = s.slice();
    for (let g = 0; g < 4; g++) for (let k = 0; k < ((n >> (g * 2)) & 3); k++) t = turnGear(t, g, links);
    if (gearsSolved(t)) found = true;
  }
  assert.ok(found);
});

test('Sternbild: Kanten in beliebiger Richtung, Stift neu ansetzen', () => {
  const c = createConstellation([[0, 1], [1, 2], [2, 3]]);
  assert.equal(c.click(2), 'start');
  assert.equal(c.click(1), 'line');
  assert.equal(c.click(3), 'jump');
  assert.equal(c.click(2), 'line');
  assert.equal(c.click(2), 'same');
  c.click(0);
  assert.equal(c.click(1), 'done');
  assert.ok(c.done);
});

test('Wurf: Parabel fällt in den Korb', () => {
  const b = { x: 0, y: 1.5, z: 0, vx: 0, vy: 3, vz: 3 };
  const basket = { x: 0, y: 0.5, z: 2.2, r: 0.35 };
  let hit = false;
  for (let i = 0; i < 300 && b.y > 0; i++) { const py = b.y; ballStep(b, 1 / 60); if (inBasket(py, b, basket)) { hit = true; break; } }
  assert.ok(hit);
});

test('Ringe, Zeitformat, Fangtabelle', () => {
  assert.ok(throughRing({ x: 0, y: 1, z: 0 }, [0, 1.5, 0], 1));
  assert.ok(!throughRing({ x: 2, y: 1, z: 0 }, [0, 1, 0], 1));
  assert.equal(formatTime(12.34), '12,3 s');
  assert.equal(formatTime(75), '1:15 min');
  const t = [{ id: 'a', w: 1 }, { id: 'b', w: 3 }];
  assert.equal(pickCatch(t, 0.1).id, 'a');
  assert.equal(pickCatch(t, 0.5).id, 'b');
});
