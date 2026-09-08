(()=>{
'use strict';
if(window.__compositionLabConsolidatedBootstrap)return;
window.__compositionLabConsolidatedBootstrap=true;

const BUILD='consolidation-3';
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
    if(!window.CompositionLabEngine) await load(base+'composition-engine.js');
    if(!window.CompositionLabStorage) await load(base+'storage-engine.js');
    await load(base+'storage-adapter.js');
    await load(base+'root-engine-adapter.js');
    await load(base+'midi-analysis-adapter.js');
    await load(base+'player-adapter.js');

    window.__compositionLabArchitecture={
      bootstrap:BUILD,
      engine:Number(window.CompositionLabEngine?.BUILD||0),
      mode:'consolidated-webapp',
      modules:['composition-engine','storage-engine','storage-adapter','root-engine-adapter','midi-analysis-adapter','player-adapter'],
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
