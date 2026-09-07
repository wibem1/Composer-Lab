(()=>{
'use strict';
if(window.CompositionLabCLAB)return;
const FORMAT='composition-lab-project';
const VERSION=1;
const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
const bytesToBase64=bytes=>{
  if(!bytes)return'';
  const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  let s='';
  const step=0x8000;
  for(let i=0;i<a.length;i+=step)s+=String.fromCharCode(...a.subarray(i,i+step));
  return btoa(s);
};
const base64ToBytes=s=>{
  if(!s)return new Uint8Array();
  const b=atob(String(s)),a=new Uint8Array(b.length);
  for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
  return a;
};
function makeProject({score,title='',idea='',task='',settings={},provider=null,model=null,source={},midiBytes=null,musicXML=null,originalMusicXML=null,usage=null,extensions={}}={}){
  if(!score)throw new Error('Für CLAB fehlt die Partitur.');
  return{
    format:FORMAT,
    version:VERSION,
    createdAt:new Date().toISOString(),
    title:String(title||score?.ti||'Komposition'),
    score:clone(score),
    idea:String(idea||score?.sm||''),
    task:String(task||''),
    settings:clone(settings||{}),
    ai:{provider:provider||null,model:model||null},
    source:clone(source||{}),
    representations:{
      midiBase64:midiBytes?bytesToBase64(midiBytes):'',
      musicXML:musicXML==null?null:String(musicXML),
      originalMusicXML:originalMusicXML==null?null:String(originalMusicXML)
    },
    usage:usage?clone(usage):null,
    extensions:clone(extensions||{})
  };
}
function normalizeProject(raw){
  if(!raw||typeof raw!=='object')throw new Error('Keine gültige CLAB-Datei.');
  if(raw.format===FORMAT&&Number(raw.version)>=1&&raw.score){
    const p=clone(raw);
    p.title=String(p.title||p.score?.ti||'Komposition');
    p.idea=String(p.idea||p.score?.sm||'');
    p.task=String(p.task||'');
    p.settings=p.settings&&typeof p.settings==='object'?p.settings:{};
    p.ai=p.ai&&typeof p.ai==='object'?p.ai:{provider:null,model:null};
    p.source=p.source&&typeof p.source==='object'?p.source:{};
    p.representations=p.representations&&typeof p.representations==='object'?p.representations:{};
    p.extensions=p.extensions&&typeof p.extensions==='object'?p.extensions:{};
    return p;
  }
  // Rückwärtskompatibilität für ältere .clabproject-artige JSON-Strukturen.
  if(raw.score){
    return makeProject({score:raw.score,title:raw.title||raw.score?.ti,idea:raw.idea||raw.concept||raw.score?.sm||'',task:raw.task||raw.prompt||'',settings:raw.settings||{},provider:raw.provider||raw.ai?.provider||null,model:raw.model||raw.ai?.model||null,source:raw.source||{},midiBytes:raw.midiBase64?base64ToBytes(raw.midiBase64):null,musicXML:raw.musicXML||null,originalMusicXML:raw.originalMusicXML||null,usage:raw.usage||null,extensions:raw.extensions||{legacy:true}});
  }
  throw new Error('Keine gültige CLAB-Datei.');
}
function stringify(project){return JSON.stringify(normalizeProject(project),null,2)}
function parse(text){return normalizeProject(JSON.parse(String(text||'')))}
window.CompositionLabCLAB={FORMAT,VERSION,makeProject,normalizeProject,stringify,parse,bytesToBase64,base64ToBytes};
window.dispatchEvent(new CustomEvent('compositionlab-clab-ready',{detail:{format:FORMAT,version:VERSION}}));
})();
