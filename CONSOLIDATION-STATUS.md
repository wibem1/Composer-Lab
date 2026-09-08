# Music Lab System – Konsolidierungsstatus

Stand: 8. September 2026

Diese Datei dient als zentrale Arbeitsliste für die laufende Aufräum- und Strukturierungsphase. Während dieser Phase sollen keine neuen Produktfunktionen begonnen werden, solange sie nicht unmittelbar der Konsolidierung dienen.

## A. Repositories und Rollen

### `wibem1/Composer-Lab`
Status: **AKTIV – Source of Truth für Composition Lab WebApp**

Erledigt:
- Root-Laufzeitpfad inventarisiert
- Dateien in ACTIVE, CORE-CANDIDATE, ADAPTER, LEGACY, TEST und ARCHIVE-CANDIDATE eingeordnet
- technische Inventur in `WEBAPP-INVENTORY.md` dokumentiert
- Konsolidierungsbranch `consolidation-webapp` angelegt

Wichtiger Befund:
- der aktuelle Root-`index.html` lädt direkt noch nicht den vorhandenen gemeinsamen Engine-14-Pfad
- im Repository existieren deshalb derzeit ein historisch gewachsener Root-Laufzeitpfad und ein neuerer `shared/`-Architekturpfad parallel

Nächste Aufgaben:
- im Branch `consolidation-webapp` einen einzigen nachvollziehbaren Bootstrap-Pfad herstellen
- Funktionsgleichheit mit dem aktuellen Root-Stand testen
- erst danach Altbestände physisch archivieren

### `wibem1/Composition-Lab-Native`
Status: **AKTIV – Source of Truth für Composition Lab Native, aber GitHub-Stand unvollständig**

Bekannter Referenzstand außerhalb des Repositories:
- V5.0.11
- Build 83
- Engine Build 14

Nächste Aufgabe mit höchster Priorität:
- vollständigen Referenzstand V5.0.11 unverändert in GitHub sichern

### `wibem1/Music-Chat-Lab`
Status: **AKTIV – Source of Truth für Music Chat Lab**

Nächste Aufgaben:
- Funktionsbestand mit Pages-Repository vergleichen
- neuere/fehlende Module aus Pages identifizieren
- danach einen eindeutigen, reproduzierbaren Hauptstand herstellen

### `wibem1/Music-Chat-Lab-Pages`
Status: **DEPLOYMENT – keine eigenständige Entwicklung**

Nächste Aufgaben:
- Unterschiede zum Entwicklungsrepository vollständig erfassen
- danach nur noch aus `Music-Chat-Lab` deployen

### `wibem1/Midi-Composer`
Status: **ARCHIV – historischer Vorläufer**

Hinweis: Die Archivkennzeichnung konnte wegen eines aktuellen 403-Schreibfehlers der GitHub-Integration noch nicht als README in diesem Repository gespeichert werden.

## B. Gemeinsamer Kern

Status der gemeinsamen Bereiche:

| Bereich | Referenz / Stand | Konsolidierungsziel |
|---|---|---|
| Score-Schema | weitgehend gemeinsam | verbindlich dokumentieren |
| Engine | Engine Build 14 | Änderungen künftig koordiniert |
| CLAB | Native V5.0.11 derzeit Referenz | gemeinsames Projektformat aller Apps |
| MIDI | mehrere Implementierungen | gemeinsame Semantik und Roundtrip-Regeln |
| MusicXML | Native am weitesten | gemeinsame Score-basierte Erzeugung |
| Provider-Adapter | mehrfach vorhanden | Schnittstellen angleichen, UI darf verschieden bleiben |

## C. Begriffe

Verbindliche Bedeutung:

- Projekt = `.clab`
- Austausch = MIDI / MusicXML
- Backup = App-Zustand / Einstellungen / Verlauf
- Verlauf = lokale Arbeitsgeschichte
- Engine = musikalische Kompositionslogik
- Score = gemeinsame strukturierte musikalische Repräsentation

## D. Klassifikation für Dateien

Jede historisch gewachsene Datei soll künftig einer dieser Kategorien zugeordnet werden:

- `ACTIVE` – aktuell geladen und produktiv benötigt
- `CORE` / `CORE-CANDIDATE` – gemeinsamer Kern bzw. Zielkern
- `LEGACY` – für Rückwärtskompatibilität noch nötig
- `TEST` – gezielter Test oder Experiment
- `ARCHIVE` / `ARCHIVE-CANDIDATE` – historisch, nicht mehr Teil der laufenden Anwendung

## E. Aktuelle Stop-Regel

Bis die Punkte 1–4 erledigt sind, keine neue Funktionsentwicklung:

1. Native V5.0.11 sichern
2. Music Chat Lab vs. Pages konsolidieren
3. Composer-Lab-Laufzeitpfad konsolidieren
4. gemeinsames Score-/CLAB-Schema verbindlich dokumentieren

## F. Branch-Hinweise

- `consolidation-webapp` = aktiver Aufräum- und Konsolidierungsbranch für Composition Lab WebApp
- `clab-webapp-v1` = isolierter CLAB-Kompatibilitätsversuch; derzeit nicht nach `main` übernehmen

Im Zuge früherer CLAB-Arbeit wurden zusätzlich mehrere kurzlebige Testbranches angelegt. Sie gehören nicht zum Zielzustand und sollen bei der späteren Branch-Bereinigung entfernt werden. Bis dahin dürfen sie nicht als Referenzstände verwendet werden.

## G. Nächster konkreter Arbeitsschritt

Im Branch `consolidation-webapp` wird nun ein eindeutiger WebApp-Laufzeitpfad vorbereitet. Ziel ist, die vorhandene gemeinsame Engine Build 14 und die gemeinsamen Adapter kontrolliert anstelle der gestapelten Inline-/Repair-Logik zu verwenden, ohne Funktionen zu verlieren.
