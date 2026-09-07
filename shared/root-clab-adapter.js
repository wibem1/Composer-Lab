(()=>{
'use strict';
if(window.__compositionLabRootCLAB)return;
window.__compositionLabRootCLAB=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeName=v=>String(v||'Composition-Lab').replace(/[\\/:*?"<>|]+/g,'_').trim()||'Composition-Lab';
function saveData(data,name,type){
  try{if(typeof downloadBlob==='function'){downloadBlob(data,name,type);return}}catch(_){}
  const blob=data instanceof Blob?data:new Blob([data],{type});
  if(window.AndroidBridge?.saveBlob){const r=new FileReader();r.onloadend=()=>window.AndroidBridge.saveBlob(r.result,name,type);r.readAsDataURL(blob);return}
  const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);
}
function currentProject(){
  const C=window.CompositionLabCLAB;if(!C)throw new Error('CLAB-Kern ist noch nicht geladen.');
  let score=null;try{score=typeof lastScore!=='undefined'?lastScore:null}catch(_){}
  if(!score)throw new Error('Noch keine Komposition vorhanden.');
  let midi=null;try{midi=typeof lastMidiBytes!=='undefined'&&lastMidiBytes?lastMidiBytes:(typeof buildMidi==='function'?buildMidi(score):null)}catch(_){}
  let idea='';try{idea=typeof lastConcept!=='undefined'?lastConcept:''}catch(_){}
  const settings={
    measures:Number($('measures')?.value)||null,
    meter:$('meter')?.value||'',
    bpm:Number($('tempo')?.value)||Number(score?.bpm)||null,
    key:$('musicalKey')?.value||score?.k||'',
    ensemble:$('ensemble')?.value||'',
    reasoning:$('reasoningEffort')?.value||''
  };
  return C.makeProject({
    score,
    title:score?.ti||'Komposition',
    idea:idea||score?.sm||'',
    task:$('prompt')?.value||'',
    settings,
    provider:(typeof lastProvider!=='undefined'&&lastProvider)||$('provider')?.value||null,
    model:(typeof lastModel!=='undefined'&&lastModel)||$('model')?.value||null,
    source:{name:(typeof uploadedName!=='undefined'&&uploadedName)||'',kind:(typeof uploadedScore!=='undefined'&&uploadedScore)?'midi-or-json':''},
    midiBytes:midi,
    musicXML:null,
    originalMusicXML:null,
    extensions:{app:'Composition Lab Android/WebApp',interfaceBuild:window.__compositionLabBuilds?.interface||null,engineBuild:window.__compositionLabBuilds?.engine||window.CompositionLabEngine?.BUILD||null}
  });
}
function exportCLAB(){
  try{const p=currentProject();saveData(window.CompositionLabCLAB.stringify(p),safeName(p.title)+'.clab','application/json');$('status').innerHTML='<span class="ok">CLAB-Projekt gespeichert.</span>'}catch(e){if($('status'))$('status').innerHTML='<span class="err">CLAB-Speichern fehlgeschlagen: '+esc(e?.message||e)+'</span>'}
}
function applyProject(p){
  const C=window.CompositionLabCLAB;p=C.normalizeProject(p);const s=JSON.parse(JSON.stringify(p.score));
  try{lastScore=s;mainPlayerScore=s;lastProvider=p.ai?.provider||'';lastModel=p.ai?.model||'';lastConcept=p.idea||'';lastMidiBytes=p.representations?.midiBase64?C.base64ToBytes(p.representations.midiBase64):buildMidi(s)}catch(_){}
  if($('prompt'))$('prompt').value=p.task||'';
  if($('tempo'))$('tempo').value=s.bpm||p.settings?.bpm||96;
  if($('meter'))$('meter').value=s.ts?`${s.ts.n}/${s.ts.d}`:(p.settings?.meter||'4/4');
  if($('musicalKey'))$('musicalKey').value=s.k||p.settings?.key||'frei';
  if($('ensemble')&&p.settings?.ensemble)$('ensemble').value=p.settings.ensemble;
  if($('measures')&&p.settings?.measures)$('measures').value=p.settings.measures;
  if($('provider')&&p.ai?.provider)$('provider').value=p.ai.provider;
  if($('model')&&p.ai?.model)$('model').value=p.ai.model;
  if($('conceptView'))$('conceptView').innerHTML=p.idea?`<strong>Musikalischer Impuls:</strong><br>${esc(p.idea).replace(/\n/g,'<br>')}`:'Für dieses CLAB-Projekt ist kein musikalischer Impuls gespeichert.';
  if($('lastResult'))$('lastResult').innerHTML=`<strong>${esc(s.ti||p.title||'Komposition')}</strong><br>${esc(s.bpm||p.settings?.bpm||'')} BPM · ${esc(s.k||p.settings?.key||'')} · ${esc((s.tr||[]).length)} Spur(en)`;
  if($('mainPlayerTitle'))$('mainPlayerTitle').textContent='Komposition: '+(s.ti||p.title||'Unbenannt');
  if($('downloadBtn'))$('downloadBtn').disabled=false;if($('jsonBtn'))$('jsonBtn').disabled=false;
  try{renderChatContext?.();validateScore?.(s);saveCurrentState?.()}catch(_){}
  if($('status'))$('status').innerHTML='<span class="ok">CLAB-Projekt vollständig geladen.</span>';
}
async function importCLAB(file){
  try{const p=window.CompositionLabCLAB.parse(await file.text());applyProject(p)}catch(e){if($('status'))$('status').innerHTML='<span class="err">CLAB-Datei konnte nicht geöffnet werden: '+esc(e?.message||e)+'</span>'}
}
function installUI(){
  const toolbar=$('downloadBtn')?.parentElement;if(!toolbar)return false;
  if(!$('clabSaveBtn')){const b=document.createElement('button');b.id='clabSaveBtn';b.type='button';b.className='secondary';b.textContent='CLAB sichern';b.onclick=exportCLAB;toolbar.appendChild(b)}
  if(!$('clabOpenBtn')){const b=document.createElement('button');b.id='clabOpenBtn';b.type='button';b.className='secondary';b.textContent='CLAB öffnen';toolbar.appendChild(b);const inp=document.createElement('input');inp.id='clabOpenInput';inp.type='file';inp.accept='.clab,.clabproject,application/json';inp.style.display='none';toolbar.appendChild(inp);b.onclick=()=>{inp.value='';inp.click()};inp.onchange=()=>inp.files?.[0]&&importCLAB(inp.files[0])}
  const up=$('uploadInput');if(up&&!up.dataset.clabV1){up.dataset.clabV1='1';const accept=up.getAttribute('accept')||'';if(!accept.includes('.clab'))up.setAttribute('accept',accept+',.clab,.clabproject');up.addEventListener('change',e=>{const f=up.files?.[0];if(!f)return;if(/\.(clab|clabproject)$/i.test(f.name)){e.stopImmediatePropagation();e.preventDefault();importCLAB(f)}},true)}
  return true;
}
let n=0,t=setInterval(()=>{if(window.CompositionLabCLAB&&installUI()||++n>300)clearInterval(t)},100);
})();
