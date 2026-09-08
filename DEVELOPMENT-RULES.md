# Entwicklungsregeln für das Music-Lab-System

## Grundsatz

Das System besteht aus mehreren Anwendungen mit einem gemeinsamen musikalischen Kern. Neue Funktionen dürfen nicht dazu führen, dass sich Score, Engine, CLAB oder Musikdatei-Logik unbemerkt auseinanderentwickeln.

## Vor jeder Änderung

1. Ist die Änderung **gemeinsamer Kern** oder **anwendungsspezifisch**?
2. Gibt es dieselbe Logik bereits in einem anderen Projekt?
3. Muss ein Austauschformat oder Schema angepasst werden?
4. Ist der aktuelle Referenzstand vollständig in GitHub gesichert?

## Gemeinsamer Kern

Änderungen an diesen Bereichen müssen systemweit betrachtet werden:

- Engine / musikalische Kompositionslogik
- Score-Schema
- CLAB
- MIDI-Grundmodell
- MusicXML-Grundmodell

## Branch-Regel

- `main` enthält einen geprüften Referenzstand.
- Experimente und größere Umbauten erfolgen in eigenen Branches.
- Ein Experiment wird erst nach Funktions- und Kompatibilitätsprüfung nach `main` übernommen.

## Repository-Regeln

- `Composer-Lab`: aktive WebApp-Entwicklung
- `Composition-Lab-Native`: aktive Native-Entwicklung
- `Music-Chat-Lab`: aktive Music-Chat-Lab-Entwicklung
- `Music-Chat-Lab-Pages`: Deployment, keine unabhängige Entwicklung
- `Midi-Composer`: Archiv, keine neue Entwicklung

## Umgang mit Altbestand

Alte Dateien werden nicht sofort gelöscht. Sie werden zuerst einer Kategorie zugeordnet:

- ACTIVE – Teil des aktuellen Produkts
- CORE – gemeinsamer Kern
- TEST – gezielter Test-/Experimentstand
- LEGACY – historisch noch aus Kompatibilitätsgründen benötigt
- ARCHIVE – nur noch Dokumentation/Vorgeschichte

Erst wenn klar ist, dass eine Datei weder ACTIVE, CORE noch LEGACY ist, darf sie aus dem aktiven Pfad entfernt werden.

## Versionsregeln

Künftig sollen Produktversion, App-Build und gemeinsame Engine-Version getrennt geführt werden. Interne Repair-/Interface-Dateinummern sind keine Produktversionen.

## Keine versteckte Doppelentwicklung

Wenn eine Funktion in mehreren Anwendungen benötigt wird, soll sie entweder als gemeinsamer Baustein oder anhand einer verbindlichen Spezifikation umgesetzt werden. Copy-and-paste-Varianten mit später auseinanderlaufenden Änderungen sollen vermieden werden.
