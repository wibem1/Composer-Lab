(()=>{
'use strict';
if(window.__compositionLabConsolidatedBootstrap)return;
window.__compositionLabConsolidatedBootstrap=true;

const BUILD='consolidation-1';
const base='/Composer-Lab/shared/';

function load(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.async=false;
    s.src=src+(src.includes('?')?'&':'?')+'consolidated='+encodeURIComponent(BUILD)+'-'+Date.now();
    s.onload=()=>resolve(src);
    s.onerror=()=>reject(new Error('Konnte Modul nicht laden: '+src));
    (document.head||document.body).appendChild(s);
  });
}

async function start(){
  try{
    // 1. Gemeinsamer musikalischer Kern
    if(!window.CompositionLabEngine) await load(base+'composition-engine.js');

    // 2. Gemeinsame Speicherung
    if(!window.CompositionLabStorage) await load(base+'storage-engine.js');
    await load(base+'storage-adapter.js');

    // 3. WebApp-Adapter. Dieser aktiviert die Engine 14 am Komponieren-Button
    //    und lädt anschließend Experiment-Engine, Experiment-Adapter,
    //    Modellkonfiguration und die aktuelle Root-Oberfläche.
    await load(base+'root-engine-adapter.js');

    window.__compositionLabArchitecture={
      bootstrap:BUILD,
      engine:Number(window.CompositionLabEngine?.BUILD||0),
      mode:'consolidated-webapp',
      startedAt:new Date().toISOString()
    };

    try{window.dispatchEvent(new CustomEvent('compositionlab-consolidated-ready',{detail:window.__compositionLabArchitecture}));}catch(_){}
    console.info('Composition Lab consolidated bootstrap ready',window.__compositionLabArchitecture);
  }catch(err){
    console.error('Composition Lab consolidated bootstrap failed',err);
    const st=document.getElementById('status');
    if(st) st.innerHTML='<span class="err">Konsolidierter Start fehlgeschlagen: '+String(err?.message||err)+'</span>';
  }
}

start();
})();
