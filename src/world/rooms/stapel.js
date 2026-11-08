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
  atmosphere: { skyHidden: true, fog: '#0e0b08', density: 0.07, ambient: 0.6, ambientColor: '#ffcf90', moon: 0 },
});
