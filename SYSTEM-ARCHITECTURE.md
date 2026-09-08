# Music Lab System – Gesamtarchitektur

Stand: 8. September 2026

## Aktive Anwendungen

### ComposeLab
Repository: `wibem1/Composer-Lab`

Plattformübergreifende Web-/PWA-Kompositionswerkstatt für Android, iPad und Browser.

### Composition Lab
Repository: `wibem1/Composition-Lab-Native`

Native macOS-Kompositionswerkstatt mit weitergehender System-, MusicXML- und DAW-Integration. Aktiver Stand: **V5.0.12 / Build 84 / Engine Build 14**. Der technische Repository-Name enthält weiterhin `Native`; das ist keine Produktbezeichnung.

### MusicChatLab
Entwicklungsrepository: `wibem1/Music-Chat-Lab`

Chatzentrierte musikalische WebApp mit Claude, Gemini und OpenAI sowie MIDI-/MusicXML-/CLAB-Kontext. Aktiver Stand: **v1.0.17 / Engine Build 14**.

`wibem1/Music-Chat-Lab-Pages` ist ausschließlich das öffentliche Deployment. Es enthält einen freigegebenen Laufzeit-Snapshot von MusicChatLab und ist keine zweite Entwicklungsquelle.

## Gemeinsamer Kern

Alle drei Anwendungen verwenden verbindlich:

- Engine Build 14 als gemeinsamen Kompositionskern
- Score-Schema `ti`, `bpm`, `ts`, `k`, `sm`, `tr`
- Tracks `nm`, `ch`, `pg`, `nt`, `ct`, optional `ev`, `me`
- Note `[StartBeat, Dauer, Pitch, Velocity, Staff, Gate]`
- MIDI-Import mit `Gate = 1.0` bei bereits gemessener Note-On→Note-Off-Dauer
- EV Contract 1.1
- CLAB v1 (`composition-lab-document`, Version 1)
- keine API-Schlüssel in CLAB-Dateien

Composition Lab bleibt die Referenzimplementierung für CLAB und die weitergehende MusicXML-/DAW-Semantik. ComposeLab und MusicChatLab lesen und schreiben dasselbe CLAB-v1-Format.

## Dateitypen

- `.clab` = Projekt-/Werkzustand
- `.mid` / `.midi` = musikalisches Austauschformat
- `.musicxml` / `.xml` = Notationsaustauschformat
- Backup = App-Zustand, Verlauf und Einstellungen
- Verlauf = lokale Arbeitsgeschichte
- JSON = internes/technisches Diagnose- oder Austauschformat, sofern nicht ausdrücklich anders definiert

## DAW-Anbindungen

DAW-Anbindungen sind Adapter, keine eigenen musikalischen Engines:

- REAPER Bridge
- Ableton/Max-for-Live-Bridge

## Historischer Vorläufer

`wibem1/Midi-Composer` ist ausschließlich Archiv/Referenz und keine aktive Entwicklungsquelle.

## Entwicklungsregel

Neue Arbeiten beginnen ausschließlich von den bereinigten `main`-Ständen von ComposeLab, Composition Lab und MusicChatLab. Änderungen an Engine, Score-Schema, MIDI-/MusicXML-Semantik, EV oder CLAB werden systemweit geprüft und nicht app-spezifisch dupliziert.
