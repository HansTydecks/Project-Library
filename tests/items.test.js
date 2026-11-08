import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createItems, ITEMS } from '../src/state/items.js';

function fakeProgress() {
  const sets = { items: new Set(), itemsUsed: new Set() };
  return { has: (k, id) => sets[k].has(id), mark: (k, id) => sets[k].add(id), remove: (k, id) => sets[k].delete(id) };
}

test('jedes Item hat Name, Icon und Beschreibung', () => {
  for (const [id, it] of Object.entries(ITEMS)) assert.ok(it.name && it.icon && it.desc, id);
});

test('geben, besitzen, benutzen – und Fundstellen bleiben danach leer', () => {
  const events = [];
  const items = createItems({ progress: fakeProgress(), onChange: (e, id) => events.push(`${e}:${id}`) });
  assert.equal(items.give('keks'), true);
  assert.equal(items.give('keks'), false);
  assert.equal(items.has('keks'), true);
  assert.deepEqual(items.list().map((i) => i.id), ['keks']);
  assert.equal(items.take('keks'), true);
  assert.equal(items.has('keks'), false);
  assert.equal(items.used('keks'), true);
  assert.equal(items.give('keks'), false, 'benutzte Items kommen nicht zurück');
  assert.equal(items.give('gibtsnicht'), false);
  assert.deepEqual(events, ['give:keks', 'take:keks']);
});
