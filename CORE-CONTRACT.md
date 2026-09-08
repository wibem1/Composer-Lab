# Music Lab System – Gemeinsamer Kernvertrag

Stand: 8. September 2026
Status: verbindliche Architektur-Referenz für Composition Lab Native, Composition Lab WebApp und Music Chat Lab

## 1. Zweck

Dieses Dokument definiert den gemeinsamen musikalischen Daten- und Schnittstellenvertrag des Music-Lab-Systems. App-spezifische Oberflächen, Player, API-Einstellungen, Chat-Verläufe und Plattformadapter dürfen unterschiedlich sein. Der musikalische Kern darf jedoch nicht unabhängig auseinanderlaufen.

Die drei Hauptanwendungen sind:

- Composition Lab Native
- Composition Lab WebApp
- Music Chat Lab

## 2. Gemeinsames Score-Schema

Der Score ist die gemeinsame musikalische Repräsentation.

```json
{
  "ti": "Titel",
  "bpm": 96,
  "ts": {"n": 4, "d": 4},
  "k": "C major",
  "sm": "Kurze musikalische Zusammenfassung",
  "tr": [
    {
      "nm": "Piano",
      "ch": 0,
      "pg": 0,
      "nt": [[0.0, 1.0, 60, 80, 1, 1.0]],
      "ct": [[0.0, 64, 127]],
      "ev": [],
      "me": []
    }
  ]
}
```

### 2.1 Score-Felder

- `ti`: Titel
- `bpm`: Tempo in BPM
- `ts`: Taktart mit Zähler `n` und Nenner `d`
- `k`: Tonartbezeichnung
- `sm`: kurze musikalische Zusammenfassung / Konzeptbeschreibung
- `tr`: Array der Spuren

### 2.2 Track-Felder

- `nm`: Spur-/Instrumentname
- `ch`: MIDI-Kanal 0–15
- `pg`: MIDI-Programm 0–127
- `nt`: Noten
- `ct`: Controller-Ereignisse
- `ev`: optionale Notations-/Ausdrucksereignisse
- `me`: optionale rohe MIDI-Ereignisse

`ev` und `me` sind Teil des gemeinsamen Supersets. Eine Anwendung muss sie nicht selbst erzeugen oder interpretieren, sollte vorhandene Felder aber bei Projekt-Roundtrips nach Möglichkeit erhalten.

## 3. Noten-Semantik

Eine Note hat die Form:

```text
[StartBeat, Dauer, Pitch, Velocity, Staff, Gate]
```

Bedeutung:

- StartBeat: Startposition in Viertelnoten-Beats
- Dauer: notierter beziehungsweise semantischer Dauerwert in Viertelnoten-Beats
- Pitch: MIDI-Pitch 0–127
- Velocity: 1–127
- Staff: optionale Systemzuordnung, typischerweise 0=Standard, 1=oben/rechte Hand, 2=unten/linke Hand
- Gate: Faktor der tatsächlichen Klingdauer relativ zur Dauer

### 3.1 Gate-Regel bei MIDI-Import

Bei einem normalen MIDI-Dateiimport ist die gemessene Zeit zwischen Note-On und Note-Off bereits die tatsächliche Klingdauer. Da MIDI keine getrennte Information über „notierte Dauer“ und „Gate“ enthält, gilt:

- importierte MIDI-Klingdauer wird als `Dauer` übernommen
- `Gate` wird auf `1.0` gesetzt

Dadurch ist ein MIDI→Score→MIDI-Roundtrip zeitlich stabil.

Ein Gate kleiner oder größer als 1.0 soll nur verwendet werden, wenn diese Artikulationsinformation im Score bewusst erzeugt wurde, z. B. durch die KI, die Benutzeroberfläche oder eine Notationsquelle.

## 4. Controller-Semantik

Controller werden als

```text
[Beat, CC, Wert]
```

gespeichert.

Der gemeinsame Kern darf nicht künstlich auf eine kleine Whitelist von CC-Nummern beschränkt werden. Grundsätzlich sollen Standard-CC-Ereignisse 0–127 erhalten werden, soweit Parser und Exporter sie verarbeiten können.

## 5. Optionale Erweiterungen `ev` und `me`

### 5.1 `ev`

`ev` dient zusätzlichen Notations- und Ausdrucksinformationen, die nicht sinnvoll in `nt` oder `ct` passen, z. B. Artikulations-/Notationserweiterungen aus MusicXML oder Native-Funktionen.

### 5.2 `me`

`me` dient rohen MIDI-Ereignissen, insbesondere für DAW-Roundtrips und Informationen, die der vereinfachte Score-Kern nicht semantisch auflösen soll.

Mögliche Beispiele:

- Pitch Bend
- Channel Pressure / Aftertouch
- Poly Pressure
- zusätzliche Program-/Bank-Informationen
- andere nicht in `ct` abgebildete Channel Events

SysEx und proprietäre DAW-Daten dürfen nur dann in den gemeinsamen Vertrag aufgenommen werden, wenn Encoding, Speicherung und Roundtrip eindeutig definiert sind.

## 6. MIDI-Vertrag

### 6.1 Gemeinsamer Mindestumfang

MIDI-Import/-Export soll mindestens erhalten:

- Noten
- Startzeiten
- Klingdauern
- Velocity
- Kanäle
- Programme
- Controller
- Tempo
- Taktart
- Tonart, soweit als MIDI-Key-Signature vorhanden
- Tracknamen

### 6.2 Roundtrip-Regel

Für Daten innerhalb des zugesicherten gemeinsamen Umfangs gilt:

```text
MIDI → Score → MIDI → Score
```

soll musikalisch und zeitlich stabil sein.

Bytes müssen nicht identisch sein; semantische Kerndaten müssen es sein.

### 6.3 Erweiterter DAW-Roundtrip

DAW-Bridges dürfen `me` verwenden, um zusätzliche Rohereignisse zu erhalten. Diese Erweiterung gehört zum gemeinsamen Score-Superset, ist aber nicht Voraussetzung für einfache MIDI-Dateiimporte.

## 7. Engine-Vertrag

Engine Build 14 ist der aktuell eingefrorene gemeinsame musikalische Referenzstand.

Seine Aufgabe ist:

1. freien Benutzerauftrag möglichst wenig musikalisch überbestimmen
2. optional einen kurzen musikalischen Impuls/Konzeptgedanken erzeugen
3. eine Score-Partitur im gemeinsamen Schema erzeugen
4. vorhandenes musikalisches Material als Score-Kontext verwenden können

App-spezifische UI-Regeln, Chat-Logik und Download-Funktionen gehören nicht in die Engine.

Eine Änderung der musikalischen Prompt-Logik von Engine Build 14 muss künftig bewusst als Änderung des gemeinsamen Kerns behandelt und an allen betroffenen Anwendungen geprüft werden.

## 8. CLAB-Vertrag

CLAB ist das gemeinsame Arbeits- und Projektdokument für ein musikalisches Werk.

Aktueller Formatname:

```text
composition-lab-document
```

Aktuelle Version:

```text
1
```

CLAB enthält mindestens:

- Titel
- Score
- Konzept / musikalischen Impuls
- Provider und Modell, soweit vorhanden
- Takte
- Taktart
- Tempo
- Tonart
- Besetzung
- Kompositionsauftrag
- optionale Quelle (`sourceName`, `sourceScore`)
- optional originales MusicXML
- optionale Kosten-/Tokeninformationen

API-Schlüssel gehören niemals in CLAB.

### 8.1 Erhalt unbekannter Felder

Apps sollen bei einem CLAB-Laden-und-wieder-Speichern unbekannte oder zukünftige Felder möglichst erhalten, solange sie nicht bewusst ersetzt werden. Das gilt besonders für optionale Track-Felder wie `ev` und `me`.

## 9. Abgrenzung der Datenformate

- **Score** = interne gemeinsame musikalische Repräsentation
- **CLAB** = Arbeits-/Projektformat eines Werkes
- **MIDI** = universelles Wiedergabe-/DAW-Austauschformat
- **MusicXML** = Notationsaustausch
- **Backup** = gesamter App-Zustand, Verlauf, Einstellungen usw.
- **Verlauf** = lokale Arbeitsgeschichte der jeweiligen App

Diese Begriffe dürfen nicht mehr vermischt werden.

## 10. Zuständigkeiten der Anwendungen

### Composition Lab Native

- native macOS-Oberfläche
- erweiterte Notation/MusicXML-Funktionen
- DAW-Integrationen
- kann `ev` und `me` umfassender verwenden
- bleibt Referenz für das aktuelle CLAB-V1-Schema, bis der Vertrag gemeinsam weiterentwickelt wird

### Composition Lab WebApp

- Browser/PWA-Oberfläche
- gemeinsamer Engine-14-Pfad
- gemeinsamer Score-/MIDI-Kern
- Experimentallabor, Vergleich, Player, Storage über klar getrennte Adapter

### Music Chat Lab

- Chat-zentrierte Arbeit mit Musikdateien
- verwendet dasselbe Score-Basisschema
- soll MIDI-I/O schrittweise an denselben Core-Vertrag angleichen
- darf seine Chat- und Providerlogik app-spezifisch behalten

## 11. Aktuell bekannte Abweichungen

### Native V5.0.11

Beim normalen MIDI-Import wird aktuell für importierte Noten `Gate = 0.95` gesetzt, obwohl `Dauer` bereits der Note-On→Note-Off-Dauer entspricht. Für den gemeinsamen Vertrag ist `Gate = 1.0` die korrekte Regel. Native soll bei einer späteren gezielten Änderung daran angepasst werden.

### Music Chat Lab

Der aktuelle allgemeine MIDI-Parser übernimmt nur eine begrenzte CC-Auswahl (1, 7, 10, 11, 64) und keine Key-Signature. Das soll später an den gemeinsamen MIDI-Vertrag angeglichen werden.

### WebApp

Der neue `shared/midi-core.js` im Konsolidierungsbranch erfüllt den gemeinsamen Mindestumfang und wurde mit realen MIDI-Dateien roundtrip-getestet. Der historische Inline-MIDI-Code bleibt bis zum Abschluss der Konsolidierung als Sicherheitsnetz erhalten.

## 12. Entwicklungsregel

Ab jetzt gilt:

> Gemeinsame musikalische Semantik wird nur einmal definiert.

Neue Funktionen werden zuerst eingeordnet:

- gemeinsamer Kern
- App-Adapter
- Plattformadapter
- UI
- Archiv/Legacy

Nur wenn klar ist, zu welcher Ebene eine Änderung gehört, soll sie implementiert werden.

## 13. Versionsregel

Künftig getrennt angeben:

- Produktversion
- App-Build
- Core-/Engine-Version

Beispiel:

```text
Composition Lab Native 5.0.11 · Build 83 · Engine Build 14
```

Interne Bezeichnungen wie Repair Vxx, Interface Vxx oder output-v2 sind keine Produktversionen.
