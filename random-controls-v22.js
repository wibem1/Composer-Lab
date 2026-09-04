(()=>{
'use strict';
if(window.__compositionLabRandomControlsV22)return;
window.__compositionLabRandomControlsV22=true;
const $=id=>document.getElementById(id);
function report(msg,err=false){
  const e=$('experimentInfo');if(e)e.textContent=msg;
  const s=$('status');if(s)s.innerHTML='<span class="'+(err?'err':'ok')+'">'+String(msg).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</span>';
}
function bind(id,label,fn){
  const b=$(id);if(!b)return;
  b.disabled=false;
  b.onclick=()=>{
    try{
      fn();
      if(id==='inspirationBtn') report('Neue Inspiration erzeugt.');
      else report(label+' erzeugt. Die Vorlage ist im Experimentallabor bereit.');
    }catch(e){
      console.error('Composition Lab '+label,e);
      report(label+' fehlgeschlagen: '+(e?.message||e),true);
    }
  };
}
function install(){
  if(!$('experimentSection'))return false;
  bind('inspirationBtn','Inspiration',()=>{
    if(typeof generateInspiration!=='function')throw new Error('generateInspiration ist nicht verfügbar');
    generateInspiration();
  });
  bind('randomFreeBtn','Völliger Zufall',()=>{
    if(typeof generateRandomMusic!=='function')throw new Error('generateRandomMusic ist nicht verfügbar');
    generateRandomMusic(false);
  });
  bind('randomGuidedBtn','Zufall mit Eckdaten',()=>{
    if(typeof generateRandomMusic!=='function')throw new Error('generateRandomMusic ist nicht verfügbar');
    generateRandomMusic(true);
  });
  const v=document.getElementById('webRepairBuildV22');
  if(!v){
    const host=$('technicalSection')?.querySelector('.foldcontent');
    if(host){const d=document.createElement('div');d.id='webRepairBuildV22';d.className='uploadinfo';d.style.marginTop='12px';d.textContent='WebApp Repair V22 · Zufallssteuerung aktiv';host.appendChild(d)}
  }
  return true;
}
let n=0;const t=setInterval(()=>{n++;try{if(install()){clearInterval(t);setTimeout(install,600)}}catch(e){}if(n>200)clearInterval(t)},100);
})();
