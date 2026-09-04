(()=>{
'use strict';
const INTERFACE_BUILD=31;
const $=id=>document.getElementById(id);
function activeBuild(){return Math.max(Number(window.__compositionLabTargetInterfaceBuild)||0,INTERFACE_BUILD)}
function afterBase(){
  const exp=$('experimentSection');
  if(!exp)return false;
  const sum=exp.querySelector(':scope > summary');
  if(sum)sum.textContent='Experimentallabor';

  const synth=$('synthesisSection');
  if(synth){
    synth.id='comparisonLabSection';
    synth.classList.add('foldbox');
    const s=synth.querySelector(':scope > summary');
    if(s)s.textContent='Vergleichslabor';
    if(exp.parentElement && synth.parentElement!==exp.parentElement){
      exp.after(synth);
    } else if(exp.parentElement){
      exp.after(synth);
    }
  }

  const shown=activeBuild();
  const tech=$('technicalSection')?.querySelector('.foldcontent');
  if(tech){
    tech.querySelectorAll('.uploadinfo').forEach(e=>{
      if(/Interface Build Android\/WebApp \d+/.test(e.textContent||'')){
        e.innerHTML=e.innerHTML.replace(/Interface Build Android\/WebApp \d+/g,`Interface Build Android/WebApp ${shown}`);
      }
    });
    let own=$('rootInterfaceBuildV31');
    if(!own){own=document.createElement('div');own.id='rootInterfaceBuildV31';own.className='uploadinfo';own.style.marginTop='8px';tech.appendChild(own)}
    own.textContent=`Interface Build Android/WebApp ${shown}`;
  }
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),interface:shown,platform:'Android/WebApp'};
  try{
    const states=JSON.parse(localStorage.getItem('composition_lab_root_fold_states_v2')||'{}');
    if(synth && Object.prototype.hasOwnProperty.call(states,'comparisonLabSection'))synth.open=!!states.comparisonLabSection;
    if(synth&&!synth.dataset.foldPersistV31){
      synth.dataset.foldPersistV31='1';
      const sm=synth.querySelector(':scope > summary');
      sm?.addEventListener('click',()=>{
        try{const st=JSON.parse(localStorage.getItem('composition_lab_root_fold_states_v2')||'{}');st.comparisonLabSection=!synth.open;localStorage.setItem('composition_lab_root_fold_states_v2',JSON.stringify(st))}catch(_){}
      },{capture:true});
    }
  }catch(_){}
  return true;
}
const base=document.createElement('script');
base.src='/Composer-Lab/shared/root-interface-v30.js?fresh='+Date.now();
base.onload=()=>{let n=0;const t=setInterval(()=>{try{if(afterBase()){clearInterval(t);setTimeout(afterBase,500);setTimeout(afterBase,1500)}}catch(_){}if(++n>200)clearInterval(t)},50)};
(document.head||document.body).appendChild(base);
})();