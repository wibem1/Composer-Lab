(()=>{
'use strict';
const INTERFACE_BUILD=35;
window.__compositionLabTargetInterfaceBuild=INTERFACE_BUILD;
const $=id=>document.getElementById(id);
let normalizing=false;
function normalizeBuildDisplay(){
  if(normalizing)return;normalizing=true;
  try{
    const tech=$('technicalSection')?.querySelector('.foldcontent');
    if(!tech)return;
    // Alle sichtbaren Android/WebApp-Buildangaben auf den aktiven Build bringen.
    tech.querySelectorAll('*').forEach(e=>{
      if(e.children.length===0 && /Interface Build Android\/WebApp \d+/.test(e.textContent||'')){
        e.textContent=(e.textContent||'').replace(/Interface Build Android\/WebApp \d+/g,`Interface Build Android/WebApp ${INTERFACE_BUILD}`);
      }
    });
    // Auch zusammengesetzte HTML-Zeilen wie "Engine Build … · Interface Build …" korrigieren.
    tech.querySelectorAll('.uploadinfo').forEach(e=>{
      if(/Interface Build Android\/WebApp \d+/.test(e.textContent||'')){
        e.innerHTML=e.innerHTML.replace(/Interface Build Android\/WebApp \d+/g,`Interface Build Android/WebApp ${INTERFACE_BUILD}`);
      }
    });
    // Alte, ausschließlich für die Buildanzeige angelegte Zusatzzeilen entfernen.
    const pure=[];
    tech.querySelectorAll('.uploadinfo').forEach(e=>{
      const t=(e.textContent||'').trim();
      if(/^Interface Build Android\/WebApp \d+$/.test(t))pure.push(e);
    });
    pure.slice(1).forEach(e=>e.remove());
    if(!pure.length){
      const d=document.createElement('div');d.className='uploadinfo';d.id='rootInterfaceBuildActive';d.style.marginTop='8px';d.textContent=`Interface Build Android/WebApp ${INTERFACE_BUILD}`;tech.appendChild(d);
    }else{
      pure[0].id='rootInterfaceBuildActive';pure[0].textContent=`Interface Build Android/WebApp ${INTERFACE_BUILD}`;
    }
    window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),interface:INTERFACE_BUILD,platform:'Android/WebApp'};
  }finally{normalizing=false}
}
function installGuard(){
  normalizeBuildDisplay();
  const tech=$('technicalSection')?.querySelector('.foldcontent');
  if(!tech)return false;
  if(!window.__compositionLabBuildObserver){
    const obs=new MutationObserver(()=>queueMicrotask(normalizeBuildDisplay));
    obs.observe(tech,{subtree:true,childList:true,characterData:true});
    window.__compositionLabBuildObserver=obs;
  }
  return true;
}
const base=document.createElement('script');
base.src='/Composer-Lab/shared/root-interface-v34.js?fresh='+Date.now();
base.onload=()=>{
  let n=0;const t=setInterval(()=>{try{if(installGuard()&&++n>20)clearInterval(t)}catch(_){}if(++n>120)clearInterval(t)},100);
  setTimeout(normalizeBuildDisplay,300);setTimeout(normalizeBuildDisplay,1000);setTimeout(normalizeBuildDisplay,2500);
};
(document.head||document.body).appendChild(base);
})();