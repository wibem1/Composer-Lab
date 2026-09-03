(()=>{
'use strict';
const INTERFACE_BUILD=47;
const FOLD_KEY='composition_lab_root_fold_states_v2';
const CHAT_KEY='composition_lab_midi_chat_v1';
const $=id=>document.getElementById(id);
const clone=x=>JSON.parse(JSON.stringify(x));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.__compositionLabTargetInterfaceBuild=INTERFACE_BUILD;

function configureApiKeyField(){
  const input=$('apiKey'),toggle=$('toggleKeyBtn');
  if(!input)return;
  input.type='text';
  input.autocomplete='off';
  input.setAttribute('autocorrect','off');
  input.setAttribute('autocapitalize','none');
  input.spellcheck=false;
  input.setAttribute('data-1p-ignore','true');
  input.setAttribute('data-lpignore','true');
  if(!input.dataset.masked){input.dataset.masked='1';input.style.webkitTextSecurity='disc';}
  if(toggle&&!toggle.dataset.apiKeyV47){
    toggle.dataset.apiKeyV47='1';
    const fresh=toggle.cloneNode(true);toggle.replaceWith(fresh);
    fresh.onclick=()=>{const masked=input.dataset.masked!=='0';input.dataset.masked=masked?'0':'1';input.style.webkitTextSecurity=masked?'none':'disc';fresh.textContent=masked?'🙈':'👁';};
  }
}
function arrangeSaveButtons(){
  const midi=$('downloadBtn'),json=$('jsonBtn'),tech=$('technicalSection')?.querySelector('.foldcontent');
  if(midi)midi.textContent='MIDI speichern';
  if(json){json.textContent='JSON speichern';if(tech){let box=$('jsonSaveTechnicalBox');if(!box){box=document.createElement('div');box.id='jsonSaveTechnicalBox';box.style.marginTop='14px';box.innerHTML='<div style="font-weight:700;margin-bottom:7px">Technische Dateiausgabe</div>';tech.appendChild(box)}if(json.parentElement!==box)box.appendChild(json)}}
}
function sourceName(){try{return (typeof uploadedName!=='undefined'&&uploadedName)||uploadedScore?.ti||'MIDI-Datei'}catch(_){return'MIDI-Datei'}}
function hasSource(){try{return typeof uploadedScore!=='undefined'&&!!uploadedScore}catch(_){return false}}
function showTemplatePlayer(){const box=$('randomTemplateBox');if(box){box.style.display='flex';box.style.visibility='visible'}}
function setCurrentPackage(pkg){
  if(!pkg?.score){showTemplatePlayer();return;}
  window.__sharedCurrentTemplate=clone(pkg);
  try{window.compositionLabSetCurrentTemplate?.({title:pkg.score.ti||'Vorlage',score:pkg.score,fileName:(pkg.score.ti||'Vorlage')+'.mid',meta:{...(pkg.settings||{}),idea:pkg.idea||pkg.score.sm||''}})}catch(_){}
  showTemplatePlayer();
}
function setLabInfo(text,type='neutral'){const info=$('experimentInfo');if(!info)return;info.classList.remove('ok','err','warn');if(type==='ok')info.classList.add('ok');if(type==='err')info.classList.add('err');if(type==='warn')info.classList.add('warn');info.textContent=text}
function removeOldIdeaGenerator(){const old=$('labIdeaGenerateBtn');if(old){const toolbar=old.closest('.toolbar');if(toolbar&&toolbar.children.length===1)toolbar.remove();else old.remove()}$('labIdeaInfo')?.remove()}
function foldId(d,i){if(d.id)return d.id;const s=(d.querySelector(':scope > summary')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);return s?'summary:'+s:'details:'+i}
function loadStates(){try{const s=JSON.parse(localStorage.getItem(FOLD_KEY)||'{}');return s&&typeof s==='object'?s:{}}catch(_){return{}}}
function saveState(key,value){try{const s=loadStates();s[key]=!!value;localStorage.setItem(FOLD_KEY,JSON.stringify(s))}catch(_){}}
function restoreStates(){const states=loadStates();document.querySelectorAll('details').forEach((d,i)=>{const key=foldId(d,i);if(Object.prototype.hasOwnProperty.call(states,key))d.open=!!states[key]})}
function bindFoldPersistence(){document.querySelectorAll('details').forEach((d,i)=>{const key=foldId(d,i),summary=d.querySelector(':scope > summary');if(!summary||summary.dataset.foldPersistV47)return;summary.dataset.foldPersistV47='1';summary.addEventListener('click',()=>saveState(key,!d.open),{capture:true})})}
function labSettings(){return{measures:Number($('templateLength')?.value)||4,bpm:Number($('labTempo')?.value||$('tempo')?.value)||96,ensemble:$('labEnsemble')?.value||$('ensemble')?.value||'Klavier solo',style:$('labStyle')?.value||'',meter:$('meter')?.value||'4/4',key:$('musicalKey')?.value||'frei'}}
function credentials(){return{provider:$('provider')?.value||'openai',model:$('model')?.value||'',apiKey:$('apiKey')?.value||'',reasoning:$('reasoningEffort')?.value||'medium'}}
function rerenderSharedHistory(){
  const X=window.CompositionLabExperiment,box=$('experimentHistoryList');if(!X||!box)return;
  const a=X.loadHistory().slice().reverse();box.innerHTML=a.length?'':'<div class="historyitem">Noch keine Vorlage gespeichert.</div>';
  a.forEach(pkg=>{const d=document.createElement('div');d.className='historyitem';d.innerHTML=`<strong>${esc(pkg.score?.ti||'Vorlage')}</strong><div class="historymeta">${esc(pkg.settings?.measures||'?')} Takte · ${esc(pkg.settings?.ensemble||'')} · ${esc(pkg.score?.bpm||pkg.settings?.bpm||'')} BPM</div><div style="margin-top:5px;font-size:12px;color:var(--muted)">${esc(pkg.idea||'')}</div><div class="historyactions"><button class="secondary smallbtn" data-load="${pkg.id}">Laden</button></div>`;d.querySelector('[data-load]').onclick=()=>{setCurrentPackage(pkg);if($('labIdea'))$('labIdea').value=pkg.idea||pkg.score?.sm||'';if($('labTempo'))$('labTempo').value=pkg.settings?.bpm||pkg.score?.bpm||96;if($('labEnsemble'))$('labEnsemble').value=pkg.settings?.ensemble||'';if($('labStyle'))$('labStyle').value=pkg.settings?.style||'';setLabInfo('Vorlage aus dem Vorlagenverlauf geladen.')};box.appendChild(d)});
}
function bindGenerate(make){
  if(!make)return;make.textContent='Erzeuge';make.disabled=false;
  make.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();const X=window.CompositionLabExperiment,idea=$('labIdea');if(!X){setLabInfo('Fehler: Gemeinsame Experiment-Engine ist noch nicht geladen.','err');return}const c=credentials();if(!c.apiKey){setLabInfo('Bitte zuerst unter Technisches den API-Key eintragen.','warn');return}make.disabled=true;const old=make.textContent;make.textContent='Erzeuge …';setLabInfo('KI-Vorlage wird erzeugt …','ok');try{const r=await X.generateTemplate({...c,settings:labSettings(),idea:idea?.value||''});if(idea)idea.value=r.idea||'';setCurrentPackage(r.pkg);rerenderSharedHistory();setLabInfo('KI-Vorlage erzeugt und gespeichert.','ok')}catch(e){setLabInfo('Fehler beim Erzeugen: '+String(e?.message||e),'err')}finally{make.disabled=false;make.textContent=old}};
}
function arrangeLabs(){
  const exp=$('experimentSection'),host=exp?.querySelector('.foldcontent');if(!host)return false;
  const es=exp.querySelector(':scope > summary');if(es)es.textContent='Experimentallabor';
  const synth=$('synthesisSection')||$('comparisonLabSection');if(synth){synth.id='comparisonLabSection';synth.classList.add('foldbox');const s=synth.querySelector(':scope > summary');if(s)s.textContent='Vergleichslabor';exp.after(synth)}
  removeOldIdeaGenerator();
  const buttons=host.querySelector('.labbuttons'),ideaBox=$('sharedLabIdeaBox')||$('labIdeaWork')||$('labIdea')?.parentElement,player=$('randomTemplateBox'),history=$('experimentHistorySection'),info=$('experimentInfo'),make=$('randomToTemplateBtn'),use=$('sharedUseTemplateBtn');
  if(buttons){buttons.id='sharedRandomButtonsRow';buttons.style.marginTop='10px';[$('inspirationBtn'),$('randomFreeBtn'),$('randomGuidedBtn')].forEach(b=>{if(b&&b.parentElement!==buttons)buttons.appendChild(b)});if(make&&make.parentElement===buttons)make.remove()}
  let actions=$('sharedTemplateActionsV47');if(!actions){actions=document.createElement('div');actions.id='sharedTemplateActionsV47';actions.className='toolbar';actions.style.marginTop='10px'}
  if(make){make.classList.add('secondary');actions.appendChild(make);bindGenerate(make)}if(use)use.remove();
  const anchor=buttons||host.firstElementChild;if(buttons&&ideaBox){buttons.after(ideaBox);ideaBox.after(actions)}else if(ideaBox){ideaBox.after(actions)}else if(anchor){anchor.after(actions)}else host.appendChild(actions);
  if(player){actions.after(player);player.style.marginTop='10px';showTemplatePlayer()}if(info&&player)player.after(info);if(history){const s=history.querySelector('summary');if(s)s.textContent='Vorlagenverlauf';(info||player||actions).after(history)}
  [$('randomFreeBtn'),$('randomGuidedBtn')].forEach(b=>{if(b&&!b.dataset.playerV47){b.dataset.playerV47='1';b.addEventListener('click',()=>{showTemplatePlayer();setTimeout(()=>setCurrentPackage(window.__sharedCurrentTemplate),0)},false)}});
  return true;
}
function removeLegacySourceUi(){const oldAnalyse=$('analyzeImportedBtn');if(oldAnalyse)oldAnalyse.remove();const oldSection=$('importedAnalysisSection');if(oldSection)oldSection.style.display='none';$('sourceDiscussBtn')?.closest('.toolbar')?.remove();if($('sourceDiscussionSection'))$('sourceDiscussionSection').style.display='none';$('sourceInstructionBox')?.remove();$('sourceInstruction')?.remove()}
function loadChat(){try{const x=JSON.parse(localStorage.getItem(CHAT_KEY)||'null');if(!x||!Array.isArray(x.messages))return{sourceName:'',messages:[]};return x}catch(_){return{sourceName:'',messages:[]}}}
function saveChat(x){try{localStorage.setItem(CHAT_KEY,JSON.stringify(x))}catch(_){}}
function chatForCurrentSource(){const name=sourceName(),x=loadChat();if(x.sourceName&&x.sourceName!==name)return{sourceName:name,messages:[]};x.sourceName=name;return x}
function renderChat(){const box=$('sourceChatHistory');if(!box)return;const x=chatForCurrentSource();saveChat(x);if(!x.messages.length){box.innerHTML='<div class="uploadinfo">Noch kein Gespräch zu dieser MIDI-Datei.</div>';return}box.innerHTML=x.messages.map(m=>`<div class="resultcard" style="margin:7px 0;white-space:pre-wrap"><strong>${m.role==='assistant'?'KI':'Du'}:</strong><br>${esc(m.text)}</div>`).join('');box.scrollTop=box.scrollHeight}
function installChat(){
  let input=$('sourceChatInput')||$('importedAnalysisQuestion');removeLegacySourceUi();
  if(!$('sourceMidiChat')){const sec=document.createElement('details');sec.id='sourceMidiChat';sec.className='foldbox';sec.open=true;sec.style.marginTop='14px';sec.innerHTML='<summary>MIDI-Datei mit der KI besprechen oder bearbeiten</summary><div class="foldcontent"><div id="sourceChatHistory" style="max-height:360px;overflow:auto"></div><div id="sourceChatInputHost"></div><div class="toolbar" style="margin-top:8px"><button type="button" class="secondary smallbtn" id="sourceChatSendBtn">Senden</button><button type="button" class="secondary smallbtn" id="sourceChatClearBtn">Chat löschen</button></div><div class="uploadinfo">Eine geladene MIDI-Datei beeinflusst neue Kompositionen nicht automatisch. Erst ein ausdrücklicher Bearbeitungsauftrag in diesem Feld bezieht sie in die nächste Komposition ein.</div></div>';const info=$('uploadInfo');if(info)info.after(sec);else $('uploadInput')?.parentElement?.after(sec)}
  const host=$('sourceChatInputHost');if(input){if(input.id!=='sourceChatInput')input.id='sourceChatInput';input.placeholder='Frage zur MIDI-Datei oder Bearbeitungsauftrag …';input.style.minHeight='92px';input.style.marginTop='8px';input.removeAttribute('inputmode');input.removeAttribute('autocapitalize');input.removeAttribute('autocomplete');input.removeAttribute('spellcheck');if(host&&input.parentElement!==host)host.appendChild(input)}else{return false}
  renderChat();const send=$('sourceChatSendBtn'),clear=$('sourceChatClearBtn');
  if(send&&!send.dataset.boundV47){send.dataset.boundV47='1';send.onclick=async()=>{const q=input.value.trim();if(!q)return;if(!hasSource()){alert('Bitte zuerst eine MIDI-Datei laden.');return}const E=window.CompositionLabEngine;if(!E?.discuss){alert('Die gemeinsame Chat-Engine ist noch nicht geladen.');return}const provider=$('provider')?.value||'openai',model=$('model')?.value||'',apiKey=$('apiKey')?.value||'',reasoning=$('reasoningEffort')?.value||'medium';if(!apiKey){alert('Bitte zuerst unter Technisches den API-Key der gewählten KI eintragen.');return}const x=chatForCurrentSource(),previous=x.messages.slice();x.messages.push({role:'user',text:q});saveChat(x);renderChat();input.value='';send.disabled=true;try{const r=await E.discuss({provider,model,apiKey,reasoning,source:uploadedScore,sourceName:sourceName(),history:previous,question:q});x.messages.push({role:'assistant',text:r.text||'Keine Antwort erhalten.'});saveChat(x);renderChat();const d=window.__compositionLabDiagnosticsV2?.active||window.__compositionLabDiagnosticsV2?.last;if(d){d.kind='midi-discussion';d.engineBuild=E.BUILD;d.interfaceBuild=INTERFACE_BUILD;d.interface='Android/WebApp';d.chatHistory=x.messages.slice();d.sharedEngine=r.diagnostic;d.updatedAt=new Date().toISOString()}}catch(e){x.messages.push({role:'assistant',text:'Fehler: '+String(e?.message||e)});saveChat(x);renderChat()}finally{send.disabled=false;input.focus()}}}
  if(clear&&!clear.dataset.boundV47){clear.dataset.boundV47='1';clear.onclick=()=>{saveChat({sourceName:sourceName(),messages:[]});renderChat();input.value=''}}
  return true;
}
function installAll(){
  configureApiKeyField();arrangeSaveButtons();
  const a=arrangeLabs(),b=installChat();
  bindFoldPersistence();restoreStates();showTemplatePlayer();rerenderSharedHistory();
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),engine:window.CompositionLabEngine?.BUILD||9,interface:INTERFACE_BUILD,platform:'Android/WebApp'};
  window.dispatchEvent(new CustomEvent('compositionlab-interface-ready',{detail:{interface:'Android/WebApp',build:INTERFACE_BUILD}}));
  return !!(a&&b);
}
let n=0;const t=setInterval(()=>{try{if(installAll()){clearInterval(t);setTimeout(installAll,500)}}catch(_){}if(++n>250)clearInterval(t)},80);
$('uploadInput')?.addEventListener('change',()=>setTimeout(renderChat,250));
$('clearUploadBtn')?.addEventListener('click',()=>setTimeout(renderChat,100));
window.addEventListener('compositionlab-experiment-ready',()=>setTimeout(installAll,100));
window.addEventListener('compositionlab-storage-restored',()=>setTimeout(installAll,100));
})();