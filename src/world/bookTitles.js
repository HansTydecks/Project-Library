import { makeRng } from '../core/rng.js';

// Generator für die Titel der namenlosen Füllbücher. Erweitern erwünscht!
const A = [
  'Kleines Handbuch', 'Die Kunst', 'Geheime Geschichte', 'Über die Unmöglichkeit', 'Vom richtigen Umgang',
  'Anleitung', 'Erinnerungen', 'Gesammelte Irrtümer', 'Das große Buch', 'Ein Lexikon', 'Fußnoten',
  'Theorie und Praxis', 'Abhandlung', 'Das vergessene Kapitel', 'Notizen', 'Die leise Wissenschaft',
  'Der vollständige Atlas', 'Bekenntnisse', 'Kurze Einführung', 'Rezepte',
];
const B = [
  'des Teetrinkens bei Mondlicht', 'der flüsternden Treppen', 'vergessener Regenschirme', 'des Staubes',
  'der rückwärts tickenden Uhren', 'kleiner Drachen im Haushalt', 'des Bücherstapelns', 'der Lesezeichen',
  'unsichtbarer Gärten', 'der Kerzenwachskunde', 'für verirrte Bibliotheksbesucher', 'der Fußnoten zu Fußnoten',
  'der Katzen in Regalen', 'der Wolkenkartografie', 'der leeren Seiten', 'des höflichen Spukens',
  'des zweiten Frühstücks', 'der singenden Teekessel', 'endloser Korridore', 'der Ideen, die niemand hatte',
  'des Sternenpolierens', 'magischer Kommaregeln', 'der sprechenden Türen', 'der Quantenstrickerei',
  'des Pixel-Gartenbaus', 'der Tintenfische und Tintenfässer', 'der langsamen Schnecken-Post',
  'für Zauberlehrlinge, die zu spät kamen', 'der Wendeltreppen ohne Ende', 'des Bücherwurms (Band II)',
];
const STANDALONE = [
  'Band 7 von 3', 'Nicht öffnen', 'Fortsetzung folgt', 'Das Buch, das du suchst (nicht dieses)', 'Unbekannter Autor',
  'Seite 404', 'Ohne Titel', 'Kapitel ∞', 'Bitte zurückstellen', 'Leer, aber hoffnungsvoll',
];
const LINES = [
  'Die Seiten sind leer. Vielleicht wartet es auf deine nächste Idee.',
  'Jemand hat am Rand »Gute Frage!« notiert.',
  'Ein getrocknetes Kleeblatt fällt heraus.',
  'Die Buchstaben ordnen sich höflich neu, während du liest.',
  'Es riecht nach Vanille und altem Regen.',
  'Auf Seite 42 steht nur: »Weitergehen.«',
  'Ein Lesezeichen aus Sternenstaub steckt in der Mitte.',
  'Das Buch gähnt. Es war wohl lange nicht offen.',
  'Die Illustrationen bewegen sich, wenn du nicht hinschaust.',
  'Eine Fußnote verweist auf ein Buch, das es noch nicht gibt.',
  'Jemand hat hier eine Einkaufsliste vergessen: Tinte, Kerzen, Mut.',
  'Die letzte Seite ist eine Karte. Der Weg führt … tiefer hinein.',
];

export function fillerTitle(seed) {
  const r = makeRng(seed);
  if (r.chance(0.12)) return r.pick(STANDALONE);
  return `${r.pick(A)} ${r.pick(B)}`;
}

export function fillerLine(seed) {
  return makeRng(seed + 999).pick(LINES);
}

export const FILLER_COLORS = [
  '#6b1f24', '#7a2e3a', '#2b4a35', '#1f3a5a', '#4a2a5a', '#6a4a20', '#3a2a1a', '#5a3a1a',
  '#20343a', '#7a5a2a', '#401818', '#2a2a4a', '#4a5a2a', '#8a3a20', '#1a2a2a', '#5a2040',
];
