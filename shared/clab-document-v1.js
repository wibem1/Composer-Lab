(()=>{
'use strict';
if(window.__compositionLabClabV1)return;
window.__compositionLabClabV1=true;
const FORMAT='composition-lab-document', VERSION=1, APPLE_EPOCH=978307200;
const $=id=>document.getElementById(id);
const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
let loadedDocument=null;
function appleDateNow(){return Date.now()/1000-APPLE_EPOCH;}
function safeName(s){return String(s||'Composition').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,' ').trim()||'Composition';}
function noteCount(score){return (score?.tr||[]).reduce((n,t)=>n+(Array.isArray(t?.nt)?t.nt.length:0),0);}
function nativeProvider(v){return ['gemini','anthropic','openai'].includes(String(v||''))?String(v):null;}
function setStatus(msg,kind='ok'){
  const e=$('status'); if(!e)return; const cls=kind==='err'?'err':kind==='warn'?'warn':'ok';
  e.innerHTML=`<span class="${cls}">${String(msg).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</span>`;
}
function download(text,name){
  try{if(typeof downloadBlob==='function'){downloadBlob(text,name,'application/json');return;}}catch(_){}
  const u=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function applyProvider(provider,model){
  const p=$('provider'); if(provider&&p&&[...p.options].some(o=>o.value===provider)){
    p.value=provider;
    try{p.dispatchEvent(new Event('change'));}catch(_){}
  }
  const m=$('model'); if(model&&m&&[...m.options].some(o=>o.value===model))m.value=model;
}
function applyDocument(doc,fileName=''){
  if(!doc||doc.format!==FORMAT)throw new Error('Keine gültige Composition-Lab-Datei.');
  if(Number(doc.version||0)!==VERSION)throw new Error(`CLAB-Version ${doc.version} wird noch nicht unterstützt.`);
  if(!doc.score||!Array.isArray(doc.score.tr))throw new Error('CLAB-Datei enthält keinen gültigen Score.');
  loadedDocument=clone(doc);
  const score=clone(doc.score);
  window.lastScore=score; window.mainPlayerScore=score; window.lastProvider=doc.provider||null; window.lastModel=doc.model||null; window.lastConcept=String(doc.concept||'');
  try{window.lastMidiBytes=buildMidi(score);}catch(_){window.lastMidiBytes=null;}
  window.uploadedScore=doc.sourceScore?clone(doc.sourceScore):null;
  window.uploadedName=doc.sourceName||'';
  if($('measures'))$('measures').value=doc.measures??'';
  if($('meter'))$('meter').value=doc.meter??(`${score.ts?.n||4}/${score.ts?.d||4}`);
  if($('tempo'))$('tempo').value=doc.tempo??String(score.bpm??96);
  if($('musicalKey'))$('musicalKey').value=doc.musicalKey??score.k??'';
  if($('ensemble'))$('ensemble').value=doc.ensemble??'';
  if($('prompt'))$('prompt').value=doc.assignment??'';
  applyProvider(doc.provider,doc.model);
  if($('downloadBtn'))$('downloadBtn').disabled=false;
  if($('jsonBtn'))$('jsonBtn').disabled=false;
  if($('conceptView'))$('conceptView').innerHTML=window.lastConcept?`<strong>Kompositionsidee:</strong><br>${window.lastConcept.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g,'<br>')}`:'Keine Kompositionsidee gespeichert.';
  if($('lastResult'))$('lastResult').innerHTML=`<strong>${String(score.ti||doc.title||'Komposition').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</strong><br>${score.bpm||''} BPM · ${score.ts?.n||4}/${score.ts?.d||4} · ${score.tr.length} Spur(en) · ${noteCount(score)} Noten`;
  if($('mainPlayerTitle'))$('mainPlayerTitle').textContent=`CLAB: ${score.ti||doc.title||fileName||'Komposition'}`;
  if($('uploadInfo'))$('uploadInfo').textContent=window.uploadedScore?`CLAB-Vorlage: ${window.uploadedName||window.uploadedScore.ti||'Vorlage'} (${noteCount(window.uploadedScore)} Noten)`:'Keine Vorlage in dieser CLAB-Datei.';
  try{renderChatContext();}catch(_){}
  try{saveCurrentState();}catch(_){}
  setStatus(`CLAB geöffnet: ${fileName||doc.title||score.ti||'Komposition'}.`);
}
function makeDocument(){
  if(!window.lastScore)throw new Error('Noch keine Komposition vorhanden.');
  const previous=loadedDocument?clone(loadedDocument):{};
  const sameScore=!!loadedDocument&&JSON.stringify(loadedDocument.score)===JSON.stringify(window.lastScore);
  const provider=nativeProvider(window.lastProvider)||nativeProvider($('provider')?.value);
  const doc={...previous,
    format:FORMAT,version:VERSION,savedAt:appleDateNow(),
    title:String(window.lastScore.ti||previous.title||'Komposition'),score:clone(window.lastScore),concept:String(window.lastConcept||''),
    provider,model:provider?(window.lastModel||$('model')?.value||null):null,
    measures:String($('measures')?.value??''),meter:String($('meter')?.value??''),tempo:String($('tempo')?.value??''),
    musicalKey:String($('musicalKey')?.value??''),ensemble:String($('ensemble')?.value??''),assignment:String($('prompt')?.value??''),
    sourceName:window.uploadedScore?(window.uploadedName||window.uploadedScore.ti||null):null,sourceScore:window.uploadedScore?clone(window.uploadedScore):null
  };
  delete doc.midiData; delete doc.musicXMLData;
  if(!sameScore){delete doc.costUSD;delete doc.inputTokens;delete doc.outputTokens;}
  for(const k of Object.keys(doc))if(doc[k]===undefined)delete doc[k];
  loadedDocument=clone(doc);
  return doc;
}
async function openFile(file){
  try{const doc=JSON.parse(await file.text());applyDocument(doc,file.name);}catch(e){setStatus(`CLAB konnte nicht geöffnet werden: ${e?.message||e}`,'err');}
}
function installUi(){
  if($('clabOpenBtn'))return true;
  const midi=$('downloadBtn');const toolbar=midi?.parentElement;if(!toolbar)return false;
  const open=document.createElement('button');open.id='clabOpenBtn';open.type='button';open.className='secondary';open.textContent='CLAB öffnen';
  const save=document.createElement('button');save.id='clabSaveBtn';save.type='button';save.className='secondary';save.textContent='CLAB speichern';
  const input=document.createElement('input');input.id='clabFileInput';input.type='file';input.accept='.clab,application/json';input.style.display='none';
  toolbar.insertBefore(open,midi);toolbar.insertBefore(save,midi);toolbar.appendChild(input);
  open.onclick=()=>{input.value='';input.click();};
  input.onchange=()=>{const f=input.files?.[0];if(f)openFile(f);};
  save.onclick=()=>{try{const d=makeDocument();download(JSON.stringify(d,null,2),safeName(d.title)+'.clab');setStatus('CLAB-Datei gespeichert. Score, Kompositionsidee, Einstellungen und Vorlage sind enthalten.');}catch(e){setStatus(e?.message||String(e),'err');}};
  const tech=$('technicalSection')?.querySelector('.foldcontent');if(tech&&!$('clabCompatBuild')){const d=document.createElement('div');d.id='clabCompatBuild';d.className='uploadinfo';d.style.marginTop='12px';d.textContent='CLAB-Kompatibilität V1 · Native V5.0.12 Schema';tech.appendChild(d);}
  return true;
}
window.CompositionLabCLAB={FORMAT,VERSION,applyDocument,makeDocument,getLoadedDocument:()=>clone(loadedDocument)};
let tries=0;const timer=setInterval(()=>{try{if(installUi()||++tries>200)clearInterval(timer);}catch(_){if(++tries>200)clearInterval(timer);}},100);
})();
