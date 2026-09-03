(()=>{
'use strict';
const INTERFACE_BUILD=32;
const $=id=>document.getElementById(id);
const KEY='composition_lab_source_instruction_v1';
function installSourceInstruction(){
  if($('sourceInstruction'))return;
  const info=$('uploadInfo');
  if(!info)return;
  const wrap=document.createElement('div');
  wrap.id='sourceInstructionBox';
  wrap.style.marginTop='10px';
  wrap.innerHTML=`<label for="sourceInstruction">Was soll die KI mit dieser MIDI-Datei tun?</label><textarea id="sourceInstruction" style="min-height:86px" placeholder="z. B. Übernimm die ersten 10 Takte unverändert und komponiere danach in deutlich anderer Richtung weiter."></textarea><div class="uploadinfo">Dieser Auftrag wird zusammen mit der geladenen MIDI-Datei an die gemeinsame Engine gesendet. Du kannst frei bestimmen, was erhalten, verändert, weggelassen oder fortgesetzt werden soll.</div>`;
  info.after(wrap);
  const field=$('sourceInstruction');
  try{field.value=localStorage.getItem(KEY)||''}catch(_){}
  field.addEventListener('input',()=>{try{localStorage.setItem(KEY,field.value)}catch(_){}});
  const sync=()=>{field.disabled=!(typeof uploadedScore!=='undefined'&&uploadedScore);field.style.opacity=field.disabled?'.6':'1'};
  $('uploadInput')?.addEventListener('change',()=>setTimeout(sync,50));
  $('clearUploadBtn')?.addEventListener('click',()=>setTimeout(sync,50));
  sync();
}
function updateBuild(){
  const tech=$('technicalSection')?.querySelector('.foldcontent');
  if(tech){
    tech.querySelectorAll('.uploadinfo').forEach(e=>{if(/Interface Build Android\/WebApp \d+/.test(e.textContent||''))e.innerHTML=e.innerHTML.replace(/Interface Build Android\/WebApp \d+/g,`Interface Build Android/WebApp ${INTERFACE_BUILD}`)});
    let own=$('rootInterfaceBuildV32');
    if(!own){own=document.createElement('div');own.id='rootInterfaceBuildV32';own.className='uploadinfo';own.style.marginTop='8px';tech.appendChild(own)}
    own.textContent=`Interface Build Android/WebApp ${INTERFACE_BUILD}`;
  }
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),interface:INTERFACE_BUILD,platform:'Android/WebApp'};
}
function afterBase(){installSourceInstruction();updateBuild();return true}
const base=document.createElement('script');
base.src='/Composer-Lab/shared/root-interface-v31.js?fresh='+Date.now();
base.onload=()=>{let n=0;const t=setInterval(()=>{try{if(afterBase()){clearInterval(t);setTimeout(afterBase,500);setTimeout(afterBase,1500)}}catch(_){}if(++n>200)clearInterval(t)},50)};
(document.head||document.body).appendChild(base);
})();