(()=>{
'use strict';
const INTERFACE_BUILD=21;
const $=id=>document.getElementById(id);
function clone(x){try{return typeof safeClone==='function'?safeClone(x):JSON.parse(JSON.stringify(x))}catch(_){return x}}
function toArrayScore(score){
  if(!score)return null;
  const s=JSON.parse(JSON.stringify(score));
  s.tr=Array.isArray(s.tr)?s.tr.map((t,i)=>({
    nm:t.nm||`Spur ${i+1}`,
    ch:Number(t.ch??i)%16,
    pg:Number(t.pg)||0,
    nt:(Array.isArray(t.nt)?t.nt:[]).map(n=>Array.isArray(n)?n:[
      Number(n.t)||0,
      Math.max(.03,Number(n.d)||.25),
      Number(n.p),
      Math.max(1,Math.min(127,Number(n.v)||88)),
      Number(n.st)||0,
      Number(n.g)||.95
    ]).filter(n=>Number.isFinite(Number(n[2]))),
    ct:Array.isArray(t.ct)?t.ct:[]
  })):[];
  return s;
}
function toObjectScore(score){
  const s=JSON.parse(JSON.stringify(score||{}));
  s.tr=Array.isArray(s.tr)?s.tr.map((t,i)=>({
    nm:t.nm||`Spur ${i+1}`,
    ch:Number(t.ch??i)%16,
    pg:Number(t.pg)||0,
    nt:(Array.isArray(t.nt)?t.nt:[]).map(n=>Array.isArray(n)?{
      t:Number(n[0])||0,d:Math.max(.03,Number(n[1])||.25),p:Number(n[2]),v:Math.max(1,Math.min(127,Number(n[3])||88)),st:Number(n[4])||0,g:Number(n[5])||.95
    }:n).filter(n=>Number.isFinite(Number(n.p))),
    ct:Array.isArray(t.ct)?t.ct:[]
  })):[];
  return typeof normalizeScore==='function'?normalizeScore(s):s;
}
function fixApiKeyFields(){
  ['keyOpenAI','keyAnthropic','keyGemini'].forEach(id=>{
    const e=$(id);if(!e)return;
    e.type='text';e.autocomplete='off';e.setAttribute('autocapitalize','none');e.setAttribute('autocorrect','off');e.setAttribute('spellcheck','false');e.setAttribute('inputmode','text');e.setAttribute('data-1p-ignore','true');e.setAttribute('data-lpignore','true');e.setAttribute('data-form-type','other');
  });
}
function ensureConceptBox(){
  let box=$('engine14ConceptBox');if(box)return box;
  const task=$('compTask')||$('compIdea');const host=task?.closest('.field')?.parentElement;if(!host)return null;
  const h=document.createElement('h3');h.id='engine14ConceptHeading';h.textContent='Musikalischer Impuls';
  box=document.createElement('div');box.id='engine14ConceptBox';box.className='idea-box';box.style.whiteSpace='pre-wrap';box.textContent='Noch kein Impuls erzeugt.';
  task.closest('.field').after(h,box);return box;
}
function showConcept(text){const box=ensureConceptBox();if(box)box.textContent=String(text||'–')}
function safeFilename(x){return String(x||'Komposition').replace(/[^\wäöüÄÖÜß -]+/g,'_').replace(/\s+/g,' ').trim().slice(0,80)||'Komposition'}
function downloadDiagnostic(){
  const d=window.__compositionLabLastDiagnostic;if(!d){alert('Noch keine Diagnosedatei vorhanden. Bitte zuerst eine neue Komposition mit Engine Build 14 erzeugen.');return}
  const title=safeFilename(d?.result?.ti||state?.current?.ti||'Komposition'),stamp=new Date(d.createdAt||Date.now()).toISOString().replace(/[:.]/g,'-');
  const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${title}-Diagnose-Engine14-${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
function ensureDiagnosticButton(){
  let b=$('ipadDiagnosticDownload');if(!b){const save=$('saveMidi'),host=save?.parentElement;if(host){b=document.createElement('button');b.id='ipadDiagnosticDownload';b.className='btn';b.type='button';b.textContent='Diagnosedatei speichern';b.onclick=downloadDiagnostic;host.appendChild(b)}}
  if(b){b.disabled=!window.__compositionLabLastDiagnostic;b.title=b.disabled?'Nach der nächsten Komposition verfügbar':'Kompositionsdiagnose als JSON speichern'}return b;
}
function makeDiagnostic({provider,model,reasoning,settings,sourceName,source,r,score}){return{format:'composition-lab-composition-diagnostic',version:3,createdAt:new Date().toISOString(),platform:'iPad WebApp',interfaceBuild:INTERFACE_BUILD,engineVersion:window.CompositionLabEngine?.VERSION||r?.engineVersion||'',engineBuild:window.CompositionLabEngine?.BUILD||r?.engineBuild||14,provider,model,reasoning,settings:clone(settings),sourceName:sourceName||'',source:source?clone(source):null,concept:r?.concept||'',usage:clone(r?.usage||null),engineDiagnostic:clone(r?.diagnostic||null),result:score?clone(score):null}}
function bindMainPlayer(score){
  try{if(typeof renderMain==='function')renderMain()}catch(_){}try{if(typeof bindPlayerScore==='function')bindPlayerScore('main',score)}catch(_){}
  const box=document.querySelector('[data-player="main"]');if(!box)return;
  const bindButtons=()=>{const play=box.querySelector('.play'),pause=box.querySelector('.pause'),stop=box.querySelector('.stop');if(play)play.onclick=()=>{try{const r=window.playPlayer?.('main');if(r?.catch)r.catch(e=>setStatus?.('main',String(e?.message||e),'err'))}catch(e){try{setStatus?.('main',String(e?.message||e),'err')}catch(_){}}};if(pause)pause.onclick=()=>{try{window.pausePlayer?.('main')}catch(e){}};if(stop)stop.onclick=()=>{try{window.stopPlayer?.('main');setStatus?.('main','Gestoppt.')}catch(e){}}};
  bindButtons();window.addEventListener('compositionlab-samples-ready',()=>{try{bindPlayerScore?.('main',state.current||state.source);bindButtons()}catch(_){}},{once:true});
}
function install(){
  const E=window.CompositionLabEngine,btn=$('composeBtn');if(!E||E.BUILD!==14||!btn||typeof state==='undefined')return false;
  fixApiKeyFields();const tech=$('techMenu');if(tech&&!tech.dataset.ipadKeyFix){tech.dataset.ipadKeyFix='1';tech.addEventListener('click',()=>setTimeout(fixApiKeyFields,0),true)}
  ensureConceptBox();ensureDiagnosticButton();if(state.current?._meta?.generatedConcept)showConcept(state.current._meta.generatedConcept);
  const handler=async()=>{
    const provider=$('pageProvider')?.value||state.provider||$('provider')?.value||'openai';
    const model=$('pageModel')?.value?.trim()||state.model||$('model')?.value?.trim()||'';
    const reasoning=$('reasoningStrength')?.value||'medium';
    const apiKey=(state.keys&&state.keys[provider])||'';
    const task=$('compTask')?.value||'';
    const source=toArrayScore(state.source||null);
    const sourceName=state.source?.ti||$('sourceName')?.value||'MIDI-Datei';
    const sourceInstruction='';
    const settings={ensemble:$('ensemble')?.value||'frei',measures:Number($('length')?.value)||32,meter:$('meter')?.value||'4/4',bpm:Number($('tempo')?.value)||96,key:$('keySig')?.value||'frei',task,sourceInstruction};
    btn.disabled=true;try{setStatus?.('main','Engine Build 14 entwickelt musikalischen Impuls …')}catch(_){}
    try{
      const r=await E.compose({provider,model,apiKey,reasoning,settings,source,sourceName,sourceInstruction,onConcept:({concept})=>showConcept(concept||'')});
      showConcept(r.concept||'');
      if(r.conceptOnly){window.__compositionLabLastDiagnostic=makeDiagnostic({provider,model,reasoning,settings,sourceName,source,r,score:null});window.__compositionLabLastSharedDiagnostic=r.diagnostic;ensureDiagnosticButton();try{saveState?.()}catch(_){}try{setStatus?.('main','Musikalischer Entwurf erstellt · Engine Build 14')}catch(_){}return}
      const score=toObjectScore(r.score);
      score._meta={...(score._meta||{}),ensemble:settings.ensemble,measures:settings.measures,task,generatedConcept:r.concept,engineVersion:E.VERSION,engineBuild:E.BUILD};
      state.provider=provider;state.model=model;state.current=score;state.history=Array.isArray(state.history)?state.history:[];state.history.push(clone(score));if(state.history.length>20)state.history.shift();
      window.__compositionLabLastSharedDiagnostic=r.diagnostic;window.__compositionLabLastDiagnostic=makeDiagnostic({provider,model,reasoning,settings,sourceName,source,r,score});ensureDiagnosticButton();
      try{saveState?.()}catch(_){}try{syncUI?.()}catch(_){}bindMainPlayer(score);try{setStatus?.('main','Neue Komposition geladen · Engine Build 14')}catch(_){}
    }catch(e){try{setStatus?.('main',String(e?.message||e),'err')}catch(_){alert(String(e?.message||e))}}finally{btn.disabled=false}
  };
  window.__ipadEngine14ComposeHandler=handler;btn.onclick=handler;btn.dataset.sharedEngine='14';window.__compositionLabBuilds={engine:14,interface:INTERFACE_BUILD,platform:'iPad'};
  const modal=$('techModal')?.querySelector('.modal');if(modal){let d=$('ipadEngine14Badge');if(!d){d=document.createElement('div');d.id='ipadEngine14Badge';d.className='ipad-tech-section';const foot=modal.querySelector('.modalfoot');if(foot)modal.insertBefore(d,foot);else modal.appendChild(d)}d.innerHTML='<h3>Builds</h3><p class="hint"><strong>Engine Build 14</strong><br>Interface Build iPad 21</p>'}
  if(state.current)bindMainPlayer(state.current);return true;
}
let tries=0;const timer=setInterval(()=>{tries++;if(install()){const btn=$('composeBtn');fixApiKeyFields();ensureDiagnosticButton();if(tries>80){clearInterval(timer);return}if(btn&&window.__ipadEngine14ComposeHandler&&btn.onclick!==window.__ipadEngine14ComposeHandler)btn.onclick=window.__ipadEngine14ComposeHandler}if(tries>120)clearInterval(timer)},250);
})();