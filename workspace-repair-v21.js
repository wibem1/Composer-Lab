(()=>{
'use strict';
if(window.__compositionLabWorkspaceRepairV27)return;
window.__compositionLabWorkspaceRepairV27=true;

const $=id=>document.getElementById(id);
const IDEA_KEY='composition_lab_experiment_idea_v27';
const text=v=>String(v??'').trim();
const esc=v=>String(v??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),engine:14,interface:49,platform:'android-webapp'};
window.__compositionLabTargetInterfaceBuild=49;

function setInfo(msg,err=false){
  const e=$('experimentInfo'); if(e)e.textContent=msg;
  const s=$('status'); if(s)s.innerHTML='<span class="'+(err?'err':'ok')+'">'+esc(msg)+'</span>';
}
function saveIdea(v){
  const idea=text(v);
  const el=$('labIdea'); if(el)el.value=idea;
  try{localStorage.setItem(IDEA_KEY,idea)}catch(_){}
  return idea;
}
function ideaFromScore(score,fallback=''){
  return text(score?.sm)||text(fallback)||'Erkunde das entstandene Material als Ausgangspunkt und entwickle seine auffälligsten musikalischen Eigenschaften weiter.';
}
function showAsCurrentTemplate(score,kind,idea){
  if(!score)return;
  const meta={
    idea:saveIdea(ideaFromScore(score,idea)),
    ensemble:text($('labEnsemble')?.value)||text($('ensemble')?.value),
    style:text($('labStyle')?.value),
    bpm:Number(score.bpm)||Number($('labTempo')?.value)||96,
    meter:`${Number(score.ts?.n)||4}/${Number(score.ts?.d)||4}`,
    key:text(score.k),
    measures:Number($('templateLength')?.value)||4
  };
  try{window.compositionLabSetCurrentTemplate?.({title:score.ti||kind||'Vorlage',kind:kind||'Vorlage',score:JSON.parse(JSON.stringify(score)),meta})}catch(_){}
  try{window.compositionLabAddTemplateHistory?.(score,kind||'Lokale Vorlage',meta)}catch(_){}
}

function ensureIdeaUi(){
  const exp=$('experimentSection');
  const content=exp?.querySelector('.foldcontent');
  if(!content||$('labIdea'))return;
  const box=document.createElement('div');
  box.id='labIdeaWork';
  box.style.cssText='margin-top:12px;padding-top:12px;border-top:1px solid var(--line,#444)';
  box.innerHTML=`<label for="labIdea" style="margin-top:0;">Kompositionsidee</label><textarea id="labIdea" style="min-height:105px" placeholder="Hier erscheint die Idee des Experiments oder der KI-Vorlage. Der Text bleibt editierbar."></textarea><div class="toolbar" style="margin-top:8px;margin-bottom:4px"><button type="button" class="secondary smallbtn" id="labIdeaGenerateBtn">Erzeuge</button></div><div class="uploadinfo" id="labIdeaInfo">Die Idee gehört zusammen mit MIDI-Vorlage und Einstellungen zum gespeicherten Vorlagenpaket.</div>`;
  const buttons=content.querySelector('.labbuttons');
  if(buttons)content.insertBefore(box,buttons); else content.appendChild(box);
  try{$('labIdea').value=localStorage.getItem(IDEA_KEY)||''}catch(_){}
  $('labIdea').addEventListener('input',()=>{try{localStorage.setItem(IDEA_KEY,$('labIdea').value)}catch(_){}});
  $('labIdeaGenerateBtn').onclick=async()=>{
    const b=$('labIdeaGenerateBtn'),info=$('labIdeaInfo');
    const provider=$('provider')?.value,model=$('model')?.value,apiKey=$('apiKey')?.value;
    if(!apiKey){info.textContent='Bitte zuerst unter Technisches einen API-Key eintragen.';return;}
    const measures=$('templateLength')?.value||'4';
    const bpm=$('labTempo')?.value||'96';
    const ensemble=text($('labEnsemble')?.value)||'Klavier solo';
    const style=text($('labStyle')?.value)||'frei';
    b.disabled=true; const old=b.textContent; b.textContent='KI denkt …';
    try{
      const system='Du bist Kompositionspartner. Formuliere nur einen kurzen musikalischen Gedanken für eine MIDI-Vorlage. Keine technischen JSON-Daten und kein detaillierter Bauplan.';
      const user=`Entwirf eine offene Kompositionsidee für eine ${measures}-taktige musikalische Vorlage. Besetzung: ${ensemble}. Tempo: ${bpm} BPM. Charakter/Stil: ${style}. Formuliere prägnant in 2 bis 4 Sätzen.`;
      const out=await callLLM(provider,model,apiKey,system,user,false);
      saveIdea(out?.text??out);
      info.textContent='Kompositionsidee erzeugt. Du kannst sie vor der Vorlagenerzeugung ändern.';
    }catch(e){info.textContent='Fehler: '+(e?.message||e)}
    finally{b.disabled=false;b.textContent=old;}
  };
}

function normalizeUi(){
  const tplBtn=$('randomToTemplateBtn');
  if(tplBtn){tplBtn.textContent='Vorlage erzeugen';tplBtn.title='Erzeugt aus den Angaben des Experimentallabors eine KI-MIDI-Vorlage.';}
  const hs=$('experimentHistorySection');
  if(hs){const s=hs.querySelector('summary');if(s)s.textContent='Vorlagenverlauf';}
  const ch=$('historySection')?.querySelector('summary');
  if(ch)ch.textContent='Kompositionsverlauf · Stücke wieder laden';

  // Alte, inzwischen doppelte Reparatur-UI entfernen.
  $('backupTechV21')?.remove();
  document.querySelectorAll('[id^="webRepairBuild"]').forEach(e=>e.remove());

  const techHost=$('technicalSection')?.querySelector('.foldcontent');
  if(techHost){
    const d=document.createElement('div');
    d.id='webRepairBuildV27'; d.className='uploadinfo'; d.style.marginTop='12px';
    d.textContent='WebApp Repair V27 · bereinigter WebApp-Stand';
    techHost.appendChild(d);
  }

  // Veraltete sichtbare Interface-Nummern vereinheitlichen.
  for(const el of document.querySelectorAll('body *')){
    if(el.children.length)continue;
    const t=el.textContent||'';
    if(/Interface[- ]Build Android\/WebApp \d+/i.test(t))
      el.textContent=t.replace(/Interface[- ]Build Android\/WebApp \d+/ig,'Interface-Build Android/WebApp 49');
  }
}

function wireHistoryMetadata(){
  if(typeof window.compositionLabAddTemplateHistory==='function'&&!window.__compositionLabAddTemplateHistoryV27){
    const base=window.compositionLabAddTemplateHistory;
    window.__compositionLabAddTemplateHistoryV27=base;
    window.compositionLabAddTemplateHistory=function(score,kind,meta={}){
      const idea=text(meta.idea)||text($('labIdea')?.value)||text(score?.sm);
      return base(score,kind,{...meta,idea,labIdea:idea,ensemble:text(meta.ensemble)||text($('labEnsemble')?.value),style:text(meta.style)||text($('labStyle')?.value),bpm:Number(meta.bpm)||Number($('labTempo')?.value)||Number(score?.bpm)||96,templateLength:meta.templateLength||$('templateLength')?.value});
    };
  }
}

function wireExperimentButtons(){
  const inspiration=$('inspirationBtn'),free=$('randomFreeBtn'),guided=$('randomGuidedBtn');
  if(inspiration&&!inspiration.dataset.v27){
    inspiration.dataset.v27='1'; inspiration.disabled=false; inspiration.textContent='💡 Inspiration';
    inspiration.onclick=()=>{try{if(typeof generateInspiration!=='function')throw new Error('Inspiration-Funktion fehlt');const oldPrompt=$('prompt')?.value||'';generateInspiration();const idea=$('prompt')?.value||'';if($('prompt'))$('prompt').value=oldPrompt;try{saveCurrentState()}catch(_){}saveIdea(idea);setInfo('Neue Inspiration als Kompositionsidee erzeugt.')}catch(e){setInfo('Inspiration fehlgeschlagen: '+(e?.message||e),true)}};
  }
  if(free&&!free.dataset.v27){
    free.dataset.v27='1'; free.disabled=false;
    free.onclick=()=>{try{if(typeof generateRandomMusic!=='function')throw new Error('Zufallsfunktion fehlt');generateRandomMusic(false);const score=typeof lastScore!=='undefined'?lastScore:null;showAsCurrentTemplate(score,'Völliger Zufall',ideaFromScore(score,'Völliger Zufall als Ausgangsmaterial. Suche im entstandenen Material nach einer überraschenden musikalischen Eigenschaft und entwickle sie weiter.'));setInfo('Völliger Zufall erzeugt · MIDI und Kompositionsidee sind als aktuelle Vorlage geladen.')}catch(e){setInfo('Völliger Zufall fehlgeschlagen: '+(e?.message||e),true)}};
  }
  if(guided&&!guided.dataset.v27){
    guided.dataset.v27='1'; guided.disabled=false;
    guided.onclick=()=>{try{if(typeof generateRandomMusic!=='function')throw new Error('Zufallsfunktion fehlt');generateRandomMusic(true);const score=typeof lastScore!=='undefined'?lastScore:null;showAsCurrentTemplate(score,'Zufall mit Eckdaten',ideaFromScore(score,'Zufälliges Ausgangsmaterial innerhalb der gewählten Eckdaten. Entwickle die auffälligste entstandene Figur oder Klangbewegung weiter.'));setInfo('Zufall mit Eckdaten erzeugt · MIDI und Kompositionsidee sind als aktuelle Vorlage geladen.')}catch(e){setInfo('Zufall mit Eckdaten fehlgeschlagen: '+(e?.message||e),true)}};
  }
}

function install(){
  if(!$('experimentSection')||!$('technicalSection'))return false;
  ensureIdeaUi();
  wireHistoryMetadata();
  wireExperimentButtons();
  normalizeUi();
  return true;
}

let tries=0;
const timer=setInterval(()=>{
  tries++;
  try{if(install()){clearInterval(timer);setTimeout(()=>{normalizeUi();wireHistoryMetadata();wireExperimentButtons();},500)}}catch(_){}
  if(tries>200)clearInterval(timer);
},100);
})();
