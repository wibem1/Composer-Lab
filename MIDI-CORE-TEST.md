# Composition Lab WebApp – MIDI-Core Roundtrip-Test

Stand: 8. September 2026
Branch: `consolidation-webapp`

## Ziel

Prüfung des neuen `shared/midi-core.js` an realen MIDI-Dateien aus bisherigen Composition-Lab-/Music-Chat-Lab-Tests.

## Testdateien

1. `Abendrose_Variation_96BPM.mid`
2. `Sonnentanz (Allegretto grazioso).mid`
3. `Nocturne_in_c-Moll_Test(1).mid`

Die Dateien unterscheiden sich in Größe, Spurzahl, Instrumentierung und Controller-Dichte.

## Testverfahren

Für jede Datei:

1. MIDI mit `CompositionLabMIDICore.parse()` in das gemeinsame Score-Schema einlesen.
2. Score mit `CompositionLabMIDICore.build()` wieder als MIDI schreiben.
3. Die erzeugte MIDI-Datei erneut mit demselben Kern einlesen.
4. Import-Score und Roundtrip-Score vergleichen.

Verglichen wurden:

- Tempo
- Taktart
- Tonart-Metaangabe
- Zahl der musikalischen Score-Spuren
- MIDI-Kanäle
- Programme
- Tracknamen
- Notenzahl
- Controllerzahl
- Startzeit jeder Note
- Dauer jeder Note
- Pitch jeder Note
- Velocity jeder Note

## Gefundener Fehler und Korrektur

In `midi-core-1.0` wurde die reale MIDI-Klingdauer beim Import als `d` übernommen, zugleich aber `gate=0.95` gesetzt. Beim erneuten Export wurde die Klingdauer dadurch noch einmal mit 0,95 multipliziert und jede Note verkürzt.

Korrektur in `midi-core-1.1`:

- Bei MIDI-Import wird die aus Note-On/Note-Off bestimmte reale Klingdauer als `d` gespeichert.
- Da MIDI allein keine getrennte notierte Dauer und Gate-Information liefert, wird für importierte MIDI-Noten `gate=1.0` gesetzt.

Damit wird keine nicht vorhandene Artikulationsinformation erfunden und der MIDI-Roundtrip bleibt zeitlich stabil.

## Ergebnisse nach Korrektur

### Abendrose_Variation_96BPM.mid

- Tempo: 96 → 96 BPM
- Taktart: 4/4 → 4/4
- Score-Spuren: 1 → 1
- Noten: 377 → 377
- Controller: 64 → 64
- maximale Abweichung Startzeit: 0
- maximale Abweichung Dauer: 0
- maximale Abweichung Pitch: 0
- maximale Abweichung Velocity: 0

### Sonnentanz (Allegretto grazioso).mid

- Tempo: 112 → 112 BPM
- Taktart: 4/4 → 4/4
- Score-Spuren: 2 → 2
- Instrumente/Programme: Violine (40), Klavier (0) erhalten
- Noten: 473 → 473
- Controller: 5 → 5
- maximale Abweichung Startzeit: 0
- maximale Abweichung Dauer: 0
- maximale Abweichung Pitch: 0
- maximale Abweichung Velocity: 0

### Nocturne_in_c-Moll_Test(1).mid

- Tempo: 96 → 96 BPM
- Taktart: 4/4 → 4/4
- Score-Spuren: 1 → 1
- Noten: 385 → 385
- Controller: 78 → 78
- maximale Abweichung Startzeit: 0
- maximale Abweichung Dauer: 0
- maximale Abweichung Pitch: 0
- maximale Abweichung Velocity: 0

## Tonart-Hinweis

Alle drei Testdateien liefern im MIDI-Metadaten-Roundtrip `C major`. Das bedeutet nicht, dass die Musik musikalisch in C-Dur stehen muss. Der Kern liest und schreibt die tatsächlich vorhandene MIDI-Key-Signature-Metaangabe; der Dateiname oder eine harmonische Analyse wird nicht zur Tonartbestimmung benutzt.

## Freigegebener Umfang von midi-core-1.1

Für den getesteten gemeinsamen Kernumfang ist der Roundtrip technisch stabil:

- Noten
- Startzeiten
- Dauern
- Pitch
- Velocity
- Kanäle
- Programme
- Controller
- Tempo
- Taktart
- Key-Signature-Metaangabe
- Tracknamen

## Noch nicht als verlustlos freigegeben

Der Kern behauptet ausdrücklich keine vollständige Erhaltung von:

- Pitch Bend
- Channel/Poly Aftertouch
- SysEx
- beliebigen Meta-Events
- DAW-spezifischen Raw-MIDI-Events
- Native-`me`-Daten
- Native-`ev`-Notation-/Expressionsdaten

Diese Bereiche müssen beim Abgleich mit Composition Lab Native V5.0.11 gesondert behandelt werden.

## Konsequenz

`midi-core-1.1` ist für den gemeinsamen Basisumfang ein belastbarer Kernkandidat. Die alten Root-MIDI-Implementierungen werden trotzdem noch nicht gelöscht. Vorher folgt der direkte Vergleich mit Native V5.0.11 und anschließend ein WebApp-Funktionstest des Konsolidierungsbranches.
