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
9. `shared/midi-analysis-adapter.js` – einheitliche KI-Analyse importierter MIDI-Dateien
10. `shared/player-adapter.js` – ein aktiver Wiedergabepfad für Haupt-, Vorlagen- und Vergleichsplayer

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
| Vergleich Quelle A/B | vorhanden | Root-spezifischer Vergleichscode | NOCH NICHT KONSOLIDIERT |
| freier Vergleichs-Chat | `comparison-chat-v27.js` | weiterhin aktiv | ABGEDECKT, aber noch app-spezifisch |
| Diagnoseexport | `diagnostics-v2.js` | Engine Adapter liefert Diagnosedaten | ABGEDECKT |
| Fold-State-Persistenz | mehrfach vorhanden | `root-interface-v47.js` | ABGEDECKT |
| API-Key-Speicherung | historischer Root-Code + Interface | Root Interface | ABGEDECKT |
| AndroidBridge Download | Root-Code | weiterhin Root-spezifisch | ABGEDECKT |
| Service Worker / PWA | vorhanden | unverändert | ABGEDECKT |
| CLAB | noch nicht in `main` | separater Branch `clab-webapp-v1` | BEWUSST ZURÜCKGESTELLT |
| MusicXML | noch kein vollständiger WebApp-Kern | offen | SPÄTER |

## Aktuell verbleibende große Altbereiche

1. MIDI-Import und MIDI-Export
2. Vergleichslabor außerhalb des Players
3. Android-/PWA-spezifische Hilfsfunktionen
4. später: physisches Entfernen der nun übersteuerten Inline-Player- und Analyseblöcke

## Player-Konsolidierung

Der alte `index.html` enthält mindestens zwei Grundimplementierungen des Players sowie zusätzliche Override-Schichten. Im Konsolidierungsbranch bleibt dieser Code zunächst als Sicherheitsnetz bestehen. `player-adapter.js` ersetzt jedoch die sichtbaren Player-Bedienelemente durch frische DOM-Knoten und bindet ausschließlich einen neuen Handler-Satz. Dadurch feuern die alten `addEventListener`-Handler nicht mehr mit.

Der neue Player verwendet ein kurzes Look-ahead-Fenster statt sämtliche Noten eines längeren Stücks sofort zu planen. Damit bleibt die Architektur für größere MIDI-Dateien kontrollierbar und es existiert nur eine Stelle für Play, Pause, Stop, Loop und Seek.

## Sicherheitsregel

Der Root-`index.html` bleibt während dieser Phase unverändert als funktionierendes Sicherheitsnetz. Neue Konsolidierung erfolgt ausschließlich über externe Module im Branch `consolidation-webapp`. Erst wenn alle Funktionen auf dem neuen Pfad nachweislich abgedeckt sind, wird der historische Inline-Code aus `index.html` entfernt oder ins Archiv verschoben.
