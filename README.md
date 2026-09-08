# Composition Lab WebApp

Composition Lab ist die plattformübergreifende Web-/PWA-Fassung der gemeinsamen musikalischen Werkstatt.

## Rolle im Gesamtsystem

Dieses Repository ist die **aktive Quellbasis der Composition Lab WebApp**. Die WebApp gehört zusammen mit Composition Lab Native und Music Chat Lab zum übergeordneten Music-Lab-System.

Gemeinsame Grundlagen sollen nicht mehrfach unabhängig entwickelt werden. Insbesondere gelten als gemeinsame Kernbereiche:

- musikalisches Score-Schema
- Kompositionslogik / Engine Build 14
- CLAB-Projektdokument
- MIDI-Grundmodell
- MusicXML-Grundmodell

## Aktueller Stand

Die WebApp enthält neben der eigentlichen Komposition unter anderem Experimentierlabor, Vergleichslabor, MIDI-Import/-Export, Wiedergabe, Verlauf, Backup und gemeinsame Engine-/Storage-Module.

Der historisch gewachsene Quellbestand enthält zahlreiche ältere Interface-, Test- und Repair-Stände. Diese bleiben vorerst erhalten, werden aber künftig als **aktiv**, **gemeinsamer Kern**, **Test** oder **historisch** klassifiziert. Neue Funktionen sollen nicht mehr in alte Repair- oder Testpfade eingebaut werden.

## Entwicklungsregel

`main` ist der Referenzstand der laufenden WebApp. Experimentelle Änderungen erfolgen in eigenen Branches und werden erst nach Prüfung übernommen.

Der Branch `clab-webapp-v1` enthält einen ersten Versuch für Native-kompatible CLAB-Dokumente und bleibt bis zur abgeschlossenen Gesamtstrukturierung isoliert.

Weitere Architektur- und Entwicklungsregeln stehen in `SYSTEM-ARCHITECTURE.md` und `DEVELOPMENT-RULES.md`.
