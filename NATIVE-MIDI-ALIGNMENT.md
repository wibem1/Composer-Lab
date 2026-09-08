# MIDI-Abgleich: WebApp-Kern ↔ Composition Lab Native V5.0.11

Stand: 8. September 2026

## Referenzstände

- WebApp: Branch `consolidation-webapp`, `shared/midi-core.js`, Version `midi-core-1.1`
- Native: Composition Lab Native V5.0.11 / Build 83 / Engine Build 14
- Native-Quellen: `Models.swift`, `MIDIParser.swift`, `MIDIBuilder.swift`, `ReaperBridge.swift`

## Gemeinsamer Score-Kern

Beide Systeme verwenden dieselbe Grundstruktur:

- Score: `ti`, `bpm`, `ts`, `k`, `sm`, `tr`
- Track: `nm`, `ch`, `pg`, `nt`, `ct`
- Note: `[StartBeat, Dauer, Pitch, Velocity, Staff, Gate]`
- Controller: `[Beat, CC, Wert]`

Native erweitert Track optional um:

- `ev`: semantische Notations-/Ausdrucksereignisse
- `me`: rohe Nicht-Noten-MIDI-Ereignisse

Diese Felder gehören zum erweiterten Score-Schema und dürfen bei CLAB-/Score-Weitergabe nicht verloren gehen.

## Was der normale MIDI-Dateiimport tatsächlich erhält

### WebApp `midi-core-1.1`

Erhält derzeit:

- Noten
- Velocity
- reale Klingdauer aus Note-On/Off
- Kanal
- Program Change als Track-Programm
- CC-Controller
- Tempo
- Taktart
- Tonart
- Trackname

Nicht erhalten werden derzeit:

- Pitch Bend
- Channel Pressure
- Poly Aftertouch
- SysEx
- beliebige sonstige Meta-Events

### Native V5.0.11 `MIDIParser.swift`

Der normale Dateiimport erhält ebenfalls nur:

- Noten
- Velocity
- Kanal
- Program Change
- CC-Controller
- Tempo
- Taktart
- Tonart
- Trackname

Pitch Bend, Aftertouch und SysEx werden beim normalen Dateiimport nicht in `me` übernommen. `me` ist im Native-Stand vor allem für DAW-Roundtrips vorgesehen und wird u. a. durch die REAPER-Bridge befüllt.

## Wichtig: Gate-Semantik

Eine Standard-MIDI-Datei enthält keine getrennten Werte für "notierte Dauer" und "Gate". Sie enthält nur Note-On und Note-Off, also die tatsächlich klingende Dauer.

Daraus folgt für einen verlustfreien MIDI-Datei-Roundtrip:

- importierte Dauer → `d`
- importiertes Gate → `g = 1.0`

WebApp `midi-core-1.1` folgt dieser Regel.

Native V5.0.11 setzt beim MIDI-Dateiimport derzeit dagegen `g = 0.95`. Da `MIDIBuilder.swift` beim Export `d * g` verwendet, kann ein MIDI→Score→MIDI-Roundtrip dort die Notendauer um 5 % verkürzen.

Empfehlung für eine spätere Native-Korrektur:

```swift
return [st, dur, Double(n.pitch), Double(n.velocity), 0, 1.0]
```

statt `0.95` für aus MIDI importierte Noten.

Das ändert nicht die Engine-Semantik für neu komponierte Noten. Es betrifft nur die Interpretation bereits klingender MIDI-Noten beim Import.

## Rolle von `me`

`me` ist nicht dasselbe wie `ct`.

- `ct` ist die einfache semantische Controllerdarstellung `[Beat, CC, Wert]`.
- `me` bewahrt rohe Nicht-Noten-MIDI-Nachrichten, z. B. Program Change, Pitch Bend, Pressure und DAW-spezifische Daten.

Native `MIDIBuilder.swift` exportiert `me` wieder, wobei Note-On/Off absichtlich nicht aus `me` übernommen werden, weil `nt` die Notenquelle ist.

Damit ergibt sich für den gemeinsamen Standard:

### Basis-MIDI-Kern

Verbindlich für alle drei Anwendungen:

- `nt`
- `ct`
- Kanal
- Programm
- Tempo
- Taktart
- Tonart
- Trackname

### Erweiterter DAW-MIDI-Kern

Optional, aber verlustfrei zu bewahren, wenn vorhanden:

- `me`

### Notationsschicht

Unabhängig von MIDI-I/O, aber im Score/CLAB zu bewahren:

- `ev`

## Architekturentscheidung

Der gemeinsame Score soll künftig folgende Track-Struktur als verbindliches Superset verwenden:

```json
{
  "nm": "Piano",
  "ch": 0,
  "pg": 0,
  "nt": [[0,1,60,80,1,0.95]],
  "ct": [[0,64,127]],
  "ev": [],
  "me": []
}
```

`ev` und `me` bleiben optional. Eine Anwendung, die sie nicht interpretiert, muss sie bei Dokument-/CLAB-Roundtrips trotzdem erhalten.

## Status

- WebApp Basis-MIDI-Roundtrip mit drei realen Dateien erfolgreich getestet.
- Native und WebApp sind beim normalen MIDI-Dateiimport funktional weitgehend deckungsgleich.
- WebApp `midi-core-1.1` hat beim Import die korrektere Gate-Semantik für verlustfreie Roundtrips.
- Native `me` ist eine wichtige Erweiterung für DAW-Roundtrips, aber derzeit keine Eigenschaft des normalen Native-MIDI-Dateiimports.

## Nächste Schritte

1. Diese Score-Superset-Struktur als gemeinsamen Projektstandard festhalten.
2. Native MIDI-Import später separat auf `g = 1.0` korrigieren.
3. WebApp `midi-core` später um `me`-Erfassung erweitern, bevor vollständige DAW-MIDI-Verlustfreiheit beansprucht wird.
4. Music Chat Lab gegen dasselbe Score-/MIDI-Schema prüfen.
5. Erst danach alten MIDI-Parser/-Builder aus dem WebApp-Monolithen entfernen.
