# Composition Lab WebApp – Funktionsmatrix der Konsolidierung

Stand: 8. September 2026
Branch: `consolidation-webapp`

Ziel: Der historisch gewachsene Root-`index.html` wird schrittweise durch einen klaren gemeinsamen Laufzeitpfad ersetzt, ohne dabei bestehende Funktionen zu verlieren.

## Zielpfad

Der Konsolidierungsbranch aktiviert nun folgenden kontrollierten Bootstrap:

1. `shared/composition-engine.js` – gemeinsamer musikalischer Kern, Engine Build 14
2. `shared/storage-engine.js` – gemeinsame Verlaufs-/Backup-Semantik
3. `shared/storage-adapter.js` – WebApp-Anbindung an Storage
4. `shared/root-engine-adapter.js` – WebApp-Anbindung an Engine Build 14
5. `shared/experiment-engine.js` – gemeinsames Experimentallabor
6. `shared/experiment-adapter.js` – WebApp-Anbindung des Experimentallabors
7. `shared/gemini-model-config.js` – Modellkonfiguration
8. `shared/root-interface-v47.js` – aktueller Root-Interface-Layer
9. `shared/midi-core.js` – eigenständiger Score↔MIDI-Kernkandidat
10. `shared/midi-io-adapter.js` – verbindliche WebApp-Schnittstelle für MIDI-I/O
11. `shared/midi-analysis-adapter.js` – einheitliche KI-Analyse importierter MIDI-Dateien
12. `shared/player-adapter.js` – ein aktiver Wiedergabepfad für Haupt-, Vorlagen- und Vergleichsplayer
13. `shared/comparison-adapter.js` – Quellen A/B, KI-Vergleich, Syntheseauftrag und Vergleichs-Chat

Gestartet wird dieser Pfad über `shared/consolidated-bootstrap.js`.

## Funktionsabgleich

| Funktion | Bestehender Root-Stand | Konsolidierter Zielpfad | Status |
|---|---|---|---|
| Anbieterwahl Claude/Gemini/OpenAI | vorhanden | Root-UI + Engine Adapter | ABGEDECKT |
| Modellwahl | vorhanden | Root-UI / Modellkonfiguration | ABGEDECKT |
| Reasoning/Qualität | vorhanden | Engine Adapter | ABGEDECKT |
| Takte / Taktart / Tempo / Tonart / Besetzung | vorhanden | Engine Adapter | ABGEDECKT |
| Kompositionsauftrag | vorhanden | Engine Build 14 | ABGEDECKT |
| musikalischer Impuls / Konzept | vorhanden | Engine Build 14 `onConcept` | ABGEDECKT |
| Komposition | ältere Inline-Engine | gemeinsame Engine Build 14 | ABGEDECKT – neuer Zielpfad |
| MIDI-Vorlage als Quelle | vorhanden | Engine Adapter `source` | ABGEDECKT |
| freier Hinweis zur Quelle | teilweise historisch | Root Engine Adapter / MIDI-Chat | ABGEDECKT |
| MIDI-Import | doppelter Inline-Parser | `midi-core.js` über `CompositionLabMIDI` | KERNKANDIDAT AKTIV – Roundtrip-Test ausstehend |
| MIDI-Export | doppelter Inline-Builder | `midi-core.js` über `CompositionLabMIDI` | KERNKANDIDAT AKTIV – Roundtrip-Test ausstehend |
| MIDI Noten/Velocity/Gate | vorhanden | `midi-core.js` | ABGEDECKT |
| MIDI Kanal/Programm/CC | vorhanden | `midi-core.js` | ABGEDECKT |
| MIDI Tempo/Taktart/Tonart/Spurnamen | vorhanden | `midi-core.js` | ABGEDECKT |
| MIDI Spezial-/Raw-Events | uneinheitlich | noch nicht Bestandteil von `midi-core.js` | OFFEN – mit Native abgleichen |
| JSON-Export | vorhanden | bestehender Root-Code | ABGEDECKT |
| Hauptplayer | mehrfach überschrieben | `player-adapter.js` | KONSOLIDIERT IM BRANCH |
| Loop / Pause / Seek | mehrfach überschrieben | `player-adapter.js` | KONSOLIDIERT IM BRANCH |
| Vorlagenplayer | mehrere Handler | `player-adapter.js` | KONSOLIDIERT IM BRANCH |
| Vergleichsplayer A/B | mehrere Handler | `player-adapter.js` | KONSOLIDIERT IM BRANCH |
| Kompositionsverlauf | alter LocalStorage-Verlauf | gemeinsamer Storage-Adapter | ABGEDECKT – Migration beachten |
| Backup / Restore | mehrere historische Varianten | gemeinsamer Storage-Adapter | ABGEDECKT – Zielpfad |
| Experimentallabor | mehrere Inline-/Repair-Varianten | gemeinsame Experiment-Engine + Adapter | ABGEDECKT – Zielpfad |
| Inspiration | vorhanden | Experiment-Engine | ABGEDECKT |
| völliger Zufall | vorhanden | Experiment-Engine | ABGEDECKT |
| Zufall mit Eckdaten | vorhanden | Experiment-Engine | ABGEDECKT |
| KI-Vorlage | vorhanden | Experiment-Engine | ABGEDECKT |
| Kompositionsidee der Vorlage | vorhanden | Experiment-Adapter | ABGEDECKT |
| Vorlagenverlauf | vorhanden | Experiment-Engine / Adapter | ABGEDECKT – Migration vorhanden |
| Vorlage in Komposition übernehmen | vorhanden | Experiment-Adapter | ABGEDECKT |
| MIDI-Analyse durch KI | Inline + Repair-Patches | `midi-analysis-adapter.js` | KONSOLIDIERT IM BRANCH |
| Rückfrage zur MIDI-Analyse | Inline + Repair-Patches | `midi-analysis-adapter.js` | KONSOLIDIERT IM BRANCH |
| Quellen A/B laden | Inline-Vergleichscode | `comparison-adapter.js` | KONSOLIDIERT IM BRANCH |
| KI-Vergleich A/B | Inline-Vergleichscode | `comparison-adapter.js` | KONSOLIDIERT IM BRANCH |
| Syntheseauftrag erzeugen/übernehmen | Inline-Vergleichscode | `comparison-adapter.js` | KONSOLIDIERT IM BRANCH |
| freier Vergleichs-Chat | `comparison-chat-v27.js` | `comparison-adapter.js` | KONSOLIDIERT IM BRANCH |
| Diagnoseexport | `diagnostics-v2.js` | Engine Adapter liefert Diagnosedaten | ABGEDECKT |
| Fold-State-Persistenz | mehrfach vorhanden | `root-interface-v47.js` | ABGEDECKT |
| API-Key-Speicherung | historischer Root-Code + Interface | Root Interface | ABGEDECKT |
| AndroidBridge Download | Root-Code | weiterhin Root-spezifisch | ABGEDECKT |
| Service Worker / PWA | vorhanden | unverändert | ABGEDECKT |
| CLAB | noch nicht in `main` | separater Branch `clab-webapp-v1` | BEWUSST ZURÜCKGESTELLT |
| MusicXML | noch kein vollständiger WebApp-Kern | offen | SPÄTER |

## MIDI-Kern – bewusste Grenze

`shared/midi-core.js` ist jetzt der aktive Kernkandidat im Konsolidierungsbranch. Er unterstützt Standard-MIDI-Dateien mit PPQ-Zeitbasis und bildet folgende gemeinsame Semantik ab:

- Noten, Start, Dauer, Velocity und Gate
- MIDI-Kanal und General-MIDI-Programm
- Controller (`ct`)
- Tempo
- Taktart
- Tonart
- Tracknamen

Nicht als bereits gelöst gelten Raw-/Spezialereignisse wie Pitch Bend, Aftertouch, SysEx, spezielle Meta-Events oder DAW-spezifische Zusatzinformationen. Diese dürfen nicht stillschweigend verloren gehen, sobald wir Native- oder DAW-Roundtrips als Ziel betrachten. Dafür wird der Native-Ansatz mit `me` separat abgeglichen.

Der alte Root-Parser und Root-Builder bleiben bis zum bestandenen Roundtrip-Test als Fallback erhalten. Erst danach werden die doppelten Inline-Implementierungen entfernt.

## Aktuell verbleibende große Altbereiche

1. Den neuen MIDI-Kern gegen reale MIDI-Dateien, den alten Root-Parser/-Builder und Native testen.
2. Android-/PWA-spezifische Hilfsfunktionen sauber als Plattformadapter markieren.
3. Danach die bereits übersteuerten Inline-, Player-, Analyse-, Vergleichs- und MIDI-Blöcke physisch aus `index.html` entfernen oder archivieren.

## Sicherheitsregel

Der Root-`index.html` bleibt während dieser Phase unverändert als funktionierendes Sicherheitsnetz. Neue Konsolidierung erfolgt ausschließlich über externe Module im Branch `consolidation-webapp`. Erst wenn alle Funktionen auf dem neuen Pfad nachweislich abgedeckt sind, wird der historische Inline-Code aus `index.html` entfernt oder ins Archiv verschoben.
