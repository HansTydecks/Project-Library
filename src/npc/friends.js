// Bewohner der Bibliothek: Steckbriefe + Bekanntschafts-Register. Ohne three.js → testbar.
// Neue Figur: Steckbrief hier ergänzen und das Prop im Raum mit `friend: '<id>'` platzieren.
export const FRIENDS = [
  {
    id: 'bibliothekar', name: 'Der Bibliothekar', room: 'foyer',
    lines: ['Ich kenne jedes Buch hier. Die meisten kennen mich auch.'],
  },
  {
    id: 'fingerhut', name: 'Frau Fingerhut, Uhrmacherin', room: 'uhrwerk',
    lines: [
      'Oh! Hallo! Ich ölte gerade eine Sekunde. Sie hat gequietscht.',
      'Jede Uhr hier geht anders. Das ist Absicht. Zeit ist Geschmackssache.',
      'Hast du eine verlorene Minute gefunden? Behalte sie. Sie mag dich.',
      'Ich bin klein, aber meine Lupe ist groß. Zusammen sind wir mittelgroß.',
    ],
  },
  {
    id: 'puschel', name: 'Professor Puschel', room: 'kartenraum',
    lines: [
      'Huhu! Ich habe jede Ecke dieser Bibliothek kartiert. Dreimal. Sie wächst immer weiter.',
      'Norden ist da, wo die Stapel endlos werden. Süden ist da, wo der Tee ist.',
      'Ich kann meinen Kopf fast ganz herumdrehen. Das hilft beim Kartenlesen enorm.',
      'Mein Monokel ist geliehen. Von mir. Aus der Zukunft.',
    ],
  },
  {
    id: 'mirabelle', name: 'Mirabelle, die Teekanne', room: 'teesalon',
    lines: [
      'Ein Tässchen? Ich bin immer voll. Das ist mein Talent.',
      'Psst: Die Kanne, die da hinten schwebt, ist meine Tante. Sie gießt seit 1847.',
      'Ich mag Besuch. Besuch mag Tee. So einfach ist das.',
      'Wenn mein Deckel klappert, freue ich mich. Er klappert gerade sehr.',
    ],
  },
  {
    id: 'rostfrei', name: 'Ritter Rostfrei', room: 'lesesaal',
    lines: [
      '*klapper* Halt! Wer da? … Ach, ein Leser. Willkommen auf der Galerie!',
      'Ich bewache die oberen Regale. Hauptsächlich vor Staub.',
      'Meine Rüstung ist rostfrei. Darauf bin ich sehr stolz. Mein Name verrät es schon.',
      'Ich war nie in einer Schlacht. Nur in einer Buchhandlung. Die war schlimm genug.',
    ],
  },
  {
    id: 'gustav', name: 'Gustav, der Gärtnerigel', room: 'garten',
    lines: [
      'Moin! Ich gieße die Blumen. Und die Blumen gießen mich, wenn es regnet.',
      'Die Glühwürmchen arbeiten für mich. Nachtschicht.',
      'Ich habe Stacheln, aber nur außen. Innen bin ich ganz weich.',
    ],
  },
  {
    id: 'moos', name: 'Moos, der kleine Golem', room: 'wintergarten',
    lines: [
      '… *grünes Rascheln* …',
      'Moos mag Pflanzen. Pflanzen mögen Moos. Moos ist zufrieden.',
      'Moos wächst. Langsam. Sehr langsam. Moos hat Zeit.',
    ],
  },
  {
    id: 'lesefrida', name: 'Lesefrida, die Bücherraupe', room: 'pilzhain',
    lines: [
      'Ich lese gerade Band 3 von 1000. Danach werde ich ein Schmetterling. Oder Bibliothekarin.',
      'Ich lese mit allen Füßen gleichzeitig. Das ist schneller.',
      'Psst! Gleich kommt die spannende Stelle. Sie kommt seit zwei Wochen.',
    ],
  },
  {
    id: 'pip', name: 'Pip, der Bücherwichtel', room: 'stapel',
    lines: [
      'Eeep! Du hast mich gesehen! Das passiert fast nie.',
      'Ich sortiere die Stapel. Jede Nacht um. Darum findet hier niemand etwas.',
      'Wenn du dich verläufst: Folge den Schildern. Oder mir. Ich weiß auch nicht, wo ich hinlaufe.',
    ],
  },
];

// Bewohner der oberen Etagen (Ausbaustufe 5)
FRIENDS.push(
  {
    id: 'kleister', name: 'Meister Kleister, Buchbinder', room: 'buchbinderei',
    lines: [
      'Klopf, klopf! Jedes Buch hier wird von Hand gebunden. Von sehr kleinen Händen.',
      'Der Hebel dort? Nicht zu weit drehen. Sonst fliegen die Bücher. Sagen wir … manchmal absichtlich.',
      'Leim ist das Geheimnis. Und Geduld. Hauptsächlich Leim.',
    ],
  },
  {
    id: 'federleicht', name: 'Postmeisterin Federleicht', room: 'eulenpost',
    lines: [
      'Huu! Briefe hinein, Eulen hinaus. So einfach ist Post.',
      'Wir stellen alles zu. Auch Briefe, die noch nicht geschrieben wurden.',
      'Mit einer Feder kannst du am Briefkasten einen Brief schreiben. Dann bekommst du Antwort. Garantiert.',
    ],
  },
  {
    id: 'summ', name: 'Königin Summ', room: 'dachgarten',
    lines: [
      'Ssss … Willkommen in meinem Garten über den Dächern!',
      'Meine Bienen bestäuben jede Blume. Und manchmal ein Buch, aus Versehen. Es riecht dann nach Lavendel.',
      'Honig? Nimm dir ein Glas aus dem Stock. Ich weiß genau, wer Honig liebt: eine Teekanne im Teesalon.',
    ],
  },
  {
    id: 'wolle', name: 'Wolle, das Leitschaf', room: 'traumkammer',
    lines: [
      'Mäh. Wir springen, damit hier alle gut einschlafen.',
      'Zählst du mit? Zehn Sprünge, dann bist du offiziell müde.',
      'Ich hätte so gern ein Wollknäuel zum Kuscheln. Es gibt eins … in einer sehr großen Stube.',
    ],
  },
  {
    id: 'bim', name: 'Bim, die Turmkrähe', room: 'turm',
    lines: [
      'Krah! Von hier oben sehe ich alles. Auch dich. Hallo!',
      'Die Turmuhr steht seit Jahren. Ihr fehlt ein kleines Zahnrad. Die Uhrmacherin hat welche.',
      'In der Truhe liegt etwas Funkelndes. Den Schlüssel? Hat jemand verloren. Wo landet Verlorenes wohl?',
    ],
  },
);

export function createFriends({ progress, list = FRIENDS } = {}) {
  const byId = new Map(list.map((f) => [f.id, f]));
  const said = new Map();
  return {
    get all() { return list; },
    get(id) { return byId.get(id); },
    /** Begegnung merken. Gibt true zurück, wenn es die erste war. */
    meet(id) { return byId.has(id) && progress.friend(id); },
    known(id) { return progress.has('friends', id); },
    /** Nächster Spruch (der Reihe nach, dann wieder von vorn). */
    next(id) {
      const f = byId.get(id);
      if (!f?.lines.length) return '';
      const i = said.get(id) ?? 0;
      said.set(id, i + 1);
      return f.lines[i % f.lines.length];
    },
    list() { return list.map((f) => ({ ...f, found: progress.has('friends', f.id) })); },
    count() { return list.filter((f) => progress.has('friends', f.id)).length; },
  };
}
