(()=>{
'use strict';
const INTERFACE_BUILD=36;
window.__compositionLabTargetInterfaceBuild=INTERFACE_BUILD;
const $=id=>document.getElementById(id);
function normalizeBuildDisplay(){
  const tech=$('technicalSection')?.querySelector('.foldcontent');
  if(!tech)return;
  const label=`Interface Build Android/WebApp ${INTERFACE_BUILD}`;
  tech.querySelectorAll('.uploadinfo').forEach(e=>{
    if(/Interface Build Android\/WebApp \d+/.test(e.textContent||'')){
      e.innerHTML=e.innerHTML.replace(/Interface Build Android\/WebApp \d+/g,label);
    }
  });
  const pure=[];
  tech.querySelectorAll('.uploadinfo').forEach(e=>{
    if(/^Interface Build Android\/WebApp \d+$/.test((e.textContent||'').trim()))pure.push(e);
  });
  if(pure.length){
    pure[0].id='rootInterfaceBuildActive';
    pure[0].textContent=label;
    pure.slice(1).forEach(e=>e.remove());
  }else{
    const d=document.createElement('div');
    d.id='rootInterfaceBuildActive';d.className='uploadinfo';d.style.marginTop='8px';d.textContent=label;
    tech.appendChild(d);
  }
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),engine:window.CompositionLabEngine?.BUILD||5,interface:INTERFACE_BUILD,platform:'Android/WebApp'};
}
const base=document.createElement('script');
base.src='/Composer-Lab/shared/root-interface-v34.js?fresh='+Date.now();
base.onload=()=>{
  [100,500,1800,3200].forEach(ms=>setTimeout(normalizeBuildDisplay,ms));
};
(document.head||document.body).appendChild(base);
})();