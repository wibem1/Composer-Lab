(()=>{
'use strict';
const ENGINE_BUILD=4;
const VERSION='shared-storage-1.0';
const COMPOSITIONS='composition_lab_shared_composition_history_v1';
const TEMPLATES='composition_lab_shared_template_history_v1';
const MIGRATED='composition_lab_shared_storage_migrated_v1';
const clone=x=>JSON.parse(JSON.stringify(x));
function parse(s,f=[]){try{const x=JSON.parse(s||'');return x??f}catch(_){return f}}
function load(k){const a=parse(localStorage.getItem(k),[]);return Array.isArray(a)?a:[]}
function save(k,a,max=100){localStorage.setItem(k,JSON.stringify((Array.isArray(a)?a:[]).slice(-max)))}
function packageComposition({score,settings={},idea='',task='',provider=null,model=null,sourceName=''}){return{id:'cmp-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),createdAt:new Date().toISOString(),score:clone(score),settings:clone(settings),idea:String(idea||score?.sm||''),task:String(task||''),provider,model,sourceName:String(sourceName||''),engineBuild:ENGINE_BUILD}}
function addComposition(pkg){const a=load(COMPOSITIONS);a.push(clone(pkg));save(COMPOSITIONS,a,100);return a}
function loadCompositions(){return load(COMPOSITIONS)}
function saveCompositions(a){save(COMPOSITIONS,a,100)}
function loadTemplates(){return load(TEMPLATES)}
function saveTemplates(a){save(TEMPLATES,a,100)}
function migrateLegacy(){
  if(localStorage.getItem(MIGRATED)==='1')return;
  const out=loadCompositions();
  const seen=new Set(out.map(x=>String(x.id)));
  const root=parse(localStorage.getItem('ai_midi_composer_history_v37'),[]);
  for(const it of Array.isArray(root)?root:[]){if(!it?.score)continue;const id='legacy-root-'+String(it.id||Math.random());if(seen.has(id))continue;out.push({id,createdAt:new Date().toISOString(),score:clone(it.score),settings:{},idea:String(it.concept||it.score?.sm||''),task:'',provider:it.provider||null,model:it.model||null,sourceName:'',engineBuild:ENGINE_BUILD,legacy:true});seen.add(id)}
  const mac=parse(localStorage.getItem('composition_lab_mac_webapp_v1'),{});
  for(const s of Array.isArray(mac?.history)?mac.history:[]){if(!s)continue;const id='legacy-rich-'+String(s.ti||'piece')+'-'+String(s.bpm||'')+'-'+String((s.tr||[]).reduce((n,t)=>n+(t.nt?.length||0),0));if(seen.has(id))continue;out.push({id,createdAt:new Date().toISOString(),score:clone(s),settings:clone(s._meta||{}),idea:String(s._meta?.idea||s.sm||''),task:String(s._meta?.task||''),provider:mac.provider||null,model:mac.model||null,sourceName:'',engineBuild:ENGINE_BUILD,legacy:true});seen.add(id)}
  saveCompositions(out);
  localStorage.setItem(MIGRATED,'1');
}
function makeBackup(ui={}){migrateLegacy();return{format:'composition-lab-backup',backupVersion:2,engineBuild:ENGINE_BUILD,createdAt:new Date().toISOString(),data:{compositions:loadCompositions(),templates:loadTemplates(),ui:clone(ui||{})}}}
function restoreBackup(b){if(!b||b.format!=='composition-lab-backup')throw new Error('Keine gültige Composition-Lab-Sicherung.');const d=b.data||{};if(Array.isArray(d.compositions))saveCompositions(d.compositions);if(Array.isArray(d.templates))saveTemplates(d.templates);return clone(d.ui||{})}
function clearCompositions(){saveCompositions([])}
migrateLegacy();
window.CompositionLabStorage={VERSION,ENGINE_BUILD,COMPOSITIONS,TEMPLATES,loadCompositions,saveCompositions,packageComposition,addComposition,loadTemplates,saveTemplates,makeBackup,restoreBackup,clearCompositions,migrateLegacy};
window.dispatchEvent(new CustomEvent('compositionlab-storage-ready',{detail:{version:VERSION,engineBuild:ENGINE_BUILD}}));
})();