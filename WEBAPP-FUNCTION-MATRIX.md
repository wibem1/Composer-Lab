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
| MIDI-Import | Inline-Parser | weiterhin bestehender Root-Parser | ÜBERGANG – später Kernkandidat |
| MIDI-Export | Inline-Builder | weiterhin bestehender Root-Builder | ÜBERGANG – später Kernkandidat |
| JSON-Export | vorhanden | bestehender Root-Code | ABGEDECKT |
| Hauptplayer | mehrfach überschrieben | bestehender Root-Code | ÜBERGANG – Konsolidierung später |
| Loop / Pause / Seek | vorhanden | bestehender Root-Code | ÜBERGANG |
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
| MIDI-Analyse durch KI | Inline + Repair-Patches | noch Root-spezifisch | NOCH NICHT KONSOLIDIERT |
| Rückfrage zur MIDI-Analyse | Inline + Repair-Patches | noch Root-spezifisch | NOCH NICHT KONSOLIDIERT |
| Vergleich Quelle A/B | vorhanden | Root-spezifischer Vergleichscode | NOCH NICHT KONSOLIDIERT |
| freier Vergleichs-Chat | `comparison-chat-v27.js` | weiterhin aktiv | ABGEDECKT, aber noch app-spezifisch |
| Diagnoseexport | `diagnostics-v2.js` | Engine Adapter liefert Diagnosedaten | ABGEDECKT |
| Fold-State-Persistenz | mehrfach vorhanden | `root-interface-v47.js` | ABGEDECKT |
| API-Key-Speicherung | historischer Root-Code + Interface | Root Interface | ABGEDECKT |
| AndroidBridge Download | Root-Code | weiterhin Root-spezifisch | ABGEDECKT |
| Service Worker / PWA | vorhanden | unverändert | ABGEDECKT |
| CLAB | noch nicht in `main` | separater Branch `clab-webapp-v1` | BEWUSST ZURÜCKGESTELLT |
| MusicXML | noch kein vollständiger WebApp-Kern | offen | SPÄTER |

## Erste Konsequenz

Der gemeinsame Kern deckt bereits die zentralen Arbeitsbereiche Komposition, Konzept, Experimentallabor und Speicherung ab. Die größten noch app-spezifischen Altbereiche sind:

1. MIDI-Import und MIDI-Export
2. Player/Wiedergabe
3. MIDI-Analyse und Rückfragen
4. Vergleichslabor
5. Android-/PWA-spezifische Hilfsfunktionen

Diese Bereiche werden nicht gleichzeitig umgebaut. Sie werden einzeln aus dem Monolithen herausgelöst und jeweils erst nach Funktionsabgleich ersetzt.

## Sicherheitsregel

Der Root-`index.html` bleibt während dieser Phase unverändert als funktionierendes Sicherheitsnetz. Neue Konsolidierung erfolgt ausschließlich über externe Module im Branch `consolidation-webapp`. Erst wenn alle Funktionen auf dem neuen Pfad nachweislich abgedeckt sind, wird der historische Inline-Code aus `index.html` entfernt oder ins Archiv verschoben.
