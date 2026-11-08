import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignProjects, CART } from '../src/world/placement.js';

const shelves = [
  { id: 'apps', room: 'lesesaal', capacity: 10 },
  { id: 'spiele', room: 'lesesaal', capacity: 1 },
  { id: 'blog', room: 'archiv', capacity: 10 },
  { id: '_deko', room: 'lesesaal', capacity: 10 },
  { id: CART, room: 'foyer', capacity: 10 },
  { id: '__neu', room: 'foyer', capacity: 2, mode: 'newest' },
];

test('Projekt landet im angegebenen Regal', () => {
  const { placedIn } = assignProjects([{ id: 'a', title: 'A', room: 'lesesaal', shelf: 'apps' }], shelves);
  assert.equal(placedIn.get('a'), 'lesesaal/apps');
});

test('Ohne Regal → Sortierwagen', () => {
  const { placedIn } = assignProjects([{ id: 'b', title: 'B' }], shelves);
  assert.equal(placedIn.get('b'), `foyer/${CART}`);
});

test('Unbekanntes Regal → Sortierwagen', () => {
  const { placedIn } = assignProjects([{ id: 'c', title: 'C', shelf: 'gibtsnicht' }], shelves);
  assert.equal(placedIn.get('c'), `foyer/${CART}`);
});

test('Blog-Einträge gehen automatisch ins Archiv', () => {
  const { placedIn } = assignProjects([{ id: 'd', title: 'D', kind: 'blog' }], shelves);
  assert.equal(placedIn.get('d'), 'archiv/blog');
});

test('Volles Regal läuft über in den Sortierwagen', () => {
  const { placedIn } = assignProjects([
    { id: 'e1', title: 'E1', shelf: 'spiele' },
    { id: 'e2', title: 'E2', shelf: 'spiele' },
  ], shelves);
  assert.equal(placedIn.get('e1'), 'lesesaal/spiele');
  assert.equal(placedIn.get('e2'), `foyer/${CART}`);
});

test('Nur Raum angegeben → ein echtes Regal im Raum (nie Deko)', () => {
  const { placedIn } = assignProjects([{ id: 'f', title: 'F', room: 'lesesaal' }], shelves);
  assert.ok(['lesesaal/apps', 'lesesaal/spiele'].includes(placedIn.get('f')));
});

test('Neuerscheinungen zeigen die neuesten Einträge', () => {
  const { byShelf } = assignProjects([
    { id: 'alt', title: 'Alt', year: 2020 },
    { id: 'neu', title: 'Neu', added: '2026-11-01' },
    { id: 'mittel', title: 'Mittel', year: 2024 },
  ], shelves);
  assert.deepEqual(byShelf.get('foyer/__neu').map((p) => p.id), ['neu', 'mittel']);
});
