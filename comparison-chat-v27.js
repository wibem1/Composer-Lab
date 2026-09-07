(()=>{
'use strict';
if(window.__compositionLabComparisonChatV29)return;
window.__compositionLabComparisonChatV29=true;
const $=id=>document.getElementById(id);

(function dedupeDom(){
  const seen=new Set();
  for(const el of [...document.querySelectorAll('[id]')]){
    if(!el.isConnected)continue;
    if(seen.has(el.id)) el.remove(); else seen.add(el.id);
  }
})();

let oldInput=$('sourceChatInput'), oldSend=$('sourceChatSendBtn');
const log=$('sourceChatLog'), use=$('sourceChatUseBtn');
if(!oldInput||!oldSend||!log)return;

const input=document.createElement('textarea');
input.id='sourceChatInput';
input.placeholder=oldInput.placeholder||'Frage die KI zu Quelle A, Quelle B oder beiden …';
input.value=oldInput.value||'';
input.rows=3;
input.autocomplete='off';
input.spellcheck=true;
input.tabIndex=0;
input.inputMode='text';
input.enterKeyHint='send';
input.setAttribute('aria-label','Frage an die KI im Vergleichslabor');
input.style.cssText=(oldInput.getAttribute('style')||'')+';min-height:72px;width:100%;pointer-events:auto;touch-action:manipulation;position:relative;z-index:2147483647;-webkit-user-select:text;user-select:text;';
oldInput.replaceWith(input);

const send=oldSend.cloneNode(true);
oldSend.replaceWith(send);

// Android: Fokus synchron im eigentlichen Touch/Pointer-Start setzen. Das hilft auch,
// falls ein fremdes Element den sichtbaren Bereich teilweise überlagert.
function insideInput(x,y){const r=input.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom}
function forceFocus(){try{input.focus({preventScroll:true})}catch(_){input.focus()}}
document.addEventListener('pointerdown',e=>{if(insideInput(e.clientX,e.clientY))forceFocus()},true);
document.addEventListener('touchstart',e=>{const t=e.touches&&e.touches[0];if(t&&insideInput(t.clientX,t.clientY))forceFocus()},{capture:true,passive:true});
input.addEventListener('pointerdown',forceFocus,true);
input.addEventListener('touchstart',forceFocus,{capture:true,passive:true});
input.addEventListener('click',forceFocus);

// Robuster Android-Fallback: nativer Browser-Eingabedialog. Damit bleibt das
// Vergleichslabor benutzbar, selbst wenn WebView/Browser den Inline-Fokus blockiert.
const fallback=document.createElement('button');
fallback.type='button';
fallback.className='secondary smallbtn';
fallback.textContent='Text eingeben';
fallback.style.marginTop='7px';
fallback.onclick=()=>{
  const v=window.prompt('Frage an die KI eingeben:',input.value||'');
  if(v!==null){input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));}
};
input.parentElement?.insertAdjacentElement('afterend',fallback);

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
 finally{send.disabled=false;send.textContent='Senden';}
}
send.addEventListener('click',ask);
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask();}});
if(use)use.onclick=()=>{if(!lastAnswer)return;const p=$('prompt');if(p)p.value=lastAnswer;try{saveCurrentState()}catch(_){}const st=$('status');if(st)st.innerHTML='<span class="ok">Letzte KI-Antwort als Kompositionsauftrag übernommen.</span>';};

// Sichtbare Kennung aktualisieren, ohne weitere Repair-Datei anzufassen.
setTimeout(()=>{
  for(const n of document.querySelectorAll('body *')){
    if(n.children.length===0&&/WebApp Repair V28/i.test(n.textContent||''))
      n.textContent=(n.textContent||'').replace(/WebApp Repair V28[^·]*/i,'WebApp Repair V29 ');
  }
},300);
})();
