(()=>{
'use strict';
const INTERFACE_BUILD=49;
const CHAT_KEY='composition_lab_midi_chat_v1';
const $=id=>document.getElementById(id);

function installBuildDisplayGuard(){
  if(document.getElementById('compositionLabBuildDisplayGuard'))return;
  const style=document.createElement('style');
  style.id='compositionLabBuildDisplayGuard';
  style.textContent='#rootInterfaceBuildActive{display:none!important}';
  (document.head||document.documentElement).appendChild(style);
}
function showAuthoritativeBuild(){
  const engine=window.CompositionLabEngine;
  const tech=$('technicalSection')?.querySelector('.foldcontent');
  if(tech){
    let line=$('sharedEngineBadge');
    if(!line){line=document.createElement('div');line.id='sharedEngineBadge';line.className='uploadinfo';line.style.marginTop='12px';tech.appendChild(line)}
    line.innerHTML=`<strong>Engine Build ${engine?.BUILD||14}</strong><br>Interface Build Android/WebApp ${INTERFACE_BUILD}`;
  }
  window.__compositionLabBuilds={engine:engine?.BUILD||14,interface:INTERFACE_BUILD,platform:'Android/WebApp'};
}
function currentSourceName(){
  try{return (typeof uploadedName!=='undefined'&&uploadedName)||uploadedScore?.ti||'MIDI-Datei'}catch(_){return'MIDI-Datei'}
}
function lastUserChatMessage(){
  try{
    const data=JSON.parse(localStorage.getItem(CHAT_KEY)||'null');
    if(!data||!Array.isArray(data.messages))return'';
    if(data.sourceName&&data.sourceName!==currentSourceName())return'';
    for(let i=data.messages.length-1;i>=0;i--){
      if(data.messages[i]?.role==='user'&&String(data.messages[i].text||'').trim())return String(data.messages[i].text).trim();
    }
  }catch(_){}
  return'';
}
function sourceInstruction(){return $('sourceChatInput')?.value?.trim()||lastUserChatMessage()||''}
function esc(text){return String(text||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g,'<br>')}
function showConcept(text,provider,conceptOnly=false){
  try{if(typeof lastConcept!=='undefined')lastConcept=text||''}catch(_){}
  if($('conceptView'))$('conceptView').innerHTML=`<strong>${String(provider||'KI').toUpperCase()} ${conceptOnly?'Musikalischer Entwurf':'Konzept'} · Engine Build ${window.CompositionLabEngine?.BUILD||14}:</strong><br>${esc(text)}`;
  if($('status')&&!conceptOnly)$('status').innerHTML=`<span class="ok">Musikalischer Impuls fertig · Engine Build ${window.CompositionLabEngine?.BUILD||14} komponiert jetzt …</span>`;
}
function toArrayScore(score){
  const out=JSON.parse(JSON.stringify(score||{}));
  out.tr=Array.isArray(out.tr)?out.tr.map((track,index)=>({
    nm:track.nm||`Spur ${index+1}`,
    ch:Number(track.ch??index)%16,
    pg:Number(track.pg)||0,
    nt:(Array.isArray(track.nt)?track.nt:[]).map(note=>Array.isArray(note)?note:[
      Number(note.t)||0,Math.max(.03,Number(note.d)||.25),Number(note.p),
      Math.max(1,Math.min(127,Number(note.v)||88)),Number(note.st)||0,Number(note.g)||.95
    ]).filter(note=>Number.isFinite(Number(note[2]))),
    ct:Array.isArray(track.ct)?track.ct:[],
    ...(Array.isArray(track.ev)?{ev:track.ev}:{}),
    ...(Array.isArray(track.me)?{me:track.me}:{})
  })):[];
  return out;
}
function install(){
  const engine=window.CompositionLabEngine,button=$('composeBtn');
  if(!engine||!button)return false;
  if(button.dataset.sharedEngine==='1'){showAuthoritativeBuild();return true}
  button.dataset.sharedEngine='1';
  button.onclick=async()=>{
    try{saveCurrentState?.()}catch(_){}
    const provider=$('provider')?.value||'openai';
    const model=$('model')?.value?.trim()||'';
    const apiKey=$('apiKey')?.value?.trim()||'';
    const reasoning=$('reasoningEffort')?.value||'medium';
    const instruction=sourceInstruction();
    const settings={
      ensemble:$('ensemble')?.value||'frei',measures:Number($('measures')?.value)||32,
      meter:$('meter')?.value||'4/4',bpm:Number($('tempo')?.value)||96,
      key:$('musicalKey')?.value||'frei',task:$('prompt')?.value||'',sourceInstruction:instruction
    };
    button.disabled=true;
    if($('status'))$('status').innerHTML=`<span class="ok">Engine Build ${engine.BUILD} entwickelt musikalischen Impuls …</span>`;
    try{
      const source=typeof uploadedScore!=='undefined'?uploadedScore:null;
      const result=await engine.compose({
        provider,model,apiKey,reasoning,settings,source,sourceName:currentSourceName(),sourceInstruction:instruction,
        onConcept:({concept,conceptOnly})=>showConcept(concept,provider,conceptOnly)
      });
      showConcept(result.concept||'',provider,result.conceptOnly);
      if(result.conceptOnly){
        if($('status'))$('status').innerHTML=`<span class="ok">Musikalischer Entwurf erstellt · keine MIDI-Komposition erzeugt · Engine Build ${engine.BUILD}</span>`;
        return;
      }
      const score=toArrayScore(result.score);
      try{lastScore=score;mainPlayerScore=score;lastProvider=provider;lastModel=model}catch(_){}
      try{if(typeof buildMidi==='function')lastMidiBytes=buildMidi(score)}catch(_){}
      if($('mainPlayerTitle'))$('mainPlayerTitle').textContent=`Komposition: ${score.ti||'Unbenannt'}`;
      if($('downloadBtn'))$('downloadBtn').disabled=false;
      if($('jsonBtn'))$('jsonBtn').disabled=false;
      if($('lastResult'))$('lastResult').innerHTML=`<strong>${esc(score.ti||'Komposition')}</strong><br>${score.bpm||settings.bpm} BPM · ${esc(score.k||'')} · ${(score.tr||[]).length} Spur(en)<br><small>${esc(score.sm||'')}</small>`;
      try{validateScore?.(score)}catch(_){}
      try{renderChatContext?.()}catch(_){}
      try{addHistory?.(score,provider,model,result.concept||'')}catch(_){}
      if($('status'))$('status').innerHTML=`<span class="ok">Komposition abgeschlossen · Engine Build ${engine.BUILD}</span>`;
    }catch(error){
      if($('status'))$('status').innerHTML=`<span class="err">Fehler: ${esc(error?.message||error)}</span>`;
    }finally{button.disabled=false}
  };
  showAuthoritativeBuild();
  return true;
}

installBuildDisplayGuard();
let tries=0;const timer=setInterval(()=>{if(install()||++tries>200)clearInterval(timer)},100);
window.addEventListener('compositionlab-experiment-ready',()=>setTimeout(showAuthoritativeBuild,0));
window.addEventListener('compositionlab-storage-restored',()=>setTimeout(showAuthoritativeBuild,0));
})();

(()=>{
'use strict';
if(window.__compositionLabExperimentLoader)return;
window.__compositionLabExperimentLoader=true;
const fresh=Date.now();
const load=(src,onload)=>{const s=document.createElement('script');s.async=false;s.src=src+'?fresh='+fresh;if(onload)s.onload=onload;(document.head||document.body).appendChild(s)};
load('/Composer-Lab/shared/experiment-engine.js',()=>load('/Composer-Lab/shared/experiment-adapter.js',()=>load('/Composer-Lab/shared/gemini-model-config.js')));
})();
