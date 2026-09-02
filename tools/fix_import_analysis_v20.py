from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='</body>'
if 'fix-import-analysis-v20' not in s:
    script=r'''
<script id="fix-import-analysis-v20">
(()=>{
  function esc2(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function show(msg, cls='ok'){
    const section=document.getElementById('importedAnalysisSection');
    const box=document.getElementById('importedAnalysis');
    if(section){section.style.display='block';section.open=true;}
    if(box){box.style.display='block';box.innerHTML='<span class="'+cls+'">'+esc2(msg)+'</span>';}
    const st=document.getElementById('status');
    if(st) st.innerHTML='<span class="'+cls+'">'+esc2(msg)+'</span>';
  }
  function compact(score){
    const tracks=Array.isArray(score?.tr)?score.tr:[];
    const out={ti:score?.ti||'',sm:score?.sm||'',bpm:score?.bpm||96,ts:score?.ts||null,k:score?.k||'',tr:[]};
    let total=tracks.reduce((n,t)=>n+(Array.isArray(t?.nt)?t.nt.length:0),0);
    const cap=5000, ratio=total>cap?cap/total:1;
    for(const t of tracks){
      const notes=Array.isArray(t?.nt)?t.nt:[];
      let kept=notes;
      if(ratio<1 && notes.length){
        const n=Math.max(16,Math.floor(notes.length*ratio));
        kept=[]; const step=notes.length/Math.max(1,n);
        for(let i=0;i<n;i++) kept.push(notes[Math.min(notes.length-1,Math.floor(i*step))]);
      }
      out.tr.push({nm:t?.nm||t?.n||'',ch:t?.ch,pg:t?.pg,nt:kept,ct:Array.isArray(t?.ct)?t.ct.slice(0,600):[]});
    }
    return out;
  }
  async function analyse(btn){
    show('Analyse wird gestartet …');
    if(typeof uploadedScore==='undefined'||!uploadedScore){show('Keine importierte MIDI-Datei geladen.','err');return;}
    const provider=document.getElementById('provider')?.value||'';
    const model=document.getElementById('model')?.value?.trim()||'';
    const apiKey=document.getElementById('apiKey')?.value?.trim()||'';
    if(!apiKey){show('Für die KI-Analyse fehlt der API-Key der gewählten KI.','err');return;}
    if(!model){show('Für die KI-Analyse ist kein Modell ausgewählt.','err');return;}
    btn.disabled=true;
    show('KI analysiert die importierte MIDI-Datei …');
    try{
      const data=compact(uploadedScore);
      const task=`Gib eine kompakte musikalische Analyse dieser importierten MIDI-Komposition, maximal etwa 250 Wörter. Gliedere in: 1. Charakter und musikalische Idee, 2. Form/Motive/Harmonik/Rhythmik, 3. Stärken, 4. mögliche Schwächen, 5. zwei oder drei konkrete Verbesserungsideen. Schreibe musikalisch statt technisch und erfinde nichts.\n\nMIDI-DATEN:\n${JSON.stringify(data)}`;
      const system=(typeof SYSTEM_PREFIX!=='undefined'&&SYSTEM_PREFIX)?SYSTEM_PREFIX:'Du bist ein erfahrener musikalischer Analyse- und Kompositionsassistent.';
      const res=await callLLM(provider,model,apiKey,system,task,false);
      const text=(res&&typeof res==='object'?res.text:res)||'Die KI hat keine Analyse zurückgegeben.';
      const box=document.getElementById('importedAnalysis');
      if(box){box.className='resultcard';box.textContent=text;}
      const st=document.getElementById('status'); if(st)st.innerHTML='<span class="ok">Analyse erstellt.</span>';
    }catch(e){show('Analyse fehlgeschlagen: '+(e?.message||String(e)),'err');}
    finally{btn.disabled=false;}
  }
  // Capture handler catches the button even if another patch replaced the DOM node.
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#analyzeImportedBtn');
    if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    analyse(btn);
  },true);
})();
</script>
'''
    s=s.replace(marker,script+'\n'+marker,1)
s=re.sub(r'navigator\.serviceWorker\.register\("\./service-worker\.js\?v=\d+"\)', 'navigator.serviceWorker.register("./service-worker.js?v=20")', s)
p.write_text(s,encoding='utf-8')
