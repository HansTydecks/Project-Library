import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLibrarian, timeOfDay } from '../src/npc/librarian.js';

const lib = createLibrarian({
  projects: [{ id: 'p1', title: 'Pixel-Garten', tags: ['spiel'], description: 'Blumen' }],
  ideas: [{ id: 'i1', title: 'Traumtagebuch', text: 'Träume malen' }],
  rooms: [{ id: 'garten', name: 'Mondgarten', keywords: ['garten', 'brunnen'] }, { id: 'foyer', name: 'Foyer', keywords: ['eingang'] }],
  random: () => 0,
});

test('findet Projekte per Titel (unscharf)', () => {
  const r = lib.ask('pixl garten');
  assert.equal(r.results[0].id, 'p1');
});

test('findet Räume per Stichwort', () => {
  const r = lib.ask('brunnen');
  assert.equal(r.results[0].type, 'room');
  assert.equal(r.results[0].id, 'garten');
});

test('findet Ideen', () => {
  assert.equal(lib.ask('traum').results[0].id, 'i1');
});

test('Hilfe & Zufall & Ausgang', () => {
  assert.match(lib.ask('hilfe').text, /W A S D/);
  assert.equal(lib.ask('überrasch mich').results.length, 1);
  assert.equal(lib.ask('wo ist der ausgang').results[0].id, 'foyer');
});

test('Unbekanntes → freundliche Absage', () => {
  const r = lib.ask('xyzzyqq');
  assert.equal(r.results.length, 0);
  assert.ok(r.text.length > 10);
});

test('Tageszeiten', () => {
  assert.equal(timeOfDay(8), 'morning');
  assert.equal(timeOfDay(14), 'day');
  assert.equal(timeOfDay(20), 'evening');
  assert.equal(timeOfDay(2), 'night');
});
