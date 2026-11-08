import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSequenceWatcher, season, createRepeatCounter } from '../src/core/eastereggs.js';

test('Konami-Code wird erkannt, auch nach Fehleingaben', () => {
  const hits = [];
  const w = createSequenceWatcher((n) => hits.push(n));
  for (const c of ['KeyX', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']) w.push(c);
  assert.deepEqual(hits, ['konami']);
});

test('Jahreszeiten nach Monat, Override gewinnt', () => {
  assert.equal(season(new Date(2026, 11, 24)), 'winter');
  assert.equal(season(new Date(2026, 9, 31)), 'autumn');
  assert.equal(season(new Date(2026, 6, 1)), 'none');
  assert.equal(season(new Date(2026, 6, 1), 'winter'), 'winter');
});

test('Wiederholungszähler löst nach n Mal im Zeitfenster aus', () => {
  const c = createRepeatCounter(3, 10);
  assert.equal(c(0), false); assert.equal(c(1), false); assert.equal(c(2), true);
  assert.equal(c(30), false);
});
