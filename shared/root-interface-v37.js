(()=>{
'use strict';
const INTERFACE_BUILD=37;
window.__compositionLabTargetInterfaceBuild=INTERFACE_BUILD;
window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),engine:window.CompositionLabEngine?.BUILD||5,interface:INTERFACE_BUILD,platform:'Android/WebApp'};
const base=document.createElement('script');
base.src='/Composer-Lab/shared/root-interface-v36.js?fresh='+Date.now();
base.onload=()=>{
  const sync=()=>{window.__compositionLabTargetInterfaceBuild=INTERFACE_BUILD;window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),engine:window.CompositionLabEngine?.BUILD||5,interface:INTERFACE_BUILD,platform:'Android/WebApp'}};
  sync();setTimeout(sync,500);setTimeout(sync,2000);
};
(document.head||document.body).appendChild(base);
})();