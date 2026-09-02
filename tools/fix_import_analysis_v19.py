from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='</body>'
# Add a final, authoritative handler. Replacing the button node removes stale listeners
# from older patch versions without disturbing the visible UI.
if 'fix-import-analysis-v19' not in s:
    script=r'''
<script id="fix-import-analysis-v19">
(()=>{
  const oldBtn=document.getElementById('analyzeImportedBtn');
  if(!oldBtn) return;
  const btn=oldBtn.cloneNode(true);
  oldBtn.replaceWith(btn);

  function setStatus(msg, cls='ok'){
    const st=document.getElementById('status');
    if(st) st.innerHTML='<span class="'+cls+'">'+esc(msg)+'</span>';
  }
  function showBox(msg, cls=''){
    const section=document.getElementById('importedAnalysisSection');
    const box=document.getElementById('importedAnalysis');
    if(section){ section.style.display='block'; section.open=true; }
    if(box){ box.style.display='block'; box.innerHTML=cls?'<span class="'+cls+'">'+esc(msg)+'</span>':esc(msg); }
  }
  function compactScore(score){
    // Keep the musical structure, but cap very large imports so analysis requests
    // do not silently fail because of an oversized browser/API payload.
    const out={
      ti:score?.ti||'', sm:score?.sm||'', bpm:score?.bpm||96,
      ts:score?.ts||null, k:score?.k||'', tr:[]
    };
    const tracks=Array.isArray(score?.tr)?score.tr:[];
    const total=tracks.reduce((n,t)=>n+(Array.isArray(t?.nt)?t.nt.length:0),0);
    const cap=7000;
    const ratio=total>cap?cap/total:1;
    for(const t of tracks){
      const notes=Array.isArray(t?.nt)?t.nt:[];
      let kept=notes;
      if(ratio<1){
        const n=Math.max(24,Math.floor(notes.length*ratio));
        if(notes.length>n){
          kept=[];
          const step=notes.length/n;
          for(let i=0;i<n;i++) kept.push(notes[Math.min(notes.length-1,Math.floor(i*step))]);
        }
      }
      out.tr.push({n:t?.n||'', ch:t?.ch, pr:t?.pr, nt:kept, cc:Array.isArray(t?.cc)?t.cc.slice(0,1200):[]});
    }
    if(ratio<1) out.analysisNote='Sehr große MIDI-Datei: repräsentative Notenauswahl für die Analyse; Form/Spannungsverlauf anhand der zeitlich verteilten Ereignisse beurteilen.';
    return out;
  }

  btn.addEventListener('click',async()=>{
    if(typeof uploadedScore==='undefined' || !uploadedScore){
      setStatus('Bitte zuerst eine MIDI- oder JSON-Datei laden.','err');
      return;
    }
    const provider=document.getElementById('provider')?.value||'';
    const model=document.getElementById('model')?.value?.trim()||'';
    const apiKeyVal=document.getElementById('apiKey')?.value?.trim()||'';
    if(!apiKeyVal){
      setStatus('Bitte zuerst den API-Key der gewählten KI eingeben.','err');
      return;
    }
    btn.disabled=true;
    showBox('KI analysiert die importierte MIDI-Datei …');
    setStatus('KI analysiert die importierte MIDI-Datei …');
    try{
      const data=compactScore(uploadedScore);
      const task=`Gib eine kompakte musikalische Analyse der folgenden importierten MIDI-Komposition. Schreibe für einen Musiker, nicht als technische MIDI-Dokumentation. Maximal etwa 250 Wörter.\n\nGliedere nur in:\n1. Charakter und musikalische Idee\n2. Form, Motive, Harmonik und Rhythmik – knapp\n3. Stärken\n4. Mögliche Schwächen\n5. Zwei oder drei konkrete Verbesserungsideen\n\nTechnische MIDI-Details nur nennen, wenn sie musikalisch entscheidend sind. Erfinde nichts, was aus den Daten nicht ableitbar ist.\n\nDATEI: ${typeof uploadedName!=='undefined'&&uploadedName?uploadedName:(uploadedScore.ti||'Import')}\n\nMIDI-DATEN:\n${JSON.stringify(data)}`;
      const res=await callLLM(provider,model,apiKeyVal,SYSTEM_PREFIX,task,false);
      const text=(res&&typeof res==='object'?res.text:res)||'Die KI hat keine Analyse zurückgegeben.';
      const box=document.getElementById('importedAnalysis');
      if(box) box.textContent=text;
      setStatus('Analyse der importierten MIDI-Datei erstellt.');
    }catch(err){
      const msg=err?.message||String(err);
      showBox('Analyse fehlgeschlagen: '+msg,'err');
      setStatus('Analyse fehlgeschlagen: '+msg,'err');
    }finally{
      btn.disabled=false;
    }
  });

  // Repair the follow-up question handler from v12: callLLM needs systemPrompt + userPrompt
  const askOld=document.getElementById('askImportedAnalysisBtn');
  if(askOld){
    const ask=askOld.cloneNode(true); askOld.replaceWith(ask);
    ask.addEventListener('click',async()=>{
      const input=document.getElementById('importedAnalysisQuestion');
      const answer=document.getElementById('importedAnalysisAnswer');
      const q=input?.value?.trim()||'';
      if(!answer) return;
      answer.style.display='block';
      if(!q){ answer.textContent='Bitte zuerst eine Frage eingeben.'; return; }
      if(typeof uploadedScore==='undefined'||!uploadedScore){ answer.textContent='Keine importierte MIDI-Datei geladen.'; return; }
      const provider=document.getElementById('provider')?.value||'';
      const model=document.getElementById('model')?.value?.trim()||'';
      const apiKeyVal=document.getElementById('apiKey')?.value?.trim()||'';
      if(!apiKeyVal){ answer.textContent='Bitte zuerst den API-Schlüssel eintragen.'; return; }
      ask.disabled=true; answer.textContent='KI denkt über deine Frage nach …';
      try{
        const analysis=document.getElementById('importedAnalysis')?.textContent||'';
        const task=`Bisherige Kurzanalyse:\n${analysis}\n\nFrage des Musikers:\n${q}\n\nMIDI-Daten:\n${JSON.stringify(compactScore(uploadedScore))}`;
        const system='Du besprichst mit einem Musiker eine importierte MIDI-Komposition. Antworte konkret, knapp und musikalisch. Technische MIDI-Zahlen nur nennen, wenn sie wirklich nötig sind.';
        const res=await callLLM(provider,model,apiKeyVal,system,task,false);
        answer.textContent=(res&&typeof res==='object'?res.text:res)||'Keine Antwort erhalten.';
      }catch(err){ answer.textContent='Fehler bei der KI-Frage: '+(err?.message||err); }
      finally{ ask.disabled=false; }
    });
  }
})();
</script>
'''
    s=s.replace(marker,script+'\n'+marker,1)
# reset stale analysis section cleanly on every new import/clear where possible
s=s.replace('if($("importedAnalysis")){ $("importedAnalysis").style.display="none"; $("importedAnalysis").textContent="Noch keine Analyse."; }',
            'if($("importedAnalysis")){ $("importedAnalysis").style.display="block"; $("importedAnalysis").textContent="Noch keine Analyse."; } if($("importedAnalysisSection")){ $("importedAnalysisSection").style.display="none"; $("importedAnalysisSection").open=false; }')
# bump service worker URL
s=re.sub(r'navigator\.serviceWorker\.register\("\./service-worker\.js\?v=\d+"\)', 'navigator.serviceWorker.register("./service-worker.js?v=19")', s)
p.write_text(s,encoding='utf-8')
