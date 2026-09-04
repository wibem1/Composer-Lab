(()=>{
'use strict';
const INTERFACE_BUILD=34;
const $=id=>document.getElementById(id);
const KEY='composition_lab_source_instruction_v1';
function activeBuild(){return Math.max(Number(window.__compositionLabTargetInterfaceBuild)||0,INTERFACE_BUILD)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function installSourceDiscussion(){
  const oldAnalyse=$('analyzeImportedBtn');
  if(oldAnalyse)oldAnalyse.remove();
  const oldSection=$('importedAnalysisSection');
  if(oldSection)oldSection.style.display='none';
  let field=$('sourceInstruction');
  if(!field){
    const info=$('uploadInfo');if(!info)return false;
    const wrap=document.createElement('div');wrap.id='sourceInstructionBox';wrap.style.marginTop='10px';
    wrap.innerHTML=`<label for="sourceInstruction">Was soll die KI mit dieser MIDI-Datei tun?</label><textarea id="sourceInstruction" style="min-height:86px" placeholder="z. B. Übernimm die ersten 10 Takte unverändert und komponiere danach in deutlich anderer Richtung weiter. Oder: Analysiere die Harmonik und sage mir, wo die stärksten Stellen liegen."></textarea><div class="toolbar" style="margin-top:8px"><button type="button" class="secondary smallbtn" id="sourceDiscussBtn">Mit KI besprechen</button></div><div class="uploadinfo">Für eine neue Komposition wird derselbe Text beim Klick auf „Mit gewählter KI komponieren“ als konkrete Bearbeitungsanweisung auf die geladene MIDI-Datei angewandt.</div>`;
    info.after(wrap);field=$('sourceInstruction');
    try{field.value=localStorage.getItem(KEY)||''}catch(_){}
    field.addEventListener('input',()=>{try{localStorage.setItem(KEY,field.value)}catch(_){}});
  }
  field.disabled=false;field.readOnly=false;field.style.opacity='1';field.style.pointerEvents='auto';
  if(!$('sourceDiscussBtn')){
    const b=document.createElement('button');b.type='button';b.id='sourceDiscussBtn';b.className='secondary smallbtn';b.textContent='Mit KI besprechen';
    const tb=document.createElement('div');tb.className='toolbar';tb.style.marginTop='8px';tb.appendChild(b);field.after(tb);
  }
  if(!$('sourceDiscussionSection')){
    const d=document.createElement('details');d.id='sourceDiscussionSection';d.className='foldbox';d.style.display='none';d.innerHTML='<summary>Antwort der KI zur geladenen MIDI-Datei</summary><div class="foldcontent"><div id="sourceDiscussionResult" class="resultcard" style="white-space:pre-wrap"></div></div>';
    $('sourceInstructionBox')?.after(d);
  }
  const btn=$('sourceDiscussBtn');if(btn)btn.disabled=false;
  $('clearUploadBtn')?.addEventListener('click',()=>{const s=$('sourceDiscussionSection');if(s)s.style.display='none'});
  if(btn&&!btn.dataset.boundV34){btn.dataset.boundV34='1';btn.onclick=async()=>{
    const E=window.CompositionLabEngine,q=field.value.trim(),source=typeof uploadedScore!=='undefined'?uploadedScore:null;
    const section=$('sourceDiscussionSection'),out=$('sourceDiscussionResult');
    if(!source){if(out)out.textContent='Bitte zuerst eine MIDI-Datei laden.';if(section){section.style.display='block';section.open=true}return}
    if(!q){if(out)out.textContent='Bitte zuerst eine Frage oder einen Auftrag eingeben.';if(section){section.style.display='block';section.open=true}return}
    const provider=$('provider')?.value||'openai',model=$('model')?.value||'',apiKey=$('apiKey')?.value||'',reasoning=$('reasoningEffort')?.value||'medium';
    if(!E||!apiKey){if(out)out.textContent='Bitte zuerst den API-Key der gewählten KI eintragen.';if(section){section.style.display='block';section.open=true}return}
    section.style.display='block';section.open=true;out.innerHTML='<span class="ok">KI beschäftigt sich mit der geladenen MIDI-Datei …</span>';btn.disabled=true;
    try{
      const system='Du bist ein musikalischer Analyse- und Kompositionspartner. Der Nutzer hat eine MIDI-Datei geladen und stellt dazu eine freie Frage oder gibt einen Arbeitsauftrag. Antworte genau darauf. Ändere noch keine Partitur; hier geht es nur um Besprechung, Analyse, Planung oder Vorschläge. Schreibe musikalisch verständlich und vermeide unnötige technische MIDI-Zahlen.';
      const user=`DATEI: ${typeof uploadedName!=='undefined'&&uploadedName?uploadedName:(source.ti||'MIDI-Datei')}\n\nFRAGE / AUFTRAG DES NUTZERS:\n${q}\n\nMIDI-DATEN:\n${JSON.stringify(source)}`;
      const r=await E.callLLM({provider,model,apiKey,reasoning,systemPrompt:system,userPrompt:user,wantJson:false});
      out.textContent=r.text||'Keine Antwort erhalten.';
    }catch(e){out.innerHTML='<span class="err">'+esc(e?.message||e)+'</span>'}finally{btn.disabled=false}
  }}
  return true;
}
function updateBuild(){
  const shown=activeBuild();
  const tech=$('technicalSection')?.querySelector('.foldcontent');
  if(tech){tech.querySelectorAll('.uploadinfo').forEach(e=>{if(/Interface Build Android\/WebApp \d+/.test(e.textContent||''))e.innerHTML=e.innerHTML.replace(/Interface Build Android\/WebApp \d+/g,`Interface Build Android/WebApp ${shown}`)});let own=$('rootInterfaceBuildV34');if(!own){own=document.createElement('div');own.id='rootInterfaceBuildV34';own.className='uploadinfo';own.style.marginTop='8px';tech.appendChild(own)}own.textContent=`Interface Build Android/WebApp ${shown}`}
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),interface:shown,platform:'Android/WebApp'};
}
function afterBase(){installSourceDiscussion();updateBuild();return true}
const base=document.createElement('script');base.src='/Composer-Lab/shared/root-interface-v31.js?fresh='+Date.now();base.onload=()=>{let n=0;const t=setInterval(()=>{try{if(afterBase()){clearInterval(t);setTimeout(afterBase,500);setTimeout(afterBase,1500)}}catch(_){}if(++n>200)clearInterval(t)},50)};(document.head||document.body).appendChild(base);
})();