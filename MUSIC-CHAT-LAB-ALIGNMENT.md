# Music Chat Lab – Abgleich mit gemeinsamem Score-/MIDI-Kern

Stand: 8. September 2026
Referenzen:
- Composition Lab WebApp Branch `consolidation-webapp`
- Composition Lab Native V5.0.11 / Build 83 / Engine Build 14
- Music Chat Lab `main` v0.4.13

## Ergebnis in einem Satz

Music Chat Lab verwendet bereits denselben grundlegenden Score-Vertrag wie Composition Lab, besitzt aber noch eine eigene MIDI-Import-/Exportimplementierung und unterstützt dabei einen kleineren MIDI-Umfang als der neue WebApp-Kern.

## Aktiver Music-Chat-Lab-Laufzeitpfad

`index.html` lädt aktuell:

1. `music-file-processing.js`
2. `android-download-fix.js`
3. `engine14-output.js`
4. `app.js`

Die älteren Dateien `output.js` und `output-v2.js` werden vom aktuellen `index.html` nicht geladen und sind damit keine aktiven Laufzeitpfade.

## Gemeinsames Score-Schema

Music Chat Lab `engine14-output.js` erzeugt und verarbeitet bereits:

```text
Score
├── ti
├── bpm
├── ts { n, d }
├── k
├── sm
└── tr[]
    ├── nm
    ├── ch
    ├── pg
    ├── nt[] = [StartBeat, Dauer, Pitch, Velocity, Staff, Gate]
    └── ct[] = [Beat, CC, Wert]
```

Das ist mit dem Composition-Lab-Basisschema kompatibel.

## Gate-Semantik

Music Chat Lab macht beim Import einer realen MIDI-Datei bereits das Richtige:

- `d` wird als tatsächlich gemessene Note-On→Note-Off-Dauer übernommen.
- `g` wird auf `1.0` gesetzt.

Damit entspricht Music Chat Lab der korrigierten Semantik von `midi-core-1.1` in der WebApp.

## Unterschiede beim MIDI-Import

### Music Chat Lab heute

`music-file-processing.js` übernimmt:

- Noten
- Velocity
- Kanal
- Program Change
- Tempo
- Taktart
- Tracknamen
- nur Controller 1, 7, 10, 11 und 64

Nicht übernommen werden aktuell:

- andere CC-Nummern
- Tonart-Metaevent 0x59
- Pitch Bend
- Channel/Poly Aftertouch
- SysEx
- Raw MIDI Events

### Composition Lab WebApp `midi-core-1.1`

Übernimmt:

- Noten
- Velocity
- Kanal
- Program Change
- alle CC 0–127
- Tempo
- Taktart
- Tonart
- Tracknamen

### Composition Lab Native V5.0.11

Beim normalen Dateiimport ähnlich dem WebApp-Basiskern:

- Noten
- Velocity
- Kanal
- Program Change
- CC
- Tempo
- Taktart
- Tonart
- Tracknamen

Native besitzt zusätzlich optionale Score-Felder:

- `ev` für Notation/Ausdruck
- `me` für rohe MIDI-Ereignisse, vor allem für DAW-Roundtrips

## Gemeinsames Score-Superset

Für alle drei Anwendungen soll künftig derselbe logische Superset-Vertrag gelten:

```text
Score
├── ti
├── bpm
├── ts
├── k
├── sm
└── tr[]
    ├── nm
    ├── ch
    ├── pg
    ├── nt
    ├── ct
    ├── ev   optional
    └── me   optional
```

Regel: Eine Anwendung muss optionale Felder, die sie selbst nicht versteht, bei einem Projekt-/CLAB-Roundtrip möglichst erhalten und darf sie nicht unnötig verwerfen.

## Engine Build 14

`engine14-output.js` ist ausdrücklich an Composition Lab Engine Build 14 ausgerichtet und verwendet denselben zweistufigen Kompositionspfad:

1. musikalischer Impuls / Konzept
2. technische JSON-Partitur

Damit ist Music Chat Lab konzeptionell bereits Teil derselben Engine-Familie. Es verwendet aber derzeit noch eine eigene Kopie der technischen Prompt-/Score-/MIDI-Logik. Diese Doppelung ist ein Wartungsrisiko.

## Empfohlene Konsolidierung von Music Chat Lab

Nicht neu schreiben.

Stattdessen später schrittweise:

1. gemeinsamen Score-Vertrag als separates Modul definieren
2. MIDI-Parser/-Builder durch denselben Kernvertrag wie WebApp ersetzen oder daran angleichen
3. alle CC 0–127 erhalten
4. Tonart-Metaevent lesen/schreiben
5. `ev` und `me` als optionale transparente Felder zulassen
6. CLAB-Unterstützung auf demselben Dokumentvertrag ergänzen
7. `engine14-output.js` von eigener MIDI-I/O-Implementierung befreien
8. `output.js` und `output-v2.js` nach Prüfung als Legacy/Archiv kennzeichnen

## Was nicht vereinheitlicht werden muss

App-spezifisch dürfen bleiben:

- Chat-Oberfläche und Chat-Verlauf
- Provider-/Modellwechsel im Gespräch
- Datei-Chips und Chat-Anhänge
- Verovio-/Notationsansicht
- Android-/PWA-Bedienlogik
- MusicXML-Chatworkflow

Diese Unterschiede betreffen die Bedienoberfläche, nicht den gemeinsamen musikalischen Datenkern.

## Fazit

Die drei Hauptanwendungen sind bereits näher beieinander als zunächst vermutet. Es ist keine Neuerstellung nötig. Der gemeinsame Kern kann aus den vorhandenen Implementierungen konsolidiert werden.
