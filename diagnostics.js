(()=>{
'use strict';
if(window.__compositionLabDiagnosticsInstalled)return;
window.__compositionLabDiagnosticsInstalled=true;

const VERSION=1;
const state={active:null,last:null};
const $=id=>document.getElementById(id);

function clean(value,depth=0){
  if(depth>10)return '[max depth]';
  if(value==null||['string','number','boolean'].includes(typeof value))return value;
  if(Array.isArray(value))return value.map(v=>clean(v,depth+1));
  if(typeof value==='object'){
    const out={};
    for(const [key,val] of Object.entries(value)){
      if(/api.?key|secret|token|authorization|password|\bkeys\b/i.test(key))continue;
      try{out[key]=clean(val,depth+1)}catch(_){}
    }
    return out;
  }
  return String(value);
}

function currentScore(){
  try{if(typeof lastScore!=='undefined'&&lastScore)return clean(lastScore)}catch(_){}
  return null;
}
function currentSource(){
  try{if(typeof uploadedScore!=='undefined'&&uploadedScore)return clean(uploadedScore)}catch(_){}
  return null;
}
function settings(){
  const value=id=>$(id)?.value??null;
  return {
    provider:value('provider'),model:value('model'),reasoning:value('reasoningEffort'),
    measures:value('measures'),meter:value('meter'),tempo:value('tempo'),
    key:value('musicalKey'),ensemble:value('ensemble'),prompt:value('prompt')
  };
}
function snapshot(){
  if(!state.active)return;
  state.active.result=currentScore();
  state.active.source=currentSource();
  state.active.updatedAt=new Date().toISOString();
  state.last=state.active;
  updateUi();
}
function begin(kind){
  state.active={
    format:'composition-lab-diagnostic',diagnosticVersion:VERSION,kind,
    engineBuild:window.CompositionLabEngine?.BUILD||14,
    startedAt:new Date().toISOString(),settings:settings(),source:currentSource(),calls:[],result:null,error:null
  };
  state.last=state.active;
  updateUi();
  setTimeout(snapshot,300);setTimeout(snapshot,1200);
}
function installEngineHook(){
  const engine=window.CompositionLabEngine;
  if(!engine||typeof engine.callLLM!=='function')return false;
  if(engine.__diagnosticsWrapped)return true;
  const base=engine.callLLM.bind(engine);
  engine.callLLM=async args=>{
    const rec=state.active?{
      index:state.active.calls.length+1,startedAt:new Date().toISOString(),
      provider:args?.provider||null,model:args?.model||null,
      systemPrompt:args?.systemPrompt||'',userPrompt:args?.userPrompt||'',wantJson:!!args?.wantJson
    }:null;
    if(rec)state.active.calls.push(rec);
    try{
      const result=await base(args);
      if(rec){rec.response=clean(result);rec.completedAt=new Date().toISOString()}
      setTimeout(snapshot,0);return result;
    }catch(error){
      if(rec){rec.error=String(error?.message||error);rec.completedAt=new Date().toISOString()}
      if(state.active)state.active.error=String(error?.message||error);
      updateUi();throw error;
    }
  };
  engine.__diagnosticsWrapped=true;
  return true;
}
function download(){
  if(!state.last)return;
  snapshot();
  const text=JSON.stringify(state.last,null,2);
  const blob=new Blob([text],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`Composition-Lab-Diagnose-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
let button=null,info=null;
function installUi(){
  const host=$('technicalSection')?.querySelector('.foldcontent');
  if(!host)return false;
  let wrap=$('diagnosticsSection');
  if(!wrap){
    wrap=document.createElement('div');wrap.id='diagnosticsSection';
    wrap.style.cssText='margin-top:14px;padding-top:12px;border-top:1px solid var(--line,#444)';
    wrap.innerHTML='<strong>Diagnose</strong><div class="toolbar" style="margin-top:8px;margin-bottom:4px"><button type="button" class="secondary smallbtn" id="diagnosticsDownloadBtn" disabled>Diagnosedatei herunterladen</button></div><div class="uploadinfo" id="diagnosticsInfo">Noch kein KI-Vorgang aufgezeichnet. API-Schlüssel werden nicht gespeichert.</div>';
    host.appendChild(wrap);
  }
  button=$('diagnosticsDownloadBtn');info=$('diagnosticsInfo');
  if(button)button.onclick=download;
  updateUi();return true;
}
function updateUi(){
  if(!button)installUi();
  if(button)button.disabled=!state.last;
  if(info&&state.last)info.textContent=`Diagnose bereit · ${state.last.calls.length} KI-Aufruf${state.last.calls.length===1?'':'e'} · API-Schlüssel ausgeschlossen.`;
}

$('composeBtn')?.addEventListener('click',()=>begin('composition'),true);
document.addEventListener('click',e=>{if(e.target?.closest?.('#sourceDiscussBtn'))begin('midi-discussion')},true);
window.addEventListener('compositionlab-consolidated-ready',()=>{installEngineHook();installUi()},{once:true});
let tries=0;const timer=setInterval(()=>{tries++;if(installEngineHook()&&installUi())clearInterval(timer);if(tries>100)clearInterval(timer)},100);
})();
