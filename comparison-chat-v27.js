(()=>{
'use strict';
if(window.__compositionLabComparisonChatV28)return;
window.__compositionLabComparisonChatV28=true;
const $=id=>document.getElementById(id);

// Historisch angesammelte doppelte IDs entfernen. Wenn ein ganzer Bereich
// doppelt vorhanden ist, wird der spaetere Bereich komplett entfernt.
(function dedupeDom(){
  const seen=new Set();
  for(const el of [...document.querySelectorAll('[id]')]){
    if(!el.isConnected)continue;
    if(seen.has(el.id)) el.remove();
    else seen.add(el.id);
  }
})();

let oldInput=$('sourceChatInput'), oldSend=$('sourceChatSendBtn');
const log=$('sourceChatLog'), use=$('sourceChatUseBtn');
if(!oldInput||!oldSend||!log)return;

// Fuer Android ein wirklich neues, natives Textfeld ohne geerbte Handler.
const input=document.createElement('textarea');
input.id='sourceChatInput';
input.className=oldInput.className||'';
input.placeholder=oldInput.placeholder||'Frage die KI zu Quelle A, Quelle B oder beiden …';
input.value=oldInput.value||'';
input.rows=3;
input.autocomplete='off';
input.spellcheck=true;
input.tabIndex=0;
input.setAttribute('aria-label','Frage an die KI im Vergleichslabor');
input.style.cssText=(oldInput.getAttribute('style')||'')+';min-height:70px;width:100%;pointer-events:auto;touch-action:auto;position:relative;z-index:50;-webkit-user-select:text;user-select:text;';
oldInput.replaceWith(input);

const send=oldSend.cloneNode(true);
oldSend.replaceWith(send);

let lastAnswer='';
function add(role,text){const d=document.createElement('div');d.className='chatmsg '+(role==='user'?'chatuser':'chatai');d.textContent=(role==='user'?'Du: ':'KI: ')+text;log.appendChild(d);log.scrollTop=log.scrollHeight;}
function source(w){try{return window.compositionLabGetComparisonSource?.(w)||null}catch(_){return null}}
function sourceName(w,sc){return $('source'+w+'Card')?.querySelector('strong')?.textContent?.trim()||sc?.ti||('Quelle '+w)}
async function ask(){
 const msg=String(input.value||'').trim();if(!msg)return;
 const a=source('A'),b=source('B');if(!a&&!b){add('ai','Bitte zuerst mindestens eine Quelle laden.');return;}
 const provider=$('provider')?.value,model=$('model')?.value?.trim(),key=$('apiKey')?.value?.trim();if(!key){add('ai','Bitte zuerst den API-Key der gewählten KI eingeben.');return;}
 add('user',msg);input.value='';send.disabled=true;send.textContent='KI denkt …';
 try{
  const parts=[];if(a)parts.push(`QUELLE A – ${sourceName('A',a)}:\n${JSON.stringify(a)}`);if(b)parts.push(`QUELLE B – ${sourceName('B',b)}:\n${JSON.stringify(b)}`);
  const task=`Der Nutzer untersucht musikalisches Material im Vergleichslabor. Beantworte seine konkrete Frage musikalisch und direkt. Verwende nur die tatsächlich geladenen Quellen. Wenn er eine Synthese, Weiterentwicklung oder neue Kompositionsidee verlangt, entwickle einen freien musikalischen Vorschlag, ohne unnötig einen technischen Bauplan vorzuschreiben.\n\nNUTZERFRAGE:\n${msg}\n\n${parts.join('\n\n')}`;
  const r=await callLLM(provider,model,key,SYSTEM_PREFIX,task,false);lastAnswer=String(r?.text||r||'').trim();add('ai',lastAnswer||'Keine Antwort erhalten.');if(use)use.disabled=!lastAnswer;
 }catch(e){add('ai','Fehler: '+(e?.message||e));}
 finally{send.disabled=false;send.textContent='Senden';input.disabled=false;input.readOnly=false;}
}
send.addEventListener('click',ask);
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask();}});
for(const ev of ['click','touchend']) input.addEventListener(ev,()=>{try{input.focus({preventScroll:true})}catch(_){input.focus()}},{passive:true});
if(use)use.onclick=()=>{if(!lastAnswer)return;const p=$('prompt');if(p)p.value=lastAnswer;try{saveCurrentState()}catch(_){}const st=$('status');if(st)st.innerHTML='<span class="ok">Letzte KI-Antwort als Kompositionsauftrag übernommen.</span>';};
})();
