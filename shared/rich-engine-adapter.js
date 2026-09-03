(()=>{
'use strict';
function install(){
  const E=window.CompositionLabEngine,btn=document.getElementById('composeBtn');
  if(!E||!btn||typeof state==='undefined')return false;
  if(btn.dataset.sharedEngine==='1')return true;
  btn.dataset.sharedEngine='1';
  const $=id=>document.getElementById(id);
  function toObjectScore(score){
    const s=JSON.parse(JSON.stringify(score||{}));
    s.tr=Array.isArray(s.tr)?s.tr.map((t,i)=>({nm:t.nm||`Spur ${i+1}`,ch:Number(t.ch??i)%16,pg:Number(t.pg)||0,nt:(Array.isArray(t.nt)?t.nt:[]).map(n=>Array.isArray(n)?{t:Number(n[0])||0,d:Math.max(.03,Number(n[1])||.25),p:Number(n[2]),v:Math.max(1,Math.min(127,Number(n[3])||88)),st:Number(n[4])||0,g:Number(n[5])||.95}:n).filter(n=>Number.isFinite(Number(n.p)))})):[];
    return typeof normalizeScore==='function'?normalizeScore(s):s;
  }
  function attachDiagnostic(r,score){
    window.__compositionLabLastSharedDiagnostic=r.diagnostic;
    const d=window.__compositionLabDiagnosticsV2?.active;
    if(d){d.engineVersion=r.engineVersion;d.sharedEngine=r.diagnostic;d.calls=[{index:1,kind:'concept',systemPrompt:r.diagnostic.systemPrompt,userPrompt:r.diagnostic.conceptPrompt,response:r.diagnostic.conceptResponse},{index:2,kind:'composition',systemPrompt:r.diagnostic.systemPrompt,userPrompt:r.diagnostic.compositionPrompt,response:r.diagnostic.scoreResponse}];d.result=score;d.updatedAt=new Date().toISOString();}
  }
  btn.onclick=async()=>{
    const provider=$('pageProvider')?.value||state.provider||$('provider')?.value||'openai';
    const model=$('pageModel')?.value?.trim()||state.model||$('model')?.value?.trim()||'';
    const reasoning=$('reasoningStrength')?.value||'medium';
    const apiKey=(state.keys&&state.keys[provider])||'';
    const idea=$('compIdea')?.value||'';
    const task=$('compTask')?.value||idea;
    const settings={ensemble:$('ensemble')?.value||'frei',measures:Number($('length')?.value)||32,meter:$('meter')?.value||'4/4',bpm:Number($('tempo')?.value)||92,key:$('keySig')?.value||'frei',idea,task};
    btn.disabled=true;try{setStatus?.('main',`Gemeinsame Engine ${E.VERSION} entwickelt musikalischen Impuls …`)}catch(_){}
    try{
      const r=await E.compose({provider,model,apiKey,reasoning,settings,source:state.source||null,sourceName:state.source?.ti||$('sourceName')?.value||''});
      const score=toObjectScore(r.score);
      score.bpm=settings.bpm;
      score._meta={...(score._meta||{}),ensemble:settings.ensemble,measures:settings.measures,idea,task,generatedConcept:r.concept,engineVersion:E.VERSION};
      state.provider=provider;state.model=model;state.current=score;
      state.history=Array.isArray(state.history)?state.history:[];state.history.push(typeof safeClone==='function'?safeClone(score):JSON.parse(JSON.stringify(score)));if(state.history.length>20)state.history.shift();
      try{saveState?.()}catch(_){}try{syncUI?.()}catch(_){}
      attachDiagnostic(r,score);
      try{setStatus?.('main',`Neue Komposition geladen · gemeinsame Engine ${E.VERSION}`)}catch(_){}
    }catch(e){try{setStatus?.('main',String(e?.message||e),'err')}catch(_){alert(String(e?.message||e))}}
    finally{btn.disabled=false;}
  };
  const modal=$('techModal')?.querySelector('.modal');
  if(modal&&!$('sharedEngineBadge')){const d=document.createElement('div');d.id='sharedEngineBadge';d.className='ipad-tech-section';d.innerHTML=`<h3>Kompositionsengine</h3><p class="hint">Gemeinsamer Kern für Android, iPad und Mac: <strong>${E.VERSION}</strong></p>`;const foot=modal.querySelector('.modalfoot');if(foot)modal.insertBefore(d,foot);else modal.appendChild(d)}
  return true;
}
let n=0,t=setInterval(()=>{if(install()||++n>300)clearInterval(t)},100);
})();

(()=>{
if(window.__compositionLabExperimentLoader)return;window.__compositionLabExperimentLoader=true;
const x=document.createElement('script');x.src='/Composer-Lab/shared/experiment-engine.js?v=20260903-1';x.onload=()=>{const a=document.createElement('script');a.src='/Composer-Lab/shared/experiment-adapter.js?v=20260903-2';(document.head||document.body).appendChild(a)};(document.head||document.body).appendChild(x);
})();