(()=>{
'use strict';
if(window.__compositionLabComparisonChatV31)return;
window.__compositionLabComparisonChatV31=true;
const $=id=>document.getElementById(id);

// Das Eingabefeld bleibt genau das statische textarea aus index.html.
// Keine DOM-Ersetzung, keine globalen Touch-/Pointer-Handler und kein erzwungener Fokus.
const input=$('sourceChatInput');
const send=$('sourceChatSendBtn');
const log=$('sourceChatLog');
const use=$('sourceChatUseBtn');
if(!input||!send||!log)return;

input.disabled=false;
input.readOnly=false;
input.removeAttribute('disabled');
input.removeAttribute('readonly');
input.removeAttribute('inert');
input.setAttribute('inputmode','text');
input.setAttribute('enterkeyhint','send');
input.setAttribute('aria-label','Frage an die KI im Vergleichslabor');

let lastAnswer='';
function add(role,text){const d=document.createElement('div');d.className='chatmsg '+(role==='user'?'chatuser':'chatai');d.textContent=(role==='user'?'Du: ':'KI: ')+text;log.appendChild(d);log.scrollTop=log.scrollHeight;}
function source(w){try{return window.compositionLabGetComparisonSource?.(w)||null}catch(_){return null}}
function sourceName(w,sc){return $('source'+w+'Card')?.querySelector('strong')?.textContent?.trim()||sc?.ti||('Quelle '+w)}
async function ask(message){
 const msg=String(message!==undefined?message:input.value||'').trim();if(!msg)return;
 const a=source('A'),b=source('B');if(!a&&!b){add('ai','Bitte zuerst mindestens eine Quelle laden.');return;}
 const provider=$('provider')?.value,model=$('model')?.value?.trim(),key=$('apiKey')?.value?.trim();if(!key){add('ai','Bitte zuerst den API-Key der gewählten KI eingeben.');return;}
 add('user',msg);input.value='';send.disabled=true;send.textContent='KI denkt …';
 try{
  const parts=[];if(a)parts.push(`QUELLE A – ${sourceName('A',a)}:\n${JSON.stringify(a)}`);if(b)parts.push(`QUELLE B – ${sourceName('B',b)}:\n${JSON.stringify(b)}`);
  const task=`Der Nutzer untersucht musikalisches Material im Vergleichslabor. Beantworte seine konkrete Frage musikalisch und direkt. Verwende nur die tatsächlich geladenen Quellen. Wenn er eine Synthese, Weiterentwicklung oder neue Kompositionsidee verlangt, entwickle einen freien musikalischen Vorschlag, ohne unnötig einen technischen Bauplan vorzuschreiben.\n\nNUTZERFRAGE:\n${msg}\n\n${parts.join('\n\n')}`;
  const r=await callLLM(provider,model,key,SYSTEM_PREFIX,task,false);lastAnswer=String(r?.text||r||'').trim();add('ai',lastAnswer||'Keine Antwort erhalten.');if(use)use.disabled=!lastAnswer;
 }catch(e){add('ai','Fehler: '+(e?.message||e));}
 finally{send.disabled=false;send.textContent='Senden';}
}

send.onclick=()=>ask();
input.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask();}};
if(use)use.onclick=()=>{if(!lastAnswer)return;const p=$('prompt');if(p)p.value=lastAnswer;try{saveCurrentState()}catch(_){}const st=$('status');if(st)st.innerHTML='<span class="ok">Letzte KI-Antwort als Kompositionsauftrag übernommen.</span>';};

// Alte V29/V30-Fallback-Buttons aus einer bereits laufenden Seite entfernen, falls vorhanden.
for(const b of [...document.querySelectorAll('button')]){
 if(b!==send && /^(Text eingeben|Text eingeben und senden)$/.test((b.textContent||'').trim())) b.remove();
}

function markV31(){
 const tech=$('technicalSection')?.querySelector('.foldcontent');if(!tech)return;
 document.querySelectorAll('[id^="webRepairBuild"]').forEach(e=>e.remove());
 const d=document.createElement('div');d.id='webRepairBuildV31';d.className='uploadinfo';d.style.marginTop='12px';d.textContent='WebApp Repair V31 · statisches Eingabefeld ohne Fokus-Reparaturen';tech.appendChild(d);
}
let marks=0;const markTimer=setInterval(()=>{markV31();if(++marks>=20)clearInterval(markTimer)},250);markV31();
})();
