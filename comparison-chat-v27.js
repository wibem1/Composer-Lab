(()=>{
'use strict';
if(window.__compositionLabComparisonChatV32)return;
window.__compositionLabComparisonChatV32=true;
const $=id=>document.getElementById(id);
const input=$('sourceChatInput'),send=$('sourceChatSendBtn'),log=$('sourceChatLog'),use=$('sourceChatUseBtn');
if(!input||!send||!log)return;

input.disabled=false;input.readOnly=false;input.removeAttribute('disabled');input.removeAttribute('readonly');input.removeAttribute('inert');
input.setAttribute('inputmode','text');input.setAttribute('enterkeyhint','send');input.setAttribute('aria-label','Frage an die KI im Vergleichslabor');
// Android: das echte statische Textfeld bekommt ein eindeutiges, unabhängiges Layout.
const row=input.parentElement;
if(row){row.style.display='grid';row.style.gridTemplateColumns='1fr';row.style.gap='8px';row.style.alignItems='stretch';row.style.width='100%';}
input.style.setProperty('display','block','important');
input.style.setProperty('width','100%','important');
input.style.setProperty('min-width','0','important');
input.style.setProperty('height','96px','important');
input.style.setProperty('min-height','96px','important');
input.style.setProperty('visibility','visible','important');
input.style.setProperty('opacity','1','important');
input.style.setProperty('position','relative','important');
input.style.setProperty('pointer-events','auto','important');
input.style.setProperty('z-index','1','important');
send.style.justifySelf='start';

let lastAnswer='';
function add(role,text){const d=document.createElement('div');d.className='chatmsg '+(role==='user'?'chatuser':'chatai');d.textContent=(role==='user'?'Du: ':'KI: ')+text;log.appendChild(d);log.scrollTop=log.scrollHeight;}
function source(w){try{return window.compositionLabGetComparisonSource?.(w)||null}catch(_){return null}}
function sourceName(w,sc){return $('source'+w+'Card')?.querySelector('strong')?.textContent?.trim()||sc?.ti||('Quelle '+w)}
async function ask(){const msg=String(input.value||'').trim();if(!msg)return;const a=source('A'),b=source('B');if(!a&&!b){add('ai','Bitte zuerst mindestens eine Quelle laden.');return;}const provider=$('provider')?.value,model=$('model')?.value?.trim(),key=$('apiKey')?.value?.trim();if(!key){add('ai','Bitte zuerst den API-Key der gewählten KI eingeben.');return;}add('user',msg);input.value='';send.disabled=true;send.textContent='KI denkt …';try{const parts=[];if(a)parts.push(`QUELLE A – ${sourceName('A',a)}:\n${JSON.stringify(a)}`);if(b)parts.push(`QUELLE B – ${sourceName('B',b)}:\n${JSON.stringify(b)}`);const task=`Der Nutzer untersucht musikalisches Material im Vergleichslabor. Beantworte seine konkrete Frage musikalisch und direkt. Verwende nur die tatsächlich geladenen Quellen. Wenn er eine Synthese, Weiterentwicklung oder neue Kompositionsidee verlangt, entwickle einen freien musikalischen Vorschlag, ohne unnötig einen technischen Bauplan vorzuschreiben.\n\nNUTZERFRAGE:\n${msg}\n\n${parts.join('\n\n')}`;const r=await callLLM(provider,model,key,SYSTEM_PREFIX,task,false);lastAnswer=String(r?.text||r||'').trim();add('ai',lastAnswer||'Keine Antwort erhalten.');if(use)use.disabled=!lastAnswer;}catch(e){add('ai','Fehler: '+(e?.message||e));}finally{send.disabled=false;send.textContent='Senden';}}
send.onclick=ask;input.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask();}};
if(use)use.onclick=()=>{if(!lastAnswer)return;const p=$('prompt');if(p)p.value=lastAnswer;try{saveCurrentState()}catch(_){}const st=$('status');if(st)st.innerHTML='<span class="ok">Letzte KI-Antwort als Kompositionsauftrag übernommen.</span>';};
for(const b of [...document.querySelectorAll('button')])if(b!==send&&/^(Text eingeben|Text eingeben und senden)$/.test((b.textContent||'').trim()))b.remove();
function mark(){const tech=$('technicalSection')?.querySelector('.foldcontent');if(!tech)return;document.querySelectorAll('[id^="webRepairBuild"]').forEach(e=>e.remove());const d=document.createElement('div');d.id='webRepairBuildV32';d.className='uploadinfo';d.style.marginTop='12px';d.textContent='WebApp Repair V32 · Vergleichs-Eingabefeld sichtbar';tech.appendChild(d);}let n=0,t=setInterval(()=>{mark();if(++n>=20)clearInterval(t)},250);mark();
})();
