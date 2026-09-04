(()=>{
'use strict';
const INTERFACE_BUILD=17;
const $=id=>document.getElementById(id);
function clone(x){try{return typeof safeClone==='function'?safeClone(x):JSON.parse(JSON.stringify(x))}catch(_){return x}}
function toObjectScore(score){
  const s=JSON.parse(JSON.stringify(score||{}));
  s.tr=Array.isArray(s.tr)?s.tr.map((t,i)=>({
    nm:t.nm||`Spur ${i+1}`,
    ch:Number(t.ch??i)%16,
    pg:Number(t.pg)||0,
    nt:(Array.isArray(t.nt)?t.nt:[]).map(n=>Array.isArray(n)?{
      t:Number(n[0])||0,d:Math.max(.03,Number(n[1])||.25),p:Number(n[2]),v:Math.max(1,Math.min(127,Number(n[3])||88)),st:Number(n[4])||0,g:Number(n[5])||.95
    }:n).filter(n=>Number.isFinite(Number(n.p)))
  })):[];
  return typeof normalizeScore==='function'?normalizeScore(s):s;
}
function install(){
  const E=window.CompositionLabEngine,btn=$('composeBtn');
  if(!E||E.BUILD!==14||!btn||typeof state==='undefined')return false;
  const handler=async()=>{
    const provider=$('pageProvider')?.value||state.provider||$('provider')?.value||'openai';
    const model=$('pageModel')?.value?.trim()||state.model||$('model')?.value?.trim()||'';
    const reasoning=$('reasoningStrength')?.value||'medium';
    const apiKey=(state.keys&&state.keys[provider])||'';
    const idea=$('compIdea')?.value||'';
    const task=$('compTask')?.value||idea;
    const source=state.source||null;
    const sourceInstruction=source?task:'';
    const settings={
      ensemble:$('ensemble')?.value||'frei',
      measures:Number($('length')?.value)||32,
      meter:$('meter')?.value||'4/4',
      bpm:Number($('tempo')?.value)||92,
      key:$('keySig')?.value||'frei',
      idea,task,sourceInstruction
    };
    btn.disabled=true;
    try{setStatus?.('main','Engine Build 14 komponiert …')}catch(_){}
    try{
      const r=await E.compose({provider,model,apiKey,reasoning,settings,source,sourceName:state.source?.ti||$('sourceName')?.value||'',sourceInstruction});
      if(r.conceptOnly){
        if($('compIdea'))$('compIdea').value=r.concept||idea;
        try{saveState?.()}catch(_){}
        try{setStatus?.('main','Musikalischer Entwurf erstellt · Engine Build 14')}catch(_){}
        return;
      }
      const score=toObjectScore(r.score);
      score.bpm=settings.bpm;
      score._meta={...(score._meta||{}),ensemble:settings.ensemble,measures:settings.measures,idea,task,sourceInstruction,generatedConcept:r.concept,engineVersion:E.VERSION,engineBuild:E.BUILD};
      state.provider=provider;state.model=model;state.current=score;
      state.history=Array.isArray(state.history)?state.history:[];
      state.history.push(clone(score));if(state.history.length>20)state.history.shift();
      try{saveState?.()}catch(_){}
      try{syncUI?.()}catch(_){}
      try{setStatus?.('main','Neue Komposition geladen · Engine Build 14')}catch(_){}
      window.__compositionLabLastSharedDiagnostic=r.diagnostic;
    }catch(e){
      try{setStatus?.('main',String(e?.message||e),'err')}catch(_){alert(String(e?.message||e))}
    }finally{btn.disabled=false;}
  };
  window.__ipadEngine14ComposeHandler=handler;
  btn.onclick=handler;
  btn.dataset.sharedEngine='14';
  window.__compositionLabBuilds={engine:14,interface:INTERFACE_BUILD,platform:'iPad'};
  const modal=$('techModal')?.querySelector('.modal');
  if(modal&&!$('ipadEngine14Badge')){
    const d=document.createElement('div');d.id='ipadEngine14Badge';d.className='ipad-tech-section';
    d.innerHTML='<h3>Builds</h3><p class="hint"><strong>Engine Build 14</strong><br>Interface Build iPad 17</p>';
    const foot=modal.querySelector('.modalfoot');if(foot)modal.insertBefore(d,foot);else modal.appendChild(d);
  }
  return true;
}
let tries=0;
const timer=setInterval(()=>{
  tries++;
  if(install()){
    const btn=$('composeBtn');
    if(tries>80){clearInterval(timer);return}
    if(btn&&window.__ipadEngine14ComposeHandler&&btn.onclick!==window.__ipadEngine14ComposeHandler)btn.onclick=window.__ipadEngine14ComposeHandler;
  }
  if(tries>120)clearInterval(timer);
},250);
})();