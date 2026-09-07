(()=>{
'use strict';
if(window.__compositionLabComparisonChatV34)return;
window.__compositionLabComparisonChatV34=true;
const $=id=>document.getElementById(id);
const log=$('sourceChatLog'),send=$('sourceChatSendBtn'),use=$('sourceChatUseBtn');
if(!log||!send)return;

// Kompakte Oberfläche: reine Erklärtexte verschwinden; Hinweise stehen direkt in Eingabefeldern.
function compactHints(){
  const chatInput=$('chatInput');
  if(chatInput) chatInput.placeholder='Frage zum Stück oder Änderungswunsch, z. B. „Takt 5 bis 8 dramatischer“ …';
  const firstChat=$('chatLog')?.querySelector('.chatai.chatmsg');
  if(firstChat && !/^Du:|^KI:/.test(firstChat.textContent||'')) firstChat.remove();

  const exp=$('experimentSection');
  if(exp){
    exp.querySelectorAll('p.labhint').forEach(p=>p.style.display='none');
    const ids=['labTempo','labEnsemble','labStyle'];
    ids.forEach(id=>{
      const el=$(id); if(!el)return;
      let n=el.nextElementSibling;
      if(n?.classList?.contains('uploadinfo') && !n.id) n.style.display='none';
    });
    const len=$('templateLength');
    if(len){const n=len.nextElementSibling;if(n?.classList?.contains('uploadinfo')&&!n.id)n.style.display='none';}
  }
}
compactHints();

// V34 behält den unter Android bewährten unabhängigen Eingabeweg aus V33.
const old=$('sourceChatInput');
if(old) old.style.display='none';
let input=$('sourceChatEntryV34')||$('sourceChatEntryV33');
if(input && input.id==='sourceChatEntryV33') input.id='sourceChatEntryV34';
if(!input){
  input=document.createElement('textarea');
  input.id='sourceChatEntryV34';
  input.rows=4;
  input.setAttribute('inputmode','text');
  input.setAttribute('enterkeyhint','send');
  input.setAttribute('aria-label','Frage an die KI im Vergleichslabor');
  input.style.cssText='display:block;width:100%;height:110px;min-height:110px;margin:8px 0;padding:12px;border:2px solid #5b6b80;border-radius:8px;background:#10141a;color:#eef2f7;-webkit-text-fill-color:#eef2f7;caret-color:#eef2f7;font:inherit;resize:vertical;position:relative;z-index:5;';
  log.insertAdjacentElement('afterend',input);
}
input.placeholder='Frage die KI zu Quelle A, Quelle B oder beiden …';
// Der bisherige reine Hinweis im Vergleichs-Chat wird entfernt; echte Gesprächsbeiträge bleiben erhalten.
for(const d of [...log.querySelectorAll('.chatai.chatmsg')]){
  const t=(d.textContent||'').trim();
  if(t.startsWith('Frage die KI frei zu Quelle A')) d.remove();
}
const oldRow=send.parentElement;
if(oldRow){oldRow.style.display='block';oldRow.style.width='100%';}
send.style.display='inline-block';send.style.marginTop='0';

let lastAnswer='';
function add(role,text){const d=document.createElement('div');d.className='chatmsg '+(role==='user'?'chatuser':'chatai');d.textContent=(role==='user'?'Du: ':'KI: ')+text;log.appendChild(d);log.scrollTop=log.scrollHeight;}
function source(w){try{return window.compositionLabGetComparisonSource?.(w)||null}catch(_){return null}}
function sourceName(w,sc){return $('source'+w+'Card')?.querySelector('strong')?.textContent?.trim()||sc?.ti||('Quelle '+w)}
async function ask(){const msg=String(input.value||'').trim();if(!msg)return;const a=source('A'),b=source('B');if(!a&&!b){add('ai','Bitte zuerst mindestens eine Quelle laden.');return;}const provider=$('provider')?.value,model=$('model')?.value?.trim(),key=$('apiKey')?.value?.trim();if(!key){add('ai','Bitte zuerst den API-Key der gewählten KI eingeben.');return;}add('user',msg);input.value='';send.disabled=true;send.textContent='KI denkt …';try{const parts=[];if(a)parts.push(`QUELLE A – ${sourceName('A',a)}:\n${JSON.stringify(a)}`);if(b)parts.push(`QUELLE B – ${sourceName('B',b)}:\n${JSON.stringify(b)}`);const task=`Der Nutzer untersucht musikalisches Material im Vergleichslabor. Beantworte seine konkrete Frage musikalisch und direkt. Verwende nur die tatsächlich geladenen Quellen. Wenn er eine Synthese, Weiterentwicklung oder neue Kompositionsidee verlangt, entwickle einen freien musikalischen Vorschlag, ohne unnötig einen technischen Bauplan vorzuschreiben.\n\nNUTZERFRAGE:\n${msg}\n\n${parts.join('\n\n')}`;const r=await callLLM(provider,model,key,SYSTEM_PREFIX,task,false);lastAnswer=String(r?.text||r||'').trim();add('ai',lastAnswer||'Keine Antwort erhalten.');if(use)use.disabled=!lastAnswer;}catch(e){add('ai','Fehler: '+(e?.message||e));}finally{send.disabled=false;send.textContent='Senden';}}
send.onclick=ask;
input.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask();}};
if(use)use.onclick=()=>{if(!lastAnswer)return;const p=$('prompt');if(p)p.value=lastAnswer;try{saveCurrentState()}catch(_){}const st=$('status');if(st)st.innerHTML='<span class="ok">Letzte KI-Antwort als Kompositionsauftrag übernommen.</span>';};

function mark(){const tech=$('technicalSection')?.querySelector('.foldcontent');if(!tech)return;document.querySelectorAll('[id^="webRepairBuild"]').forEach(e=>e.remove());const d=document.createElement('div');d.id='webRepairBuildV34';d.className='uploadinfo';d.style.marginTop='12px';d.textContent='WebApp Repair V34 · kompakte Hinweise als Platzhalter';tech.appendChild(d);}let n=0,t=setInterval(()=>{compactHints();mark();if(++n>=20)clearInterval(t)},250);mark();
})();
