# Die Bibliothek erweitern

Grundprinzip: **Eine Datei = eine Erweiterung.** Räume und Props werden automatisch gefunden
(`import.meta.glob` in `src/world/registry.js`). Es gibt keine zentrale Liste, die man pflegen muss.

---

## 1. Ein Projekt / Buch hinzufügen

`content/projects.json` → neues Objekt anhängen.

| Feld | Bedeutung |
| --- | --- |
| `id` | eindeutig, kebab-case |
| `title` | steht auf Buchrücken und Deckel |
| `url` | wird beim „Aufschlagen ↗“ geöffnet |
| `kind` | `app`, `game`, `tool`, `site`, `blog`, `archive`, `idea` |
| `room` + `shelf` | wo das Buch steht (siehe Tabelle unten) |
| `status` | `live` (Goldprägung), `wip` (Lesezeichenband), `idea`, `archived` |
| `year` / `added` | für „Neuerscheinungen“ im Foyer (neueste zuerst; `added` als `YYYY-MM-DD`) |
| `tags` | für die Suche des Bibliothekars |
| `color` | Einbandfarbe (optional, sonst aus der ID abgeleitet) |
| `description` | Text im aufgeschlagenen Buch; Länge bestimmt die Buchdicke |

**Regale (Stand jetzt):**

| room | shelf | Ort |
| --- | --- | --- |
| `lesesaal` | `apps`, `spiele`, `web`, `werkzeuge`, `kreativ`, `experimente` | Großer Lesesaal |
| `archiv` | `blog`, `archiv` | Archiv (Blog-/Archiv-Einträge landen automatisch hier) |
| `ideen` | `skizzen` | Ideen-Kabinett |
| `garten` | `garten` | Tauschregal im Mondgarten |
| – | – | ohne Angabe → **Sortierwagen** im Foyer |

Ist ein Regal voll oder unbekannt, landet das Buch auf dem Sortierwagen. Nichts geht verloren.

**Ideen** (lose Gedanken) gehören in `content/ideas.json`: `{ id, title, text, tags, date }` → Pinnwand & schwebende Zettel.

---

## 2. Einen Raum hinzufügen

Neue Datei `src/world/rooms/<id>.js`:

```js
import { defineRoom } from '../registry.js';

export default defineRoom({
  id: 'sternwarte',
  name: 'Die Sternwarte',
  description: 'Ein runder Raum voller Sternkarten.',
  keywords: ['sterne', 'astronomie', 'karten'],   // für die Suche des Bibliothekars
  cell: [-2, -1],          // Rasterzelle (16 × 16 m); -z = Norden
  size: [1, 1],            // optional: mehrere Zellen
  height: 7,
  // outdoor: true,        // ohne Decke, mit Himmel
  // closedTo: ['foyer'],  // keine Tür zu diesen Nachbarn
  spawn: { at: [0, 4], yaw: 0 },
  atmosphere: { fog: '#141a2e', density: 0.03, ambient: 1.0, ambientColor: '#c8d0ff', moon: 0 },
  shelves: [{ id: 'sterne', label: 'Sternkarten' }],   // Beschriftungen für Bibliothekar/Katalog
  build(ctx) {
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpBlue' });   // Wände mit automatischen Türen zu Nachbarräumen
    ctx.foundation();
    ctx.wallShelves('north', { id: 'sterne' });
    ctx.place('telescope', { at: [0, 0, 0] });
    ctx.place('chandelier', { at: [0, 0, 0], y: 5.5 });
    ctx.place('cat', { at: [3, 0, 3], secret: 'katze-sternwarte' });
  },
});
```

**Raster-Karte (aktuell):**

```
            x: -1        0         1         2
z ≤ -3   [ Endlose Stapel … (Eingang bei 0,-3) … ]
z = -2   [        Großer Lesesaal (3×2)        ]
z = -1   [                                     ]
z =  0   [ Ideen  ][  Foyer   ][ Archiv  ][Balkon]
z =  1   [        Mondgarten (3×1)             ]
```

Freie Zellen gibt es z. B. bei `[-2, …]`, `[2, -1]`, `[2, 1]`, `[0, 2]` usw. Räume, die sich eine Kante teilen,
bekommen automatisch eine Tür in der Mitte jeder gemeinsamen Zellkante. Alles nördlich von `z = -3` gehört
den Endlosen Stapeln – dort keine Räume platzieren.

### ctx-API (Auszug, siehe `src/world/world.js` & `src/world/kit.js`)

| Methode | Zweck |
| --- | --- |
| `floor(mat)`, `ceiling(mat)`, `foundation()` | Boden, Decke + Dach, Felsen darunter |
| `enclose({ inner, outer, neighbor, open })` | Wände; Stile: `wall`, `facade`, `hedge`, `railing`, `none` |
| `wallFrame(side, inset)` | lokales Koordinatensystem an einer Wand (x entlang, +z in den Raum) |
| `wallShelves(side, { id, unit, height })` | füllt freie Wandstücke mit Regalen |
| `place(prop, { at, rot, … })` | Prop platzieren |
| `add(geo, mat, at, rot, scale)` | statische Geometrie (wird zusammengeführt) |
| `object(mesh, at, rot)` | dynamisches Objekt |
| `collider(x, z, w, d, { shadow })` | Kollisionsbox (2D; über 1,5 m Höhe ignoriert). Auf dem Boden entsteht automatisch ein weicher Kontaktschatten (`shadow: false` schaltet ihn ab) |
| `light(at, { color, intensity, distance, flicker, pool })` | Lichtpunkt (vom Licht-Pool bedient). Hängende Lichter (> 2,2 m) malen zusätzlich einen Lichtkegel auf den Boden (`pool: false` schaltet ihn ab) |
| `glow(at, { color, size })` | leuchtender Halo |
| `hitbox(at, size, { label, verb, onInteract, secret })` | unsichtbare Interaktionszone |
| `sign(text, at, rotY)` | beschriftetes Schild |
| `frame(at, rotY)` | verschachteltes Koordinatensystem |
| `kit.onUpdate((dt, t, { player }) => …)` | Animation pro Frame (nur wenn Raum in der Nähe) |

Koordinaten in `build()` sind **raumlokal**: `(0, 0, 0)` = Raummitte auf dem Boden, `ctx.hw`/`ctx.hd` = halbe Breite/Tiefe.

---

## 3. Ein Detail / Prop hinzufügen

Neue Datei `src/props/<name>.js` (oder in eine bestehende Datei als weiteres Array-Element):

```js
import { defineProp } from '../world/registry.js';
import { box, cyl } from '../world/geo.js';

export default defineProp({
  name: 'kaktus',
  create(f, opts, kit) {
    f.add(cyl(0.15, 0.18, 0.3), 'terracotta', [0, 0.15, 0]);
    f.add(cyl(0.08, 0.1, 0.5), 'leaves', [0, 0.55, 0]);
    f.collider(0, 0, 0.4, 0.4);
    f.hitbox([0, 0.5, 0], [0.4, 0.8, 0.4], {
      label: 'Kaktus', verb: 'Streicheln (mutig)',
      secret: opts.secret, secretName: 'Der kitzlige Kaktus',
      onInteract: () => kit.services.ui.toast('Autsch. Aber er hat gekichert.'),
    });
  },
});
```

`f` ist ein Frame: alle Koordinaten sind lokal zum Prop. Danach in einem Raum: `ctx.place('kaktus', { at: [2, 0, -3] })`.

**Nützliche Services** (`kit.services`): `ui.toast(text)`, `ui.note(titel, text)`, `audio.play('chime'|'purr'|'hoot'|…)`,
`events.emit('openProject', { project })`, `content.projects`, `content.ideas`, `rng(seed)`, `progress`, `secrets`.

**Materialien**: `src/world/materials.js` (Schlüssel wie `wood`, `brass`, `velvet`, `wpGreen` …). Neue Materialien dort ergänzen –
Texturen werden prozedural in `src/world/textures.js` gemalt (keine externen Bilddateien nötig).
Materialien sind physikalisch (`pbr(map, rauheit, { bump })` bzw. `flat(farbe, rauheit)`); Leuchtendes nutzt
`hdr(farbe, faktor)` mit Faktor > 1, damit der Bloom (`src/core/post.js`) es zum Glühen bringt.

---

## 4. Geheimnisse

Jede Interaktion mit `secret: 'eindeutige-id'` wird automatisch registriert, im Tagebuch als „???“ gezählt und beim
ersten Finden gefeiert. `secretName` ist der Name, der danach im Tagebuch steht.

## 5. Endlose Stapel

Neue Chunk-Typen in `src/world/endless/stacks.js` → `CHUNK_TYPES` hinzufügen und in `pickType` gewichten.
Ein Chunk ist 16 × 16 m; die Ränder (je ~2,5 m) frei lassen, damit Gänge verbunden bleiben.

## 6. Der Bibliothekar

Sprüche & Spezialfragen: `src/npc/librarian.js` (testbar, ohne three.js). Neue Titel für namenlose Füllbücher:
`src/world/bookTitles.js`.

## Stil-Leitfaden

- **Warm & gemütlich**: Kerzen-/Lampenlicht (`#ffb36b`), dunkles Holz, Messing, Samt. Draußen: kühles Mondlicht.
- **Magisch, nicht gruselig**: Liminal-Momente dürfen seltsam sein, aber freundlich.
- **Humor**: Der Bibliothekar ist liebevoll-verschroben. Kurze, augenzwinkernde Texte.
- **Performance**: Lichter nur über `light()` (Licht-Pool, max. 12 aktive), viel statische Geometrie über `add()`,
  hohe Regalreihen als Buchwand-Textur (passiert automatisch über 2,4 m).
