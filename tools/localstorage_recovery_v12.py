from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='</body>'
if 'localstorage-recovery-v12' not in s:
    script=r'''
<script id="localstorage-recovery-v12">
(()=>{
  function parse(k){try{return JSON.parse(localStorage.getItem(k));}catch(_){return null;}}
  function nonEmptyObj(v){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length>0;}
  function historyScore(v){
    if(!Array.isArray(v)) return -1;
    let n=0;
    for(const x of v){ if(x&&typeof x==='object'&&(x.score||x.title||x.provider||x.meta)) n++; }
    return n;
  }
  function settingsScore(v){
    if(!nonEmptyObj(v)) return -1;
    const fields=['provider','keys','remember','measures','meter','tempo','musicalKey','ensemble','prompt','foldStates','reasoningEffort'];
    return fields.reduce((n,k)=>n+(Object.prototype.hasOwnProperty.call(v,k)?1:0),0);
  }
  function snapshot(){
    const out=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i); if(!k) continue;
      const v=parse(k); out.push({k,v,hs:historyScore(v),ss:settingsScore(v)});
    }
    return out;
  }
  function recover(show=true){
    const items=snapshot();
    const currentSettings=parse(STORAGE_ID), currentHistory=parse(HISTORY_ID), currentExp=parse(EXPERIMENT_HISTORY_ID);
    let changed=false, notes=[];

    // Settings: only restore from another richer object; originals are never deleted.
    const curSS=settingsScore(currentSettings);
    const settingCandidates=items.filter(x=>x.k!==STORAGE_ID&&x.ss>curSS&&/(midi|composer|composition|setting)/i.test(x.k)).sort((a,b)=>b.ss-a.ss);
    if(settingCandidates[0]){
      localStorage.setItem(STORAGE_ID, JSON.stringify(settingCandidates[0].v));
      changed=true; notes.push('Einstellungen aus „'+settingCandidates[0].k+'“ wiederhergestellt.');
    }

    // Normal history: prefer the richest compatible legacy array when current history is empty/smaller.
    const curHS=historyScore(currentHistory);
    const historyCandidates=items.filter(x=>x.k!==HISTORY_ID&&x.hs>curHS&&/(history|verlauf|midi|composer|composition)/i.test(x.k)).sort((a,b)=>b.hs-a.hs);
    if(historyCandidates[0]){
      localStorage.setItem(HISTORY_ID, JSON.stringify(historyCandidates[0].v));
      changed=true; notes.push('Kompositionsverlauf aus „'+historyCandidates[0].k+'“ wiederhergestellt ('+historyCandidates[0].v.length+' Einträge).');
    }

    // Experimental templates: don't confuse them with normal history; use keys that look experimental/template-like.
    const curEH=historyScore(currentExp);
    const expCandidates=items.filter(x=>x.k!==EXPERIMENT_HISTORY_ID&&x.hs>curEH&&/(experiment|template|vorlage)/i.test(x.k)).sort((a,b)=>b.hs-a.hs);
    if(expCandidates[0]){
      localStorage.setItem(EXPERIMENT_HISTORY_ID, JSON.stringify(expCandidates[0].v));
      changed=true; notes.push('Vorlagenverlauf aus „'+expCandidates[0].k+'“ wiederhergestellt ('+expCandidates[0].v.length+' Einträge).');
    }

    if(changed){
      try{initApp();}catch(_){ try{renderHistory();}catch(__){} }
      try{window.compositionLabRefreshComparisonSources&&window.compositionLabRefreshComparisonSources();}catch(_){}
    }
    if(show){
      const st=document.getElementById('status');
      if(st){
        if(changed) st.innerHTML='<span class="ok">'+notes.map(esc).join('<br>')+'</span>';
        else {
          const keys=items.map(x=>x.k);
          st.innerHTML='<span class="warn">Kein älterer lokaler Speicherstand gefunden. Vorhandene LocalStorage-Schlüssel: '+esc(keys.length?keys.join(', '):'keine')+'.</span>';
        }
      }
    }
    return changed;
  }

  window.compositionLabRecoverLocalStorage=recover;
  // One automatic, non-destructive recovery attempt on every load.
  recover(false);

  // Add a visible diagnostic/recovery button near the history controls.
  const clear=document.getElementById('clearHistoryBtn');
  if(clear && !document.getElementById('recoverMemoryBtn')){
    const b=document.createElement('button');
    b.type='button'; b.id='recoverMemoryBtn'; b.className='secondary smallbtn'; b.textContent='Gedächtnis prüfen';
    b.addEventListener('click',()=>recover(true));
    clear.parentElement && clear.parentElement.appendChild(b);
  }
})();
</script>
'''
    s=s.replace(marker,script+'\n'+marker,1)
s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=13")','navigator.serviceWorker.register("./service-worker.js?v=14")')
s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=12")','navigator.serviceWorker.register("./service-worker.js?v=14")')
p.write_text(s,encoding='utf-8')
