(()=>{
'use strict';
const DIAG_VERSION=2, ASSET_VERSION='20260903-18';
if(!document.getElementById('composeBtn')){
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    try{
      let d=document;
      for(let i=0;i<14;i++){
        const f=d?.getElementById('app');
        if(f?.contentDocument)d=f.contentDocument;else break;
      }
      if(d?.getElementById('composeBtn')){
        if(!d.getElementById('compositionLabDiagnosticsV2')){
          const s=d.createElement('script');
          s.id='compositionLabDiagnosticsV2';
          s.src='/Composer-Lab/diagnostics-v2.js?core='+ASSET_VERSION;
          (d.head||d.body).appendChild(s);
        }
        clearInterval(timer);
      }
    }catch(e){}
    if(tries>800)clearInterval(timer);
  },100);
  return;
}
if(window.__compositionLabDiagnosticsV2Installed)return;
window.__compositionLabDiagnosticsV2Installed=true;
const mode=document.getElementById('technicalSection')?'android-webview':'ipad-rich';
const store={active:null,last:null};
window.__compositionLabDiagnosticsV2=store;
const $=id=>document.getElementById(id);
const val=(...ids)=>{for(const id of ids){const e=$(id);if(e&&'value' in e)return e.value}return null};
function clean(x,depth=0){if(depth>10)return '[max depth]';if(x==null||typeof x==='string'||typeof x==='number'||typeof x==='boolean')return x;if(Array.isArray(x))return x.map(v=>clean(v,depth+1));if(typeof x==='object'){const o={};for(const [k,v] of Object.entries(x)){if(/api.?key|secret|token|authorization|password|\bkeys\b/i.test(k))continue;try{o[k]=clean(v,depth+1)}catch(e){}}return o}return String(x)}
function getProvider(){try{return val('pageProvider','provider')||(typeof state!=='undefined'?state.provider:null)||null}catch(e){return val('pageProvider','provider')}}
function getModel(){try{return val('pageModel','model')||(typeof state!=='undefined'?state.model:null)||null}catch(e){return val('pageModel','model')}}
function settings(){return{provider:getProvider(),model:getModel(),reasoning:val('reasoningStrength','reasoningEffort'),measures:val('length','measures'),meter:val('meter'),tempo:val('tempo'),key:val('keySig','musicalKey'),ensemble:val('ensemble'),compositionIdea:val('compIdea'),compositionTask:val('compTask'),freePrompt:val('prompt'),sourceName:val('sourceName'),templateLength:val('templateLength'),ui:{href:location.href,userAgent:navigator.userAgent,platform:navigator.platform||'',language:navigator.language||'',online:navigator.onLine,androidBridge:!!window.AndroidBridge}}}
function currentScore(){try{if(typeof lastScore!=='undefined'&&lastScore)return clean(lastScore)}catch(e){}try{if(typeof state!=='undefined'&&state.current)return clean(state.current)}catch(e){}try{if(typeof mainPlayerScore!=='undefined'&&mainPlayerScore)return clean(mainPlayerScore)}catch(e){}return null}
function buildLabel(){return $('ipadBuild')?.textContent||document.querySelector('.ipad-build')?.textContent||null}
function begin(){const b=window.__compositionLabBuilds||{};const d={format:'composition-lab-diagnostic',diagnosticVersion:DIAG_VERSION,diagnosticsAsset:ASSET_VERSION,uiMode:mode,build:buildLabel(),engineBuild:b.engine||window.CompositionLabEngine?.BUILD||null,interfaceBuild:b.interface||null,interface:b.platform||null,startedAt:new Date().toISOString(),settings:settings(),calls:[],result:null,error:null};store.active=d;store.last=d;updateUi();setTimeout(snapshot,300);setTimeout(snapshot,1200)}
function snapshot(){if(!store.active)return;const s=currentScore();if(s)store.active.result=s;const b=window.__compositionLabBuilds||{};store.active.engineBuild=b.engine||window.CompositionLabEngine?.BUILD||store.active.engineBuild||null;store.active.interfaceBuild=b.interface||store.active.interfaceBuild||null;store.active.interface=b.platform||store.active.interface||null;store.active.updatedAt=new Date().toISOString();updateUi()}
function callMeta(args){if(args.length>=5)return{provider:args[0],model:args[1],systemPrompt:args[3],userPrompt:args[4],wantJson:!!args[5]};return{provider:getProvider(),model:getModel(),systemPrompt:args[0],userPrompt:args[1],wantJson:null}}
try{const baseCallLLM=callLLM;callLLM=async function(...args){const active=store.active;const rec=active?{index:active.calls.length+1,startedAt:new Date().toISOString(),...callMeta(args),response:null,error:null}:null;if(rec)active.calls.push(rec);try{const out=await baseCallLLM.apply(this,args);if(rec){rec.response=typeof out==='string'?out:clean(out);rec.completedAt=new Date().toISOString()}setTimeout(snapshot,0);setTimeout(snapshot,250);setTimeout(snapshot,800);return out}catch(e){if(rec){rec.error=String(e?.message||e);rec.completedAt=new Date().toISOString();active.error=rec.error}updateUi();throw e}}}catch(e){console.warn('Composition Lab diagnostics: callLLM konnte nicht protokolliert werden',e)}
function filename(){const t=new Date().toISOString().replace(/[:.]/g,'-');return`Composition-Lab-Diagnose-${mode}-${t}.json`}
function save(){if(!store.last)return;snapshot();const text=JSON.stringify(store.last,null,2),name=filename(),type='application/json';try{if(typeof downloadBlob==='function'){downloadBlob(text,name,type);return}}catch(e){}if(window.AndroidBridge?.saveBlob){const r=new FileReader();r.onloadend=()=>window.AndroidBridge.saveBlob(r.result,name,type);r.readAsDataURL(new Blob([text],{type}));return}const a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
let button=null,info=null;
function installUi(){if(mode==='android-webview'){const host=$('technicalSection')?.querySelector('.foldcontent');if(!host)return false;if($('diagnosticV2Btn')){button=$('diagnosticV2Btn');info=$('diagnosticV2Info');return true}const wrap=document.createElement('div');wrap.style.cssText='margin-top:14px;padding-top:12px;border-top:1px solid var(--line,#ccc)';wrap.innerHTML='<strong>Diagnose</strong><div class="toolbar" style="margin-top:8px;margin-bottom:4px"><button type="button" class="secondary smallbtn" id="diagnosticV2Btn" disabled>Diagnosedatei herunterladen</button></div><div class="uploadinfo" id="diagnosticV2Info">Nach einem Kompositionsversuch werden die tatsächlich verwendeten Prompts, KI-Antworten, Einstellungen und das erzeugte Score-JSON gespeichert. API-Schlüssel werden ausgeschlossen.</div>';host.appendChild(wrap)}else{const modal=$('techModal')?.querySelector('.modal');if(!modal)return false;if($('diagnosticV2Btn')){button=$('diagnosticV2Btn');info=$('diagnosticV2Info');return true}const foot=modal.querySelector('.modalfoot'),sec=document.createElement('div');sec.className='ipad-tech-section';sec.innerHTML='<h3>Diagnose</h3><p class="hint">Erfasst beim nächsten Kompositionsversuch die tatsächlich verwendeten Prompts, KI-Antworten, Einstellungen und das erzeugte Score-JSON. API-Schlüssel werden ausgeschlossen.</p><div class="ipad-tech-actions"><button class="btn" id="diagnosticV2Btn" disabled>Diagnosedatei herunterladen</button></div><p class="hint" id="diagnosticV2Info">Noch kein Kompositionsversuch aufgezeichnet.</p>';if(foot)modal.insertBefore(sec,foot);else modal.appendChild(sec)}button=$('diagnosticV2Btn');info=$('diagnosticV2Info');if(button)button.onclick=save;return true}
function updateUi(){if(!button)installUi();if(button)button.disabled=!store.last;if(info&&store.last)info.textContent=`Diagnose bereit · ${store.last.calls.length} KI-Aufruf${store.last.calls.length===1?'':'e'} aufgezeichnet · API-Key ausgeschlossen.`}
installUi();const compose=$('composeBtn');if(compose&&!compose.dataset.diagnosticV2){compose.dataset.diagnosticV2='1';compose.addEventListener('click',begin,true)}
})();
(()=>{
'use strict';
if(window.__compositionLabSharedEngineBootstrap)return;window.__compositionLabSharedEngineBootstrap=true;
const mode=document.getElementById('technicalSection')?'root':'rich';
const engine=document.createElement('script');engine.src='/Composer-Lab/shared/composition-engine.js?v=20260903-3';engine.onload=()=>{const adapter=document.createElement('script');adapter.src=mode==='root'?'/Composer-Lab/shared/root-engine-adapter.js?v=20260903-24':'/Composer-Lab/shared/rich-engine-adapter.js?v=20260903-3';(document.head||document.body).appendChild(adapter)};(document.head||document.body).appendChild(engine);
})();