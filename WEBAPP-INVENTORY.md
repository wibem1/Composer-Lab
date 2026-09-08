# Composition Lab WebApp – technische Inventur

Stand: 8. September 2026

Diese Datei klassifiziert den historisch gewachsenen Bestand des Repositories. Sie ist Grundlage für die spätere physische Bereinigung. Noch wird nichts gelöscht oder verschoben.

## 1. Aktueller Root-Laufzeitpfad

Der produktive Root-Einstieg ist `index.html`.

Direkt von `index.html` geladen werden:

- `soundfont-player.js`
- `service-worker.js`
- `workspace-repair-v21.js`
- `diagnostics-v2.js`
- `comparison-chat-v27.js`

Wichtig: Der Root-`index.html` enthält zusätzlich sehr viel eigene Inline-Logik: Provider-Aufrufe, Komposition, MIDI-Builder, MIDI-Parser, Player, Verlauf, Experimentallabor, Vergleichslabor, Backup sowie zahlreiche spätere Patch-Blöcke.

### Kritischer Befund

Der Root-Einstieg lädt derzeit **nicht direkt**:

- `shared/composition-engine.js`
- `shared/root-engine-adapter.js`
- `shared/root-interface-v47.js`
- `shared/storage-engine.js`
- `shared/storage-adapter.js`

Damit existieren im Repository derzeit zwei parallele Architekturpfade:

1. der tatsächlich direkt gestartete, historisch gewachsene Root-`index.html`-Pfad
2. der neuere gemeinsame `shared/`-Pfad mit Engine Build 14 und Adaptern

Dieser Zustand muss vor weiterer Funktionsentwicklung vereinheitlicht werden.

## 2. Klassifikation

### ACTIVE – aktuell vom Root-Laufzeitpfad benötigt

- `index.html`
- `soundfont-player.js`
- `service-worker.js`
- `manifest.webmanifest`
- `icon-192.png`
- `icon-512.png`
- `workspace-repair-v21.js`
- `diagnostics-v2.js`
- `comparison-chat-v27.js`

Hinweis: `workspace-repair-v21.js` bezeichnet sich intern inzwischen als Repair V23. Die Dateibezeichnung und der interne Entwicklungsstand sind damit nicht mehr deckungsgleich.

### CORE-CANDIDATE – gemeinsamer Kern, vorhanden aber im Root-Pfad derzeit nicht direkt aktiv

- `shared/composition-engine.js` – Engine Build 14
- `shared/experiment-engine.js`
- `shared/storage-engine.js`
- `shared/gemini-model-config.js`

Diese Dateien sind konzeptionell der richtige Ort für gemeinsame Logik. Vor einer Bereinigung muss geprüft werden, welche Funktionen aus dem Inline-Root-Code vollständig dorthin verlagert werden können.

### ADAPTER / TARGET-CANDIDATE – für die konsolidierte WebApp vorgesehen

- `shared/root-engine-adapter.js`
- `shared/experiment-adapter.js`
- `shared/storage-adapter.js`
- `shared/root-interface-v47.js`

`shared/root-engine-adapter.js` ist besonders relevant: Er verbindet die WebApp mit `CompositionLabEngine` und lädt seinerseits Experiment- und Interface-Komponenten. Er ist damit ein sinnvoller Kandidat für den künftigen einheitlichen Root-Laufzeitpfad.

### PLATFORM / LEGACY-ADAPTER

- `shared/ipad-engine14-adapter.js`
- `shared/mac-engine14-adapter.js`
- `shared/rich-engine-adapter.js`

Diese Dateien sind nicht automatisch zu löschen. Sie müssen danach beurteilt werden, ob die jeweiligen Plattformpfade noch produktiv existieren oder bereits durch die gemeinsame PWA-/Native-Struktur ersetzt wurden.

### LEGACY-INTERFACE

Alle älteren Root-Interfaces vor dem festgelegten Zielstand:

- `shared/root-interface-v24.js` bis `shared/root-interface-v46.js`

Besonderheit:

- `root-interface-v45.js` und `root-interface-v46.js` sind byte-identisch und damit bereits nachweisbar redundant.

Ziel: Nach Verifikation des aktiven Zielinterfaces V47 in ein Archiv verschieben bzw. aus `main` entfernen; Git-Historie bleibt erhalten.

### TEST

- gesamter Ordner `tests/`
- `tests/concept-depth-ab/`
- `tests/universal-studio-exact-20260903/`

Diese Dateien dürfen bleiben, sollen aber klar Testmaterial bleiben und nie als Produktions-Entry-Point gelten.

### HISTORISCHE PLATFORM-PROTOTYPEN / ARCHIVE-CANDIDATE

- `mac-test/`
- `mac-test-v2/` bis `mac-test-v18/`
- `ipad-web-v1/`
- `ipad-web-v2/`
- `ipad-web-v3/`
- `ipad-engine14/`

Der aktuelle Ordner `ipad/` muss separat geprüft werden: Er kann noch ein Deployment-/Wrapperziel sein und wird deshalb vorerst nicht als Archiv markiert.

### MIGRATION-TOOLS / ARCHIVE-CANDIDATE

Der Ordner `tools/` enthält zahlreiche einmalige Python-Patcher, die historische Änderungen direkt in `index.html` eingebaut haben, unter anderem:

- `fix_import_analysis_v19.py`
- `fix_import_analysis_v20.py`
- `safe_import_playback_v10.py`
- `import_playback_v11.py`
- `backup_restore_v18.py`
- `free_comparison_chat_v20.py`
- weitere Versionspatcher

Diese Werkzeuge sind wertvolle Entwicklungsgeschichte, aber kein Produktcode. Nach Abschluss der Konsolidierung sollten sie geschlossen als historische Migrationstools archiviert werden.

### WORKFLOW-ALTRESTE / PRÜFEN

- `.github/workflows/fix-template-workflow-v5.yml`
- `.github/workflows/install-comparison-chat-v27.yml`

Beide Workflows tragen Versions-/Installationsnamen aus einer früheren Patchphase. Vor weiterer Verwendung muss geprüft werden, ob sie noch produktiv benötigt werden. Neue Architekturänderungen dürfen nicht mehr über solche Einmal-Patchworkflows erfolgen.

### UNKLAR / PRÜFEN

- `random-controls-v22.js`
- `ipad/`

Sie sind nicht direkt im Root-HTML-Ladepfad sichtbar und müssen vor einer Archiventscheidung auf externe Nutzung geprüft werden.

## 3. Wildwuchs innerhalb von `index.html`

Der Root-`index.html` ist derzeit mit rund 179 KB nicht nur Oberfläche, sondern enthält mehrere Generationen derselben Funktionen.

Nachgewiesene Beispiele:

- ursprünglicher GM-Player, danach `experiment-lab-v3-enhancements`, danach `safe-import-playback-v10`, danach `import-playback-v11`
- ursprüngliche MIDI-Analyse, danach `fix-import-analysis-v19`, danach `fix-import-analysis-v20`
- ursprüngliches Vergleichslabor plus spätere Chat-/Player-Overrides
- mehrere Speicher-/Backup-Generationen
- vielfach wiederholter identischer Codeblock innerhalb der importierten MIDI-Analyse

Die spätere Version überschreibt dabei häufig ältere Funktionen. Das funktioniert teilweise, ist aber schwer wartbar und birgt die Gefahr, dass ein alter Handler weiterhin parallel aktiv bleibt.

## 4. Zielstruktur für die WebApp

Nach erfolgreicher Verifikation soll der produktive Pfad ungefähr so aussehen:

```text
Composer-Lab/
├── index.html                 # möglichst nur UI-Grundgerüst / Bootstrap
├── manifest.webmanifest
├── service-worker.js
├── assets/
│   ├── icons
│   └── soundfont/player
├── shared/
│   ├── composition-engine.js  # gemeinsamer Engine-Kern
│   ├── score.js               # perspektivisch verbindliches Schema/Normalisierung
│   ├── midi.js                # Import/Export
│   ├── clab.js                # gemeinsames Projektdokument
│   ├── experiment-engine.js
│   └── storage-engine.js
├── webapp/
│   ├── interface.js
│   ├── player.js
│   ├── import.js
│   ├── comparison.js
│   └── storage-adapter.js
├── tests/
└── archive/
```

Diese Struktur ist Zielbild, nicht bereits durchgeführte Dateiverschiebung.

## 5. Nächste sichere Schritte

1. Einen Konsolidierungsbranch vom aktuellen `main` anlegen.
2. Dort einen **einzigen** WebApp-Bootstrap auf Basis der vorhandenen gemeinsamen Engine Build 14 herstellen.
3. Den aktuellen Root-Stand funktional dagegen testen: Komposition, Vorlage, Verlauf, Experimentallabor, Vergleichslabor, MIDI-Import/-Export, Player, Backup.
4. Erst nach identischem oder besserem Verhalten den neuen Laufzeitpfad übernehmen.
5. Danach alte Interface-Versionen, Mac-/iPad-Prototypen und Patchtools physisch in Archivbereiche verschieben oder aus `main` entfernen.

## 6. Grundsatz

Der bestehende funktionierende Root-Stand bleibt solange Referenz, bis der neue konsolidierte Pfad nachweislich dieselbe Funktionalität besitzt. Aufräumen darf keine versteckte Funktionsregression verursachen.
