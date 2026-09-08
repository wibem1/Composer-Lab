# Music Lab System – Gesamtarchitektur

Stand: 8. September 2026

## 1. Ziel

Die laufenden Musikprojekte werden als zusammenhängendes System entwickelt und nicht als voneinander unabhängige Einzelprogramme. Unterschiedliche Bedienkonzepte sind ausdrücklich gewünscht; gemeinsame musikalische Datenmodelle und Austauschformate sollen dagegen verbindlich sein.

Die verbindliche Detaildefinition des gemeinsamen musikalischen Kerns steht in `CORE-CONTRACT.md`. Dieses Dokument beschreibt die Systemstruktur und die Zuständigkeiten der Projekte.

## 2. Aktive Anwendungen

### Composition Lab WebApp
Repository: `wibem1/Composer-Lab`

Rolle: plattformübergreifende Web-/PWA-Kompositionswerkstatt für Android, iPad und Browser.

### Composition Lab Native
Repository: `wibem1/Composition-Lab-Native`

Rolle: native macOS-Fassung mit weitergehender System-, MusicXML- und DAW-Integration.

Referenzstand außerhalb des derzeit unvollständigen GitHub-Repositories: Composition Lab Native V5.0.11, Build 83, Engine Build 14. Dieser Stand muss unverändert sauber in GitHub gesichert werden, bevor dort weiterentwickelt wird.

### Music Chat Lab
Entwicklungsrepository: `wibem1/Music-Chat-Lab`

Rolle: chatzentrierte musikalische Arbeitsumgebung mit Claude, Gemini und OpenAI sowie MIDI-/MusicXML-Kontext.

Das Repository `wibem1/Music-Chat-Lab-Pages` ist kein eigenständiges Entwicklungsprojekt, sondern soll nur Deployment-/Pages-Zwecken dienen. Die Entwicklung hat in `Music-Chat-Lab` stattzufinden.

## 3. Historisches Projekt

### Midi-Composer
Repository: `wibem1/Midi-Composer`

Status: historischer Vorläufer von Composition Lab. Keine neue Entwicklung. Der Stand bleibt als Archiv und Referenz erhalten.

## 4. Gemeinsamer Kern

Folgende Bereiche sind systemweit und dürfen nicht unkoordiniert in mehreren Apps auseinanderentwickelt werden:

1. **Score-Schema**
   - Titel `ti`
   - Tempo `bpm`
   - Taktart `ts`
   - Tonart `k`
   - Zusammenfassung `sm`
   - Tracks `tr`
   - Noten `nt`
   - Controller `ct`
   - optionale Notations-/Ausdrucksereignisse `ev`
   - optionale rohe MIDI-Ereignisse `me`

2. **Kompositionslogik**
   - derzeitige musikalische Referenz: Engine Build 14
   - Änderungen an der musikalischen Kernlogik müssen bewusst systemweit bewertet werden

3. **CLAB-Projektdokument**
   - gemeinsames Projektdokument für Composition Lab Native, Composition Lab WebApp und perspektivisch Music Chat Lab
   - der interne Score ist die maßgebliche musikalische Repräsentation
   - MIDI und MusicXML sind Austausch-/Exportdarstellungen und nicht konkurrierende Masterdaten

4. **MIDI-Grundmodell**
   - Import, strukturierte Repräsentation und Export folgen der in `CORE-CONTRACT.md` festgelegten Semantik
   - normale MIDI-Dateiimporte setzen bei gemessener Note-On→Note-Off-Dauer `Gate = 1.0`

5. **MusicXML-Grundmodell**
   - MusicXML soll aus dem strukturierten Score erzeugt werden
   - unveränderte Original-MusicXML-Daten dürfen bei Projektroundtrips zusätzlich erhalten bleiben

## 5. Anwendungsspezifische Verantwortung

### Composition Lab WebApp
Darf eigene UI-, PWA-, Browser-, Android- und iPad-spezifische Logik besitzen.

### Composition Lab Native
Darf native macOS-, MIDI-Ausgangs-, Partitur-, MusicXML- und DAW-spezifische Funktionen besitzen.

### Music Chat Lab
Darf ein eigenständiges Chat-, Gesprächs- und Dateikontextmodell besitzen. Wenn Musik erzeugt oder als Projekt weitergegeben wird, soll es jedoch dieselben Score-/CLAB-Grundlagen verwenden.

## 6. DAW-Anbindungen

DAW-Anbindungen sind Adapter und keine eigenen musikalischen Engines.

- REAPER Bridge
- Ableton/Max-for-Live-Bridge

Sie sollen Musik zwischen DAW und Composition Lab transportieren, ohne eine weitere konkurrierende Score- oder Kompositionslogik einzuführen.

## 7. Dateitypen und Bedeutung

- `.clab` = einzelnes musikalisches Projekt / Werkzustand
- `.mid` / `.midi` = musikalisches Austauschformat
- `.musicxml` / `.xml` = Notationsaustauschformat
- Backup = Sicherung von App-Zustand, Verlauf und Einstellungen
- Verlauf = lokale Arbeitsgeschichte, nicht Bestandteil eines einzelnen CLAB-Werks
- JSON = internes/technisches Diagnose- oder Austauschformat; nicht automatisch ein Projektformat

## 8. Versionssystem

Künftig werden drei Ebenen unterschieden:

1. Produktversion, z. B. `Composition Lab Native 5.0.11`
2. App-Build, z. B. `Build 83`
3. gemeinsame Kern-/Engine-Version, derzeit `Engine Build 14`

Bezeichnungen wie Repair Vxx, Interface Vxx oder output-vX bleiben interne Entwicklungsmarker und sollen nicht die Produktidentität bestimmen.

## 9. Entwicklungsprinzip

Vor neuen Funktionen gilt:

- zuerst prüfen, ob die Änderung zum gemeinsamen Kern oder nur zu einer App gehört
- gemeinsame Kernänderungen nicht mehrfach separat implementieren
- experimentelle Änderungen in Branches
- keine direkte Weiterentwicklung in Deployment- oder Archiv-Repositories
- Altbestände zunächst klassifizieren, erst danach löschen oder verschieben
- funktionierende Referenzstände müssen reproduzierbar in GitHub gesichert sein
- `CORE-CONTRACT.md` ist bei Änderungen gemeinsamer musikalischer Semantik mitzupflegen

## 10. Aktueller Konsolidierungsstand

Bereits erledigt:

1. Repository-Rollen geklärt
2. WebApp technisch inventarisiert
3. WebApp-Konsolidierungsbranch angelegt
4. Engine-14-, Storage-, Player-, MIDI-Analyse- und Vergleichspfade modularisiert
5. eigenständigen WebApp-MIDI-Kern erstellt und mit realen MIDI-Dateien roundtrip-getestet
6. Native V5.0.11 gegen den gemeinsamen MIDI-/Score-Vertrag abgeglichen
7. Music Chat Lab gegen denselben Vertrag abgeglichen
8. gemeinsamen Kernvertrag in `CORE-CONTRACT.md` festgelegt

Als Nächstes:

1. Composition Lab Native V5.0.11 unverändert vollständig in GitHub sichern
2. Music Chat Lab gezielt an den gemeinsamen MIDI-Vertrag angleichen
3. WebApp alten Inline-MIDI-/Player-/Analyse-/Vergleichscode erst nach Testfreigabe physisch entfernen oder archivieren
4. CLAB-Kompatibilität aller drei Anwendungen abschließen
5. danach normale Funktionsentwicklung wieder aufnehmen
