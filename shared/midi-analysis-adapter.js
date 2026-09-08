(()=>{
'use strict';
if(window.__compositionLabMidiAnalysisAdapter)return;
window.__compositionLabMidiAnalysisAdapter=true;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function score(){try{return typeof uploadedScore!=='undefined'?uploadedScore:null}catch(_){return null}}
function sourceName(){try{return (typeof uploadedName!=='undefined'&&uploadedName)||score()?.ti||'Import'}catch(_){return'Import'}}
function creds(){return{provider:$('provider')?.value||'',model:$('model')?.value?.trim()||'',apiKey:$('apiKey')?.value?.trim()||''}}
function setStatus(msg,kind='ok'){const st=$('status');if(st)st.innerHTML=`<span class="${kind}">${esc(msg)}</span>`}
function showAnalysis(msg,kind=''){
  const section=$('importedAnalysisSection'),box=$('importedAnalysis');
  if(section){section.style.display='block';section.open=true}
  if(box){box.style.display='block';if(kind)box.innerHTML=`<span class="${kind}">${esc(msg)}</span>`;else box.textContent=msg}
}

function compact(raw,cap=5000){
  if(!raw)return null;
  const tracks=Array.isArray(raw.tr)?raw.tr:[];
  const total=tracks.reduce((n,t)=>n+(Array.isArray(t?.nt)?t.nt.length:0),0);
  const ratio=total>cap?cap/Math.max(1,total):1;
  const out={ti:raw.ti||'',sm:raw.sm||'',bpm:raw.bpm||96,ts:raw.ts||null,k:raw.k||'',tr:[]};
  for(const t of tracks){
    const notes=Array.isArray(t?.nt)?t.nt:[];
    let kept=notes;
    if(ratio<1&&notes.length){
      const count=Math.max(16,Math.floor(notes.length*ratio));
      kept=[];const step=notes.length/Math.max(1,count);
      for(let i=0;i<count;i++)kept.push(notes[Math.min(notes.length-1,Math.floor(i*step))]);
    }
    out.tr.push({nm:t?.nm||'',ch:t?.ch,pg:t?.pg,nt:kept,ct:Array.isArray(t?.ct)?t.ct.slice(0,600):[]});
  }
  if(ratio<1)out.analysisNote='Sehr große MIDI-Datei: zeitlich verteilte repräsentative Notenauswahl für die Analyse.';
  return out;
}

async function analyse(btn){
  const sc=score();
  if(!sc){showAnalysis('Keine importierte MIDI-Datei geladen.','err');setStatus('Bitte zuerst eine MIDI- oder JSON-Datei laden.','err');return}
  const {provider,model,apiKey}=creds();
  if(!apiKey){showAnalysis('Für die KI-Analyse fehlt der API-Key der gewählten KI.','err');setStatus('Bitte zuerst den API-Key der gewählten KI eingeben.','err');return}
  if(!model){showAnalysis('Für die KI-Analyse ist kein Modell ausgewählt.','err');return}
  btn.disabled=true;showAnalysis('KI analysiert die importierte MIDI-Datei …');setStatus('KI analysiert die importierte MIDI-Datei …');
  try{
    const task=`Gib eine kompakte musikalische Analyse der folgenden importierten MIDI-Komposition. Schreibe für einen Musiker, nicht als technische MIDI-Dokumentation. Maximal etwa 250 Wörter.\n\nGliedere nur in:\n1. Charakter und musikalische Idee\n2. Form, Motive, Harmonik und Rhythmik – knapp\n3. Stärken\n4. Mögliche Schwächen\n5. Zwei oder drei konkrete Verbesserungsideen\n\nTechnische MIDI-Details nur nennen, wenn sie musikalisch entscheidend sind. Erfinde nichts, was aus den Daten nicht ableitbar ist.\n\nDATEI: ${sourceName()}\n\nMIDI-DATEN:\n${JSON.stringify(compact(sc))}`;
    const system=(typeof SYSTEM_PREFIX!=='undefined'&&SYSTEM_PREFIX)?SYSTEM_PREFIX:'Du bist ein erfahrener musikalischer Analyse- und Kompositionsassistent.';
    const res=await callLLM(provider,model,apiKey,system,task,false);
    const text=(res&&typeof res==='object'?res.text:res)||'Die KI hat keine Analyse zurückgegeben.';
    showAnalysis(text);setStatus('Analyse der importierten MIDI-Datei erstellt.');
  }catch(err){const msg=err?.message||String(err);showAnalysis('Analyse fehlgeschlagen: '+msg,'err');setStatus('Analyse fehlgeschlagen: '+msg,'err')}
  finally{btn.disabled=false}
}

async function ask(btn){
  const answer=$('importedAnalysisAnswer'),input=$('importedAnalysisQuestion'),sc=score();
  if(!answer||!input)return;
  answer.style.display='block';
  const q=input.value.trim();
  if(!q){answer.textContent='Bitte zuerst eine Frage eingeben.';return}
  if(!sc){answer.textContent='Keine importierte MIDI-Datei geladen.';return}
  const {provider,model,apiKey}=creds();
  if(!apiKey){answer.textContent='Bitte zuerst den API-Key der gewählten KI eingeben.';return}
  btn.disabled=true;answer.textContent='KI denkt über deine Frage nach …';
  try{
    const previous=$('importedAnalysis')?.textContent||'';
    const system='Du besprichst mit einem Musiker eine importierte MIDI-Komposition. Antworte konkret, knapp und musikalisch auf seine Frage. Technische MIDI-Zahlen nur nennen, wenn sie wirklich nötig sind.';
    const task=`Bisherige Kurzanalyse:\n${previous}\n\nFrage des Musikers:\n${q}\n\nMIDI-Daten:\n${JSON.stringify(compact(sc,7000))}`;
    const res=await callLLM(provider,model,apiKey,system,task,false);
    answer.textContent=(res&&typeof res==='object'?res.text:res)||'Keine Antwort erhalten.';
  }catch(err){answer.textContent='Fehler bei der KI-Frage: '+(err?.message||err)}
  finally{btn.disabled=false}
}

function install(){
  const oldAnalyse=$('analyzeImportedBtn');
  if(oldAnalyse&&!oldAnalyse.dataset.consolidatedMidiAnalysis){
    const fresh=oldAnalyse.cloneNode(true);fresh.dataset.consolidatedMidiAnalysis='1';oldAnalyse.replaceWith(fresh);fresh.addEventListener('click',()=>analyse(fresh));
  }
  const oldAsk=$('askImportedAnalysisBtn');
  if(oldAsk&&!oldAsk.dataset.consolidatedMidiAnalysis){
    const fresh=oldAsk.cloneNode(true);fresh.dataset.consolidatedMidiAnalysis='1';oldAsk.replaceWith(fresh);fresh.addEventListener('click',()=>ask(fresh));
  }
  return !!$('analyzeImportedBtn');
}

let tries=0;const timer=setInterval(()=>{if(install()||++tries>100)clearInterval(timer)},100);
})();
