(()=>{
'use strict';
const INTERFACE_BUILD=38;
window.__compositionLabTargetInterfaceBuild=INTERFACE_BUILD;
const $=id=>document.getElementById(id);
const CHAT_KEY='composition_lab_midi_chat_v1';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function sourceName(){try{return (typeof uploadedName!=='undefined'&&uploadedName)||uploadedScore?.ti||'MIDI-Datei'}catch(_){return'MIDI-Datei'}}
function hasSource(){try{return typeof uploadedScore!=='undefined'&&!!uploadedScore}catch(_){return false}}
function loadChat(){try{const x=JSON.parse(localStorage.getItem(CHAT_KEY)||'null');if(!x||!Array.isArray(x.messages))return{sourceName:'',messages:[]};return x}catch(_){return{sourceName:'',messages:[]}}}
function saveChat(x){try{localStorage.setItem(CHAT_KEY,JSON.stringify(x))}catch(_){}}
function chatForCurrentSource(){const name=sourceName(),x=loadChat();if(x.sourceName&&x.sourceName!==name)return{sourceName:name,messages:[]};x.sourceName=name;return x}
function renderChat(){const box=$('sourceChatHistory');if(!box)return;const x=chatForCurrentSource();saveChat(x);if(!x.messages.length){box.innerHTML='<div class="uploadinfo">Noch kein Gespräch zu dieser MIDI-Datei.</div>';return}box.innerHTML=x.messages.map(m=>`<div class="resultcard" style="margin:7px 0;white-space:pre-wrap"><strong>${m.role==='assistant'?'KI':'Du'}:</strong><br>${esc(m.text)}</div>`).join('');box.scrollTop=box.scrollHeight}
function installChat(){
  const instruction=$('sourceInstruction');
  if(!instruction)return false;
  const label=document.querySelector('label[for="sourceInstruction"]');
  if(label)label.textContent='Bearbeitungsauftrag für neue Komposition (optional)';
  instruction.placeholder='z. B. Übernimm die ersten 10 Takte unverändert und komponiere danach in deutlich anderer Richtung weiter.';
  const oldBtn=$('sourceDiscussBtn');if(oldBtn){const tb=oldBtn.closest('.toolbar');if(tb&&tb.children.length===1)tb.remove();else oldBtn.remove()}
  const oldAnswer=$('sourceDiscussionSection');if(oldAnswer)oldAnswer.style.display='none';
  if(!$('sourceMidiChat')){
    const sec=document.createElement('div');sec.id='sourceMidiChat';sec.style.marginTop='14px';
    sec.innerHTML=`<div style="font-weight:700;margin-bottom:6px">MIDI-Datei mit der KI besprechen</div><div id="sourceChatHistory" style="max-height:360px;overflow:auto"></div><textarea id="sourceChatInput" style="min-height:76px;margin-top:8px" placeholder="Nächste Nachricht an die KI …"></textarea><div class="toolbar" style="margin-top:8px"><button type="button" class="secondary smallbtn" id="sourceChatSendBtn">Senden</button><button type="button" class="secondary smallbtn" id="sourceChatClearBtn">Chat löschen</button></div><div class="uploadinfo">Der Gesprächsverlauf bleibt erhalten und wird bei jeder weiteren Nachricht zusammen mit derselben MIDI-Datei an die KI gesendet.</div>`;
    const box=$('sourceInstructionBox');(box||instruction.parentElement)?.after(sec);
  }
  renderChat();
  const send=$('sourceChatSendBtn'),input=$('sourceChatInput'),clear=$('sourceChatClearBtn');
  if(send&&!send.dataset.boundV38){send.dataset.boundV38='1';send.onclick=async()=>{
    const q=input?.value.trim()||'';
    if(!q)return;
    if(!hasSource()){alert('Bitte zuerst eine MIDI-Datei laden.');return}
    const E=window.CompositionLabEngine;if(!E?.discuss){alert('Die gemeinsame Chat-Engine ist noch nicht geladen.');return}
    const provider=$('provider')?.value||'openai',model=$('model')?.value||'',apiKey=$('apiKey')?.value||'',reasoning=$('reasoningEffort')?.value||'medium';
    if(!apiKey){alert('Bitte zuerst unter Technisches den API-Key der gewählten KI eintragen.');return}
    const x=chatForCurrentSource(),previous=x.messages.slice();
    x.messages.push({role:'user',text:q});saveChat(x);renderChat();input.value='';send.disabled=true;
    try{
      const r=await E.discuss({provider,model,apiKey,reasoning,source:uploadedScore,sourceName:sourceName(),history:previous,question:q});
      x.messages.push({role:'assistant',text:r.text||'Keine Antwort erhalten.'});saveChat(x);renderChat();
      const d=window.__compositionLabDiagnosticsV2?.active||window.__compositionLabDiagnosticsV2?.last;
      if(d){d.kind='midi-discussion';d.engineBuild=E.BUILD;d.interfaceBuild=INTERFACE_BUILD;d.interface='Android/WebApp';d.chatHistory=x.messages.slice();d.sharedEngine=r.diagnostic;d.updatedAt=new Date().toISOString();}
    }catch(e){x.messages.push({role:'assistant',text:'Fehler: '+String(e?.message||e)});saveChat(x);renderChat()}finally{send.disabled=false;input?.focus()}
  }}
  if(clear&&!clear.dataset.boundV38){clear.dataset.boundV38='1';clear.onclick=()=>{saveChat({sourceName:sourceName(),messages:[]});renderChat();if(input)input.value=''}}
  if(input&&!input.dataset.keyV38){input.dataset.keyV38='1';input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send?.click()}})}
  $('uploadInput')?.addEventListener('change',()=>setTimeout(renderChat,250));
  $('clearUploadBtn')?.addEventListener('click',()=>setTimeout(renderChat,100));
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),engine:window.CompositionLabEngine?.BUILD||6,interface:INTERFACE_BUILD,platform:'Android/WebApp'};
  return true;
}
const base=document.createElement('script');base.src='/Composer-Lab/shared/root-interface-v37.js?fresh='+Date.now();base.onload=()=>{let n=0;const t=setInterval(()=>{try{if(installChat()){clearInterval(t);setTimeout(installChat,600);setTimeout(installChat,1800)}}catch(_){}if(++n>200)clearInterval(t)},80)};(document.head||document.body).appendChild(base);
})();