(()=>{
'use strict';
const VERSION='shared-experiment-1.0';
const STORAGE_KEY='composition_lab_shared_template_history_v1';
const E=()=>window.CompositionLabEngine;
const clone=x=>JSON.parse(JSON.stringify(x));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function loadHistory(){try{const a=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}}
function saveHistory(a){localStorage.setItem(STORAGE_KEY,JSON.stringify((Array.isArray(a)?a:[]).slice(-50)))}
function addHistory(pkg){const a=loadHistory();a.push(clone(pkg));saveHistory(a);return a}
function removeHistory(id){const a=loadHistory().filter(x=>x.id!==id);saveHistory(a);return a}
function packageTemplate({score,settings,idea,provider,model,kind='ki'}){return{id:'tpl-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),createdAt:new Date().toISOString(),kind,score:clone(score),settings:clone(settings||{}),idea:String(idea||score?.sm||''),provider:provider||null,model:model||null,engineVersion:VERSION}}

const motifs=['eine ansteigende kleine Terz, die sich anschließend schrittweise zurückzieht','ein kurzer Ruf aus zwei nahen Tönen und einem überraschenden Sprung','eine ruhige Linie, die sich aus einem wiederkehrenden Intervall heraus entfaltet','ein synkopierter Auftakt, der in eine lange gesangliche Note mündet','ein fallender Dreiton-Gedanke mit offener Antwort'];
const motions=['zunächst behutsam, später in größerem Register','durch Verkürzung, Umkehrung und veränderte Antwort','mit wachsender harmonischer Spannung und anschließendem Rückzug','durch Wechsel zwischen dichter und sehr transparenter Textur','durch Verschiebung der Akzente und Erweiterung der Phrase'];
const characters=['fragil und suchend','hell und beweglich','dunkel, aber nicht schwer','spielerisch mit einem leichten Widerhaken','ruhig und weit','tänzerisch, jedoch nicht regelmäßig'];
function randomIdea(settings={},guided=false){
  const ens=guided&&settings.ensemble?`Für ${settings.ensemble}: `:'';
  const style=guided&&settings.style?` Der Charakter „${settings.style}“ darf dabei spürbar sein.`:'';
  return `${ens}${pick(motifs)} bildet den musikalischen Keim. Er entwickelt sich ${pick(motions)}; der Gesamtcharakter bleibt ${pick(characters)}.${style}`;
}

function meterInfo(m){const s=String(m||'4/4').split('/').map(Number);const n=s[0]||4,d=s[1]||4;return{n,d,beats:n*(4/d)}}
function randomScore(settings={},guided=false){
  const measures=clamp(Number(settings.measures)||4,1,16);
  const bpm=guided?clamp(Number(settings.bpm)||96,20,240):pick([54,60,66,72,80,88,96,104,116,128,144]);
  const meter=guided&&settings.meter?settings.meter:pick(['2/4','3/4','4/4','5/4','6/8']);
  const ts=meterInfo(meter),bars=measures,total=bars*ts.beats;
  const idea=randomIdea(settings,guided);
  const roots=[48,50,52,53,55,57,59,60],root=pick(roots),scale=pick([[0,2,3,5,7,8,10],[0,2,4,5,7,9,11],[0,2,3,5,7,9,10]]);
  const nt=[];let t=0,prev=root+12+pick(scale);
  const durs=[.25,.5,.5,.75,1,1,1.5,2];
  while(t<total-.02){let d=Math.min(pick(durs),total-t);let step=pick([-2,-1,-1,0,1,1,2]);let idx=scale.map((x,i)=>({x:root+12+x,i})).sort((a,b)=>Math.abs(a.x-prev)-Math.abs(b.x-prev))[0]?.i||0;idx=clamp(idx+step,0,scale.length-1);let p=root+12+scale[idx]+(Math.random()<.18?12:0);prev=p;nt.push([+t.toFixed(3),+d.toFixed(3),p,Math.round(62+Math.random()*38),1,Math.random()<.15?.7:.96]);t+=d;}
  const bass=[];for(let b=0;b<bars;b++){const st=b*ts.beats;const degree=pick([0,0,3,4,5]);const p=root+scale[clamp(degree,0,scale.length-1)]-12;bass.push([+st.toFixed(3),Math.max(.5,ts.beats*.8),p,Math.round(48+Math.random()*28),2,.98]);}
  return{ti:guided?'Zufall mit Eckdaten':'Völliger Zufall',sm:idea,bpm,ts:{n:ts.n,d:ts.d},k:guided&&settings.key?settings.key:'frei',tr:[{nm:'Melodie',ch:0,pg:0,nt,ct:[]},{nm:'Bass',ch:1,pg:0,nt:bass,ct:[]}],_meta:{measures,ensemble:settings.ensemble||'Klavier',style:settings.style||'',experimentKind:guided?'guided-random':'free-random'}};
}

async function generateIdea(req){
  const e=E();if(!e)throw new Error('Gemeinsame Kompositionsengine ist noch nicht geladen.');
  const s=req.settings||{};
  const system='Du bist Kompositionspartner. Formuliere nur einen kurzen, konkreten musikalischen Gedanken für eine MIDI-Vorlage. Keine JSON-Daten und keine allgemeinen Qualitätsregeln.';
  const user=`Entwirf eine Kompositionsidee für eine ${s.measures||4}-taktige musikalische Vorlage. Besetzung: ${s.ensemble||'frei'}. Tempo: ${s.bpm||96} BPM. Charakter/Stil: ${s.style||'frei'}. Formuliere prägnant in 2 bis 4 Sätzen einen musikalischen Kern und eine mögliche Entwicklungsrichtung.`;
  const r=await e.callLLM({provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium',systemPrompt:system,userPrompt:user,wantJson:false});
  return{idea:r.text,usage:r.usage,diagnostic:{systemPrompt:system,userPrompt:user,response:r.text}};
}

async function generateTemplate(req){
  const e=E();if(!e)throw new Error('Gemeinsame Kompositionsengine ist noch nicht geladen.');
  const s=req.settings||{},idea=String(req.idea||'').trim()||randomIdea(s,true);
  const system=e.SYSTEM_PREFIX;
  const task=`Erzeuge eine kurze musikalische Ausgangsvorlage, keine fertige große Komposition.\nVerbindlich: ${s.measures||4} Takte, ${s.bpm||96} BPM, Besetzung: ${s.ensemble||'frei'}.\nCharakter/Stil: ${s.style||'frei'}.\nKompositionsidee: ${idea}\nTonart und Taktart dürfen passend gewählt werden, sofern nicht vorgegeben.\n\n${e.TECHNICAL_PROMPT}`;
  const r=await e.callLLM({provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium',systemPrompt:system,userPrompt:task,wantJson:true});
  const score=e.extractJSON(r.text);score.bpm=Number(s.bpm)||score.bpm||96;score.sm=idea;score._meta={...(score._meta||{}),measures:Number(s.measures)||4,ensemble:s.ensemble||'frei',style:s.style||'',experimentKind:'ki-template',experimentEngine:VERSION};
  const pkg=packageTemplate({score,settings:s,idea,provider:req.provider,model:req.model,kind:'ki'});addHistory(pkg);
  return{score,pkg,idea,usage:r.usage,diagnostic:{systemPrompt:system,userPrompt:task,response:r.text}};
}

window.CompositionLabExperiment={VERSION,STORAGE_KEY,loadHistory,saveHistory,addHistory,removeHistory,packageTemplate,randomIdea,randomScore,generateIdea,generateTemplate};
window.dispatchEvent(new CustomEvent('compositionlab-experiment-ready',{detail:{version:VERSION}}));
})();