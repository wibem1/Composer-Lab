from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='''    <div id="importedAnalysis" class="resultcard" style="display:none;margin-top:8px;white-space:pre-wrap;">Noch keine Analyse.</div>'''
new='''    <details id="importedAnalysisSection" class="foldbox" style="display:none;margin-top:8px;">
      <summary>KI-Analyse der importierten MIDI-Datei</summary>
      <div class="foldcontent">
        <div id="importedAnalysis" class="resultcard" style="white-space:pre-wrap;">Noch keine Analyse.</div>
        <div class="chatrow" style="margin-top:9px;">
          <textarea id="importedAnalysisQuestion" style="min-height:58px;" placeholder="Frage zur Analyse, z. B. „Was würdest du verbessern?“"></textarea>
          <button id="askImportedAnalysisBtn" class="secondary" type="button">KI fragen</button>
        </div>
        <div id="importedAnalysisAnswer" class="resultcard" style="display:none;margin-top:8px;white-space:pre-wrap;"></div>
      </div>
    </details>'''
if old in s:
    s=s.replace(old,new,1)
# make existing analysis display the section, not rely only on result div
s=s.replace('''    box.style.display="block";
    box.textContent="KI analysiert die importierte MIDI-Datei …";''','''    const section=document.getElementById("importedAnalysisSection");
    if(section){ section.style.display="block"; section.open=true; }
    box.style.display="block";
    box.textContent="KI analysiert die importierte MIDI-Datei …";''',1)
start='''const task=`Analysiere die folgende importierte MIDI-Komposition musikalisch und nicht nur technisch. Untersuche insbesondere:
- Form und Spannungsverlauf
- Hauptmotive und ihre Entwicklung
- Melodik und Phrasierung
- Harmonik und Tonalität
- Rhythmik und Metrik
- Begleitmuster und Satzstruktur
- Stimmführung bzw. Zusammenspiel der Instrumente
- Dynamik und Artikulation, soweit aus den MIDI-Daten erkennbar
- charakteristische Stärken und mögliche handwerkliche oder musikalische Schwächen
- konkrete Möglichkeiten zur Weiterentwicklung, Variation oder Fortsetzung

Trenne Beobachtung und Bewertung sauber. Erfinde nichts, was aus den MIDI-Daten nicht ableitbar ist. Beziehe dich bei wichtigen Aussagen möglichst konkret auf musikalische Ereignisse oder Abschnitte.'''
compact='''const task=`Gib eine kompakte musikalische Analyse der folgenden importierten MIDI-Komposition. Schreibe für einen Musiker, nicht als technische MIDI-Dokumentation. Maximal etwa 250 Wörter und möglichst ohne unnötige Zahlenwerte.

Gliedere nur in:
1. Charakter und musikalische Idee
2. Form, Motive, Harmonik und Rhythmik – knapp zusammengefasst
3. Stärken
4. Mögliche Schwächen
5. Zwei oder drei konkrete Verbesserungsideen

Technische MIDI-Details wie Kanalnummern, exakte Velocities, Beat-Positionen oder Gate-Zeiten nur nennen, wenn sie für die musikalische Beurteilung wirklich entscheidend sind. Erfinde nichts, was aus den MIDI-Daten nicht ableitbar ist.'''
if start in s:
    s=s.replace(start,compact,1)
# append Q&A script before body end
marker='</body>'
script=r'''
<script id="interactive-import-analysis-v12">
(()=>{
  const btn=document.getElementById('askImportedAnalysisBtn');
  const input=document.getElementById('importedAnalysisQuestion');
  const answer=document.getElementById('importedAnalysisAnswer');
  if(!btn||!input||!answer) return;
  btn.addEventListener('click',async()=>{
    const q=input.value.trim();
    if(!q){ answer.style.display='block'; answer.textContent='Bitte zuerst eine Frage eingeben.'; return; }
    if(typeof uploadedScore==='undefined'||!uploadedScore){ answer.style.display='block'; answer.textContent='Keine importierte MIDI-Datei geladen.'; return; }
    const p=document.getElementById('provider')?.value;
    const model=document.getElementById('model')?.value;
    const apiKey=document.getElementById('apiKey')?.value.trim();
    if(!apiKey){ answer.style.display='block'; answer.textContent='Bitte zuerst den API-Schlüssel eintragen.'; return; }
    const analysis=document.getElementById('importedAnalysis')?.textContent||'';
    btn.disabled=true; answer.style.display='block'; answer.textContent='KI denkt über deine Frage nach …';
    try{
      const task=`Du besprichst mit einem Musiker eine importierte MIDI-Komposition. Antworte konkret, knapp und musikalisch auf seine Frage. Nutze die vorhandene Kurzanalyse und bei Bedarf die strukturierten MIDI-Daten. Technische MIDI-Zahlen nur nennen, wenn sie wirklich nötig sind.\n\nBisherige Analyse:\n${analysis}\n\nFrage:\n${q}\n\nMIDI-Daten:\n${JSON.stringify(uploadedScore)}`;
      const text=await callLLM(p,model,apiKey,task);
      answer.textContent=text;
    }catch(err){ answer.textContent='Fehler bei der KI-Frage: '+(err?.message||err); }
    finally{ btn.disabled=false; }
  });
})();
</script>
'''
if 'interactive-import-analysis-v12' not in s:
    s=s.replace(marker,script+marker,1)
p.write_text(s,encoding='utf-8')
