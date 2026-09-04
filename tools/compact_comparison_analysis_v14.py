from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='''const task=makePrompt?"Erstelle aus der Analyse einen konkreten, editierbaren Kompositionsauftrag. Benenne ausdrücklich, welche musikalischen Merkmale aus Quelle A und welche aus Quelle B übernommen, kombiniert oder weiterentwickelt werden sollen. Das Ergebnis soll ein eigenständiges neues Stück C ermöglichen.":"Vergleiche beide musikalischen Quellen präzise. Untersuche Motivik, Rhythmik, Harmonik, Begleitmuster, Form, Satztechnik, Instrumentation, Artikulation, Dynamik und Charakter. Benenne besonders brauchbare Merkmale beider Quellen und sinnvolle Möglichkeiten ihrer Kombination. Keine bloße Siegerwertung.";'''
new='''const task=makePrompt?"Erstelle aus dem Vergleich einen kurzen, konkreten und editierbaren Kompositionsauftrag. Benenne klar, welche 1–2 Merkmale aus Quelle A und welche 1–2 Merkmale aus Quelle B übernommen oder weiterentwickelt werden sollen. Maximal etwa 120 Wörter. Das Ergebnis soll ein eigenständiges neues Stück C ermöglichen.":"Vergleiche beide musikalischen Quellen kurz und musikalisch. Maximal etwa 220 Wörter. Keine technische Detailanalyse und keine langen Einzelkapitel. Gliedere nur in: 1. Quelle A – charakteristische Idee und stärkste Merkmale, 2. Quelle B – charakteristische Idee und stärkste Merkmale, 3. wichtigste Unterschiede, 4. zwei oder drei besonders sinnvolle Möglichkeiten der Kombination. MIDI-Technik, Kanalnummern, exakte Velocities, Beat-Positionen und ähnliche Zahlen nur nennen, wenn sie musikalisch wirklich entscheidend sind. Keine bloße Siegerwertung.";'''
if old in s:
    s=s.replace(old,new,1)
elif 'Vergleiche beide musikalischen Quellen kurz und musikalisch.' not in s:
    raise SystemExit('comparison task marker not found')
p.write_text(s,encoding='utf-8')
