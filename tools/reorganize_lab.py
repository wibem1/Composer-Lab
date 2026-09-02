from pathlib import Path
p=Path('index.html')
s=p.read_text()
start=s.index('<details class="labbox" id="experimentSection" open>')
end=s.index('</details>', start)+len('</details>')
block=s[start:end]
s=s[:start]+s[end:]
block=block.replace('<details class="labbox" id="experimentSection" open>', '<details class="labbox" id="experimentSection" style="grid-column:1 / -1; margin-top:8px;">',1)
block=block.replace('<summary>Experimentierlabor</summary>', '<summary>Experimentierlabor · optional</summary>',1)
block=block.replace('Hier entstehen Ausgangsideen oder Musikmaterial. Nichts wird automatisch als „richtig“ bewertet – du entscheidest, was interessant ist und was weiterentwickelt wird.', 'Optionaler Arbeitsbereich für musikalische Versuche. Experimentiere hier unabhängig von der eigentlichen Komposition. Erst wenn dir eine Vorlage gefällt, übernimmst du sie als vorhandenes Material und arbeitest oben mit der eigentlichen Kompositionsengine weiter.')
tech='<details style="grid-column:1 / -1;" class="foldbox" id="technicalSection">'
s=s.replace(tech, block+'\n\n  '+tech,1)
s=s.replace('<label>Vorhandenes Material hochladen (MIDI oder JSON)</label>', '<label>Vorlage / vorhandenes Material (MIDI oder JSON)</label>',1)
s=s.replace('Kein Material geladen.</div>', 'Keine Vorlage geladen.</div>',1)
s=s.replace('$("uploadInfo").textContent = "Kein Material geladen.";', '$("uploadInfo").textContent = "Keine Vorlage geladen.";',1)
old='const measures = Math.max(2, Math.min(32, parseInt($("measures").value,10) || 8));'
new='const measures = [2,4,8].includes(parseInt($("templateLength").value,10)) ? parseInt($("templateLength").value,10) : 4;'
assert old in s
s=s.replace(old,new,1)
old='''$("uploadInfo").textContent = `Als Vorlage aktiv: ${uploadedName} (${count} Noten)`;\n    $("status").innerHTML = `<span class="ok">„${esc(randomTemplateScore.ti)}“ ist jetzt als KI-Vorlage aktiviert.</span>`;'''
new='''$("uploadInfo").textContent = `Geladen: ${uploadedName} (${count} Noten) · aus Experimentierlabor`;\n    $("prompt").value = "";\n    saveCurrentState();\n    if($("experimentSection")) $("experimentSection").open = false;\n    $("status").innerHTML = `<span class="ok">„${esc(randomTemplateScore.ti)}“ wurde als Vorlage in die eigentliche Komposition übernommen.</span>`;'''
assert old in s
s=s.replace(old,new,1)
s=s.replace('🤖 Als Vorlage verwenden', '↗ In Komposition übernehmen')
s=s.replace('↗ Als Vorlage verwenden', '🎼 KI-Vorlage erzeugen')
s=s.replace('Nur die Länge der Vorlage. Die oben eingestellte Taktzahl bestimmt weiterhin die Länge des fertigen Stücks.', 'Länge der experimentellen Vorlage. Sie ist vollständig unabhängig von der oben eingestellten Länge des fertigen Stücks.')
p.write_text(s)