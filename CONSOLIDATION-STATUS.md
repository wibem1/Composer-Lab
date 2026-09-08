# Composition Lab – Konsolidierungsstatus

Stand: 2026-09-08

## Ziel

Der aktive Entwicklungsstand soll frei von historischen Plattformprototypen, Reparaturschichten und redundanten Implementierungen sein. Neue Funktionen werden erst wieder begonnen, wenn die Konsolidierung abgeschlossen und geprüft ist.

## Aktive Referenzen

- WebApp: `consolidation-webapp`
- Native: `native-core-alignment`
- Native Referenz: `reference-v5.0.11` (unverändert)
- Music Chat Lab: `main`
- Music Chat Lab Pages: Deployment only

## Bereits konsolidiert

- Gemeinsamer Core-Vertrag (`CORE-CONTRACT.md`)
- MIDI-Core mit korrektem Import-Gate 1.0
- Native MIDI-Gate-Korrektur
- MusicXML-`ev`-Import
- MusicXML Tie-Import und Tie-Export
- EV Contract 1.1
- Historische Mac-/iPad-Prototypordner aus dem aktiven WebApp-Entwicklungsbaum entfernt
- Historische Installations-Workflows aus dem aktiven WebApp-Entwicklungsbaum entfernt

## Noch offen

1. WebApp-Monolith: historische Inline-Parser, Player, Repair- und Override-Schichten endgültig entfernen und ausschließlich die konsolidierten Module laden.
2. WebApp-Rootdateien: nur tatsächlich benötigte Laufzeitdateien behalten.
3. Music Chat Lab: MIDI-Parser/-Builder auf gemeinsamen Core-Vertrag ausrichten (alle CCs, Key Signature, gemeinsame Semantik).
4. Music Chat Lab: aktive Dateien von `output.js`/`output-v2.js` und sonstigen Legacy-Kandidaten trennen bzw. entfernen.
5. Music-Chat-Lab-Pages: auf reines Deployment reduzieren.
6. Historisches `Midi-Composer`: eindeutig als Archiv kennzeichnen, soweit Schreibrechte dies zulassen.
7. Alte Composer-Lab-Branches löschen. Die aktuelle GitHub-Schnittstelle erlaubt in dieser Sitzung keine Branch-Löschung; Löschkandidaten werden separat dokumentiert.
8. `.clab`-Kompatibilität erst nach der Code-Entrümpelung abschließend integrieren und testen.

## Regel bis Abschluss

Keine neue Produktfunktion. Jede Änderung muss entweder Altcode entfernen, gemeinsame Semantik vereinheitlichen, Referenzstände sichern oder Tests/Dokumentation verbessern.
