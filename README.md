# 📚 Die Magische Bibliothek

Eine gemütliche, scheinbar endlose 3D-Bibliothek (three.js), in der alle meine Apps, Blogeinträge,
Ideen und Archivstücke als Bücher in Regalen stehen – zum Selbst-Durchlaufen, Wiederentdecken und Staunen.

Vorne sitzt ein Zauberer-Bibliothekar, der im Notfall hilft (Suche + leuchtendes Irrlicht, das dir den Weg zeigt).
Laufen musst du aber selbst.

## Räume

| Raum | Was dort ist |
| --- | --- |
| **Foyer** | Bibliothekar am Tresen, Sortierwagen (unsortierte Projekte), Neuerscheinungen, Standuhr mit echter Zeit |
| **Großer Lesesaal** | Regale nach Kategorien (Apps, Spiele, Webseiten, Werkzeuge, Kreatives, Experimente), Galerie, schwebende Bücher |
| **Ideen-Kabinett** | Pinnwand und schwebende Zettel aus `content/ideas.json`, Glas voller Geistesblitze |
| **Archiv & Blog** | Blog- und Archivregale, Zeitungsständer, Zettelkatalog (Register aller Werke) |
| **Mondgarten** | Innenhof unter Sternen: Wunschbrunnen, Glühwürmchen, Feenring, Tauschregal |
| **Sternenbalkon** | Über dem Wolkenmeer, mit Teleskop und Kristallkugel |
| **Die Endlosen Stapel** | Prozedural erzeugte, unendliche Regal-Gänge mit verirrten Büchern und Liminal-Momenten |

## Steuerung

`W A S D` laufen · `Shift` rennen · Maus schauen · `E` / Klick interagieren · `Tab` Tagebuch · `M` Klang an/aus.
Auf dem Handy: linker Daumen = Joystick, rechts wischen = umsehen, tippen = interagieren.

## Lokal starten

```bash
npm install
```

```bash
npm run dev
```

Nützliche URL-Parameter: `?spawn=garten` (direkt in einen Raum), `?debug` (FPS & Koordinaten), `?nolock` (Maus-Ziehen statt Pointer-Lock).

## Eigene Projekte eintragen

Einfach `content/projects.json` bearbeiten – jedes Objekt ist ein Buch. Die Beispiel-Einträge (`"example": true`) kannst du löschen.

```json
{
  "id": "mein-projekt",
  "title": "Mein Projekt",
  "url": "https://…",
  "kind": "app",
  "room": "lesesaal",
  "shelf": "spiele",
  "status": "live",
  "year": 2026,
  "tags": ["spiel", "three.js"],
  "color": "#7a2e3a",
  "description": "Ein Satz oder drei."
}
```

Alles Weitere (neue Räume, Details, Geheimnisse) steht in **[EXTENDING.md](EXTENDING.md)**.

## Deploy

Bei jedem Push auf `main` baut eine GitHub Action die Seite und veröffentlicht sie auf GitHub Pages.
Einmalig nötig: im Repository unter **Settings → Pages → Source** „GitHub Actions“ auswählen.

## Tests

```bash
npm test
```
