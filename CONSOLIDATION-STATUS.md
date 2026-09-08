# Composition Lab – Konsolidierungsstatus

Stand: 2026-09-08
Status: **Konsolidierung abgeschlossen**

## Aktive Referenzen

- Composition Lab WebApp: `main` — **Engine Build 14 / CLAB v1**
- Composition Lab Native: `main` — **V5.0.12 / Build 84 / Engine Build 14 / CLAB v1**
- Native Referenz: `reference-v5.0.11` — unverändert erhalten
- Music Chat Lab: `main` — **v1.0.17 / Engine Build 14 / CLAB v1**
- Music Chat Lab Pages: `main` — reines Deployment mit byteidentischem Laufzeit-Snapshot, keine zweite Entwicklungsquelle

## Abgeschlossene Bereinigung

- Gemeinsamer Core-Vertrag (`CORE-CONTRACT.md`) als verbindliche Architektur-Referenz
- WebApp-Monolith und historische Inline-Repair-/Override-Kaskade aus dem aktiven Stand entfernt
- historische Mac-/iPad-Prototypen, Teststände, alte Interface-Versionen und Reparaturwerkzeuge aus dem aktiven WebApp-Baum entfernt
- WebApp startet direkt über den modularen gemeinsamen Bootstrap
- gemeinsamer MIDI-Core mit stabiler MIDI-Import-Regel `Gate = 1.0`
- Music Chat Lab auf gemeinsame MIDI-Semantik ausgerichtet: alle CCs, Key Signature, keine künstliche 5000-Event-Abschneidung, kein erfundener Staff bei normalem MIDI
- Music Chat Lab ohne historische `*-fix`, `*-vNN`- und alte `output`-Reparaturpfade
- Music Chat Lab Pages ist ausschließlich Deployment; der Laufzeit-Snapshot wird vom freigegebenen `Music-Chat-Lab/main` gespiegelt und nicht eigenständig weiterentwickelt
- Native vollständig materialisiert: 25 Swift-Dateien direkt unter `Sources/`, keine Source-ZIP und keine Entfaltungslogik im aktiven `main`
- Native MIDI-Gate-Korrektur
- MusicXML-`ev`-Import, zweistaffige Zuordnung, Tie-Import und Tie-Export
- EV Contract 1.1 und dokumentierte Roundtrip-Tests
- alte doppelte Native-Paketchronik aus dem aktiven Root entfernt
- CLAB v1 in WebApp und Music Chat Lab als produktiver Lese-/Schreibpfad implementiert
- automatisierte CLAB-v1-Semantiktests für WebApp und Music Chat Lab bestanden

## Gemeinsamer Vertragsstand

Der verbindliche gemeinsame Stand ist:

- Score-Schema: `ti`, `bpm`, `ts`, `k`, `sm`, `tr`
- Track-Superset: `nm`, `ch`, `pg`, `nt`, `ct`, optional `ev`, `me`
- Note: `[StartBeat, Dauer, Pitch, Velocity, Staff, Gate]`
- MIDI-Import: reale Note-On→Note-Off-Dauer wird mit `Gate = 1.0` übernommen
- Engine Build 14 bleibt eingefrorener gemeinsamer Kompositionskern
- CLAB-Vertrag: `composition-lab-document`, Version 1
- API-Schlüssel gehören niemals in `.clab`

## CLAB-Status

Composition Lab Native bleibt die Referenzimplementierung des Formats. WebApp und Music Chat Lab können denselben CLAB-v1-Dokumenttyp jetzt produktiv öffnen und speichern.

Gemeinsam geprüft sind insbesondere:

- Score inklusive `ev` und `me`
- Konzept / musikalischer Impuls
- Provider und Modell
- Takte, Taktart, Tempo, Tonart, Besetzung und Kompositionsauftrag
- `sourceName` / `sourceScore`
- Erhalt unbekannter zukünftiger Top-Level-Felder
- Erhalt von `originalMusicXMLData`
- keine API-Schlüssel und kein Chat-Verlauf in CLAB
- Legacy-Felder `midiData` / `musicXMLData` werden beim neuen Speichern nicht weitergeführt

Music Chat Lab übernimmt einen geöffneten CLAB-Score zusätzlich in einen freien MIDI-Speicherplatz und stellt ihn dem Chat als normalen Engine-14-Musikkontext zur Verfügung. Eine daraus neu erzeugte Komposition wird anschließend zum aktuellen CLAB-Projektstand.

## Alte Branches

Alte Entwicklungs-/Testbranches sind nicht Bestandteil der aktiven Architektur und dürfen später gelöscht werden, sobald keine historische Referenz mehr gewünscht ist.

### Composer-Lab – Löschkandidaten

- `android-v1`
- `android-v2`
- `android-v2-3`
- `backup/composition-lab-v2-before-cleanup-2026-09-07`
- `clab-compat-v1`
- `clab-webapp-v1`
- `clab-webapp-v1-test`
- `clab-webapp-v1-work`
- `clab-webapp-v1-final`
- `clab-webapp-v1-final2`
- `composition-lab-ipad-stable`
- `composition-lab-mac`
- `composition-lab-mac-v1`
- `composition-lab-v2`
- `consolidation-webapp`
- `test/concept-depth-ab`
- `webapp-clean-room`

### Composition-Lab-Native

- `native-core-alignment` — nach Übernahme in `main` nicht mehr als Entwicklungszweig nötig
- `reference-v5.0.11` — **behalten** als unveränderliche Referenz

### Music-Chat-Lab

- `consolidation-cleanup`
- `consolidation-v1.0.15`

### Music-Chat-Lab-Pages

- nur `main`; kein Aufräumbedarf

Die aktuelle GitHub-Schnittstelle dieser Sitzung bietet keine Branch-Löschung. Deshalb sind die Zweige dokumentiert, aber nicht entfernt.

## Historisches Midi-Composer-Repository

`wibem1/Midi-Composer` bleibt historischer Vorläufer. Eine eindeutige Archivkennzeichnung konnte wegen weiterhin bestehendem 403-Schreibschutz nicht gespeichert werden. Es ist **keine aktive Entwicklungsquelle**.

## Entwicklungsregel ab jetzt

Neue Arbeiten beginnen ausschließlich von den bereinigten `main`-Ständen. Änderungen am musikalischen Kern, Score-Schema, MIDI-/MusicXML-Semantik oder CLAB-Vertrag werden systemweit geprüft und nicht mehr app-spezifisch dupliziert.
