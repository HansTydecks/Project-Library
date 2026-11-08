# CLAUDE.md – Die Magische Bibliothek

Three.js-Spielwelt (Vite, Vanilla JS, keine Frameworks): eine endlose, gemütliche Bibliothek als Portal zu allen
Projekten des Besitzers. Sprache der UI und Texte: **Deutsch**. Wachstum in kleinen Sessions – jede Session soll
die Bibliothek um Details, Räume oder Inhalte erweitern, ohne den Kern umzubauen.

## Befehle
- `npm run dev` – Dev-Server (http://localhost:5173, Parameter: `?spawn=<raumId>&debug&nolock&lowfx&fixedres`)
- `npm run build` – Produktions-Build nach `dist/`
- `npm test` – Node-Tests (`tests/*.test.js`) für reine Logik (Platzierung, Bibliothekar)

## Architektur (Kurzfassung)
- `src/main.js` – verdrahtet alles: Engine, Welt, UI, Ereignisse, Loop.
- `src/world/rooms/*.js` – ein Raum pro Datei, automatisch registriert. Raster: 16 m Zellen, Türen automatisch.
- `src/props/*.js` – Details/Möbel/Geheimnisse, automatisch registriert, platziert via `ctx.place(name, opts)`.
- `src/world/kit.js` – Kit/Frame-Baukasten: statische Geometrie wird pro Material gemergt, Füllbücher instanziert.
- `src/world/endless/stacks.js` – prozedurale, gestreamte Chunks nördlich der Eingangszelle.
- `src/core/lights.js` – fester Pool von 12 PointLights (mit Hysterese); Räume melden nur Lichtpunkte an.
- `src/core/post.js` – Bloom, Farbstimmung, Vignette, Filmkorn; `engine.js` regelt die Auflösung adaptiv.
- `content/*.json` – Projekte und Ideen (die einzigen Inhaltsdaten).
- Ausführlich: `EXTENDING.md`.

## Konventionen
- Neue Details als eigenes Prop (oder Array-Eintrag in einer thematisch passenden Prop-Datei), nicht in `main.js`.
- Keine externen 3D-/Bild-/Audio-Assets ohne klare Lizenz; Texturen prozedural (`textures.js`), Klänge per WebAudio (`core/audio.js`).
- Niemals direkt `new THREE.PointLight` in Räumen – immer `f.light(...)` (sonst Shader-Neukompilierung/Performance).
- Statisches über `f.add(...)`, nur Animiertes über `f.object(...)` + `kit.onUpdate(...)`.
- Interaktionen: `f.interactable(mesh, {...})` oder `f.hitbox(...)`; Geheimnisse mit `secret: 'id'` + `secretName`.
- Zufall immer deterministisch (`kit.services.rng(seed)` / `makeRng`), damit die Bibliothek bei jedem Besuch gleich aussieht.
- Texte: warm, verschroben, kurz. Keine Gruselelemente.
- Flächen nie exakt aufeinanderlegen (Z-Fighting = Flackern): mind. 2–5 cm Abstand oder `polygonOffset`.
- Kollider nur für begehbare Höhe (Türstürze, Galerien bekommen keine) – nach Raumänderungen Türen per Durchgangstest prüfen.
- Performance-Budget grob: < 400 Draw Calls, < 400k Dreiecke im Blickfeld; hohe Regalreihen nutzen automatisch Buchwand-Texturen.
- Nach Änderungen: `npm test` und `npm run build`; visuell prüfen mit Playwright + `?nolock&debug&spawn=<raum>` (`window.__lib` bietet `teleport`, `look`, `start`).

## Ideen für nächste Ausbaustufen
Lesezeichen/Share-Links zu Regalen, Jahreszeiten im Garten, Wetter aus echter API, Kamin-Lesezimmer, Kartenraum mit
Übersichtskarte, Treppe zur Galerie, mehr Chunk-Typen in den Stapeln, Bibliothekar mit LLM-Anbindung (Serverless).
