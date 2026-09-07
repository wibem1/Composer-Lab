(()=>{
'use strict';
if(window.__compositionLabComparisonChatV27)return;
window.__compositionLabComparisonChatV27=true;
const $=id=>document.getElementById(id);

// Entfernt die alten direkten Eventhandler des Vergleichschats, indem nur
// Eingabefeld und Senden-Schaltfläche einmal sauber ersetzt werden.
let input=$('sourceChatInput'), send=$('sourceChatSendBtn');
const log=$('sourceChatLog'), use=$('sourceChatUseBtn');
if(!input||!send||!log)return;

const freshInput=input.cloneNode(true);
input.replaceWith(freshInput);
input=freshInput;
const freshSend=send.cloneNode(true);
send.replaceWith(freshSend);
send=freshSend;

input.disabled=false;
input.readOnly=false;
input.removeAttribute('disabled');
input.removeAttribute('readonly');
input.removeAttribute('inert');
input.style.pointerEvents='auto';
input.style.touchAction='manipulation';
input.style.position='relative';
input.style.zIndex='1';

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
input.addEventListener('pointerup',()=>{if(document.activeElement!==input)input.focus({preventScroll:true});});
if(use)use.onclick=()=>{if(!lastAnswer)return;const p=$('prompt');if(p)p.value=lastAnswer;try{saveCurrentState()}catch(_){}const st=$('status');if(st)st.innerHTML='<span class="ok">Letzte KI-Antwort als Kompositionsauftrag übernommen.</span>';};

// Sichtbare WebRepair-Kennung der tatsächlich laufenden Android-Fassung.
function markRepairVersion(){
 for(const el of document.querySelectorAll('body *')){
  if(el.children.length===0&&/WebApp Repair V26/i.test(el.textContent||''))el.textContent=(el.textContent||'').replace(/WebApp Repair V26/ig,'WebApp Repair V27');
 }
}
markRepairVersion();
setTimeout(markRepairVersion,500);
})();
