import { defineRoom } from '../registry.js';

// Eingang zu den Endlosen Stapeln. Der eigentliche Inhalt wird von world/endless/stacks.js
// chunkweise erzeugt – alle Zellen nördlich dieser Reihe gehören zu den Stapeln.
export default defineRoom({
  id: 'stapel',
  name: 'Die Endlosen Stapel',
  description: 'Ein Labyrinth aus Regalen ohne Ende. Hier verirren sich Bücher (und Besucher).',
  keywords: ['endlos', 'stapel', 'labyrinth', 'verirrt', 'verloren', 'tief', 'unendlich', 'liminal'],
  cell: [0, -3],
  endless: true,
  atmosphere: { skyHidden: true, fog: '#2e2038', density: 0.04, ambient: 1.1, ambientColor: '#ffd8c0', moon: 0 },
});
