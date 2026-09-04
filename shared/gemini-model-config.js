(()=>{
'use strict';
const STORAGE_ID='ai_midi_composer_settings_v37';
const MIGRATION_KEY='composition_lab_gemini38_default_migrated_v1';
const MODEL_38='gemini-3.8-flash';
const MODEL_37='gemini-3.7-flash';
const $=id=>document.getElementById(id);
function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_ID)||'{}')||{}}catch(_){return{}}}
function writeState(x){try{localStorage.setItem(STORAGE_ID,JSON.stringify(x))}catch(_){}}
function ensureGeminiOptions(){
  const provider=$('provider'),model=$('model');
  if(!provider||!model||provider.value!=='gemini')return;
  const state=readState();
  const saved=state.models?.gemini||'';
  if(![...model.options].some(o=>o.value===MODEL_38)){
    const o=document.createElement('option');o.value=MODEL_38;o.textContent='Gemini 3.8 Flash';model.insertBefore(o,model.firstChild);
  }
  if(![...model.options].some(o=>o.value===MODEL_37)){
    const o=document.createElement('option');o.value=MODEL_37;o.textContent='Gemini 3.7 Flash';model.appendChild(o);
  }
  const migrated=localStorage.getItem(MIGRATION_KEY)==='1';
  if(!migrated){
    if(!saved||saved===MODEL_37){
      model.value=MODEL_38;
      state.models={...(state.models||{}),gemini:MODEL_38};
      writeState(state);
    }else if([...model.options].some(o=>o.value===saved)) model.value=saved;
    try{localStorage.setItem(MIGRATION_KEY,'1')}catch(_){}
  }else if(saved&&[...model.options].some(o=>o.value===saved)){
    model.value=saved;
  }else if(!model.value){
    model.value=MODEL_38;
  }
}
function bind(){
  const provider=$('provider'),model=$('model');
  if(!provider||!model)return false;
  ensureGeminiOptions();
  if(!provider.dataset.gemini38Bound){provider.dataset.gemini38Bound='1';provider.addEventListener('change',()=>setTimeout(ensureGeminiOptions,0));}
  if(!model.dataset.gemini38Bound){model.dataset.gemini38Bound='1';model.addEventListener('change',()=>{if(provider.value!=='gemini')return;const state=readState();state.models={...(state.models||{}),gemini:model.value};writeState(state);});}
  return true;
}
let n=0;const t=setInterval(()=>{if(bind()||++n>200)clearInterval(t)},100);
window.addEventListener('compositionlab-storage-restored',()=>setTimeout(bind,100));
})();