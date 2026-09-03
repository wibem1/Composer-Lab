(()=>{
'use strict';
const INTERFACE_BUILD=49;
const CHAT_KEY='composition_lab_midi_chat_v1';
function installBuildDisplayGuard(){
  if(document.getElementById('compositionLabBuildDisplayGuard'))return;
  const st=document.createElement('style');
  st.id='compositionLabBuildDisplayGuard';
  st.textContent='#rootInterfaceBuildActive{display:none!important}';
  (document.head||document.documentElement).appendChild(st);
}
function showAuthoritativeBuild(){
  const E=window.CompositionLabEngine;
  const tech=document.getElementById('technicalSection')?.querySelector('.foldcontent');
  if(tech){
    let d=document.getElementById('sharedEngineBadge');
    if(!d){d=document.createElement('div');d.id='sharedEngineBadge';d.className='uploadinfo';d.style.marginTop='12px';tech.appendChild(d)}
    d.innerHTML=`<strong>Engine Build ${E?.BUILD||14}</strong><br>Interface-Build Android/WebApp ${INTERFACE_BUILD}`;
  }
  window.__compositionLabBuilds={engine:E?.BUILD||14,interface:INTERFACE_BUILD,platform:'Android/WebApp'};
}
installBuildDisplayGuard();
function install(){
  const E=window.CompositionLabEngine,btn=document.getElementById('composeBtn');
  if(!E||!btn)return false;
  if(btn.dataset.sharedEngine==='1'){showAuthoritativeBuild();return true;}
  btn.dataset.sharedEngine='1';
  const $=id=>document.getElementById(id);
  function currentSourceName(){try{return (typeof uploadedName!=='undefined'&&uploadedName)||uploadedScore?.ti||'MIDI-Datei'}catch(_){return'MIDI-Datei'}}
  function lastUserChatMessage(){try{const x=JSON.parse(localStorage.getItem(CHAT_KEY)||'null');if(!x||!Array.isArray(x.messages))return'';if(x.sourceName&&x.sourceName!==currentSourceName())return'';for(let i=x.messages.length-1;i>=0;i--){if(x.messages[i]?.role==='user'&&String(x.messages[i].text||'').trim())return String(x.messages[i].text).trim()}return''}catch(_){return''}}
  function sourceInstruction(){return $('sourceChatInput')?.value?.trim()||lastUserChatMessage()||''}
  function esc(s){return String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g,'<br>')}
  function showConcept(text,provider,conceptOnly=false){
    if(typeof lastConcept!=='undefined')lastConcept=text||'';
    if($('conceptView'))$('conceptView').innerHTML=`<strong>${provider.toUpperCase()} ${conceptOnly?'Musikalischer Entwurf':'Konzept'} · Engine Build ${E.BUILD}:</strong><br>${esc(text)}`;
    if($('status')&&!conceptOnly)$('status').innerHTML=`<span class="ok">Musikalischer Impuls fertig · Engine Build ${E.BUILD} komponiert jetzt …</span>`;
  }
  function toArrayScore(score){const s=JSON.parse(JSON.stringify(score||{}));s.tr=Array.isArray(s.tr)?s.tr.map((t,i)=>({nm:t.nm||`Spur ${i+1}`,ch:Number(t.ch??i)%16,pg:Number(t.pg)||0,nt:(Array.isArray(t.nt)?t.nt:[]).map(n=>Array.isArray(n)?n:[Number(n.t)||0,Math.max(.03,Number(n.d)||.25),Number(n.p),Math.max(1,Math.min(127,Number(n.v)||88)),Number(n.st)||0,Number(n.g)||.95]).filter(n=>Number.isFinite(Number(n[2]))),ct:Array.isArray(t.ct)?t.ct:[]})):[];return s}
  function attachDiagnostic(r,score){window.__compositionLabLastSharedDiagnostic=r.diagnostic;const d=window.__compositionLabDiagnosticsV2?.active;if(d){d.engineVersion=r.engineVersion;d.engineBuild=E.BUILD;d.interfaceBuild=INTERFACE_BUILD;d.interface='Android/WebApp';d.sharedEngine=r.diagnostic;d.calls=r.conceptOnly?[{index:1,kind:'concept-only',systemPrompt:r.diagnostic.systemPrompt,userPrompt:r.diagnostic.conceptPrompt,response:r.diagnostic.conceptResponse}]:[{index:1,kind:'concept',systemPrompt:r.diagnostic.conceptSystemPrompt||r.diagnostic.systemPrompt,userPrompt:r.diagnostic.conceptPrompt,response:r.diagnostic.conceptResponse},{index:2,kind:'composition',systemPrompt:r.diagnostic.systemPrompt,userPrompt:r.diagnostic.compositionPrompt,response:r.diagnostic.scoreResponse}];d.result=score||null;d.updatedAt=new Date().toISOString();}}
  btn.onclick=async()=>{
    try{saveCurrentState?.()}catch(_){}
    const provider=$('provider')?.value||'openai',model=$('model')?.value?.trim()||'',apiKey=$('apiKey')?.value?.trim()||'',reasoning=$('reasoningEffort')?.value||'medium';
    const instruction=sourceInstruction();
    const settings={ensemble:$('ensemble')?.value||'frei',measures:Number($('measures')?.value)||32,meter:$('meter')?.value||'4/4',bpm:Number($('tempo')?.value)||96,key:$('musicalKey')?.value||'frei',task:$('prompt')?.value||'',sourceInstruction:instruction};
    btn.disabled=true;
    if($('status'))$('status').innerHTML=`<span class="ok">Engine Build ${E.BUILD} entwickelt musikalischen Impuls …</span>`;
    try{
      const source=typeof uploadedScore!=='undefined'?uploadedScore:null;
      const r=await E.compose({provider,model,apiKey,reasoning,settings,source,sourceName:currentSourceName(),sourceInstruction:instruction,onConcept:({concept,conceptOnly})=>{showConcept(concept,provider,conceptOnly)}});
      showConcept(r.concept||'',provider,r.conceptOnly);
      if(r.conceptOnly){attachDiagnostic(r,null);if($('status'))$('status').innerHTML=`<span class="ok">Musikalischer Entwurf erstellt · keine MIDI-Komposition erzeugt · Engine Build ${E.BUILD}</span>`;return;}
      const score=toArrayScore(r.score);
      if(typeof lastScore!=='undefined')lastScore=score;if(typeof mainPlayerScore!=='undefined')mainPlayerScore=score;if(typeof lastProvider!=='undefined')lastProvider=provider;if(typeof lastModel!=='undefined')lastModel=model;
      if(typeof buildMidi==='function'&&typeof lastMidiBytes!=='undefined')lastMidiBytes=buildMidi(score);
      if($('mainPlayerTitle'))$('mainPlayerTitle').textContent=`Komposition: ${score.ti||'Unbenannt'}`;
      if($('downloadBtn'))$('downloadBtn').disabled=false;if($('jsonBtn'))$('jsonBtn').disabled=false;
      if($('lastResult'))$('lastResult').innerHTML=`<strong>${String(score.ti||'Komposition')}</strong><br>${score.bpm||settings.bpm} BPM · ${String(score.k||'')} · ${(score.tr||[]).length} Spur(en)<br><small>${String(score.sm||'')}</small>`;
      try{validateScore?.(score)}catch(_){}try{renderChatContext?.()}catch(_){}try{addHistory?.(score,provider,model,r.concept||'')}catch(_){}
      attachDiagnostic(r,score);
      if($('status'))$('status').innerHTML=`<span class="ok">Komposition abgeschlossen · Engine Build ${E.BUILD}</span>`;
    }catch(e){if($('status'))$('status').innerHTML=`<span class="err">Fehler: ${String(e?.message||e)}</span>`;}
    finally{btn.disabled=false;}
  };
  showAuthoritativeBuild();
  return true;
}
let n=0,t=setInterval(()=>{if(install()||++n>200)clearInterval(t)},100);
window.addEventListener('compositionlab-experiment-ready',()=>setTimeout(showAuthoritativeBuild,0));
window.addEventListener('compositionlab-storage-restored',()=>setTimeout(showAuthoritativeBuild,0));
})();

(()=>{
'use strict';
if(window.__compositionLabExperimentLoader)return;
window.__compositionLabExperimentLoader=true;
const fresh=Date.now();
const load=(src,onload)=>{const s=document.createElement('script');s.async=false;s.src=src+'?fresh='+fresh;if(onload)s.onload=onload;(document.head||document.body).appendChild(s)};
load('/Composer-Lab/shared/experiment-engine.js',()=>load('/Composer-Lab/shared/experiment-adapter.js',()=>load('/Composer-Lab/shared/gemini-model-config.js',()=>load('/Composer-Lab/shared/root-interface-v47.js'))));
})();