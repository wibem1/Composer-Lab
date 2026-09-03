(()=>{
'use strict';
function install(){
  const E=window.CompositionLabEngine,btn=document.getElementById('composeBtn');
  if(!E||!btn)return false;
  if(btn.dataset.sharedEngine==='1')return true;
  btn.dataset.sharedEngine='1';
  const $=id=>document.getElementById(id);
  function toArrayScore(score){
    const s=JSON.parse(JSON.stringify(score||{}));
    s.tr=Array.isArray(s.tr)?s.tr.map((t,i)=>({
      nm:t.nm||`Spur ${i+1}`,ch:Number(t.ch??i)%16,pg:Number(t.pg)||0,
      nt:(Array.isArray(t.nt)?t.nt:[]).map(n=>Array.isArray(n)?n:[Number(n.t)||0,Math.max(.03,Number(n.d)||.25),Number(n.p),Math.max(1,Math.min(127,Number(n.v)||88)),Number(n.st)||0,Number(n.g)||.95]).filter(n=>Number.isFinite(Number(n[2]))),
      ct:Array.isArray(t.ct)?t.ct:[]
    })):[];
    return s;
  }
  btn.onclick=async()=>{
    try{saveCurrentState?.()}catch(_){}
    const provider=$('provider')?.value||'openai',model=$('model')?.value?.trim()||'',apiKey=$('apiKey')?.value?.trim()||'',reasoning=$('reasoningEffort')?.value||'medium';
    const settings={ensemble:$('ensemble')?.value||'frei',measures:Number($('measures')?.value)||32,meter:$('meter')?.value||'4/4',bpm:Number($('tempo')?.value)||96,key:$('musicalKey')?.value||'frei',task:$('prompt')?.value||''};
    btn.disabled=true;if($('status'))$('status').innerHTML='<span class="ok">Gemeinsame Engine entwickelt musikalischen Impuls …</span>';
    try{
      const r=await E.compose({provider,model,apiKey,reasoning,settings,source:typeof uploadedScore!=='undefined'?uploadedScore:null,sourceName:typeof uploadedName!=='undefined'?uploadedName:''});
      const score=toArrayScore(r.score);
      if(typeof lastConcept!=='undefined')lastConcept=r.concept||'';
      if($('conceptView'))$('conceptView').innerHTML=`<strong>${provider.toUpperCase()} Konzept · ${E.VERSION}:</strong><br>${String(r.concept||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g,'<br>')}`;
      if(typeof lastScore!=='undefined')lastScore=score;
      if(typeof mainPlayerScore!=='undefined')mainPlayerScore=score;
      if(typeof lastProvider!=='undefined')lastProvider=provider;
      if(typeof lastModel!=='undefined')lastModel=model;
      if(typeof buildMidi==='function'&&typeof lastMidiBytes!=='undefined')lastMidiBytes=buildMidi(score);
      if($('mainPlayerTitle'))$('mainPlayerTitle').textContent=`Komposition: ${score.ti||'Unbenannt'}`;
      if($('downloadBtn'))$('downloadBtn').disabled=false;if($('jsonBtn'))$('jsonBtn').disabled=false;
      if($('lastResult'))$('lastResult').innerHTML=`<strong>${String(score.ti||'Komposition')}</strong><br>${score.bpm||settings.bpm} BPM · ${String(score.k||'')} · ${(score.tr||[]).length} Spur(en)<br><small>${String(score.sm||'')}</small>`;
      try{validateScore?.(score)}catch(_){}try{renderChatContext?.()}catch(_){}try{addHistory?.(score,provider,model,r.concept||'')}catch(_){}
      window.__compositionLabLastSharedDiagnostic=r.diagnostic;
      if($('status'))$('status').innerHTML=`<span class="ok">Komposition abgeschlossen · gemeinsame Engine ${E.VERSION}</span>`;
    }catch(e){if($('status'))$('status').innerHTML=`<span class="err">Fehler: ${String(e?.message||e)}</span>`;}
    finally{btn.disabled=false;}
  };
  const tech=$('technicalSection')?.querySelector('.foldcontent');
  if(tech&&!$('sharedEngineBadge')){const d=document.createElement('div');d.id='sharedEngineBadge';d.className='uploadinfo';d.style.marginTop='12px';d.textContent=`Gemeinsame Kompositionsengine: ${E.VERSION}`;tech.appendChild(d)}
  return true;
}
let n=0,t=setInterval(()=>{if(install()||++n>200)clearInterval(t)},100);
})();