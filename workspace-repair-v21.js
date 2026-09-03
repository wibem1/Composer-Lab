(()=>{
'use strict';
if(window.__compositionLabWorkspaceRepairV22)return;
window.__compositionLabWorkspaceRepairV22=true;
const $=id=>document.getElementById(id);
const IDEA_KEY='composition_lab_experiment_idea_v21';
function text(v){return String(v??'').trim()}
function setInfo(msg,err=false){const e=$('experimentInfo');if(e)e.textContent=msg;const s=$('status');if(s)s.innerHTML='<span class="'+(err?'err':'ok')+'">'+String(msg).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</span>'}
function install(){
  const exp=$('experimentSection'), tech=$('technicalSection');
  if(!exp||!tech)return false;
  const content=exp.querySelector('.foldcontent');
  if(!content)return false;

  if(!$('labIdea')){
    const box=document.createElement('div');
    box.id='labIdeaWork';
    box.style.cssText='margin-top:12px;padding-top:12px;border-top:1px solid var(--line,#444)';
    box.innerHTML=`<label for="labIdea" style="margin-top:0;">Kompositionsidee</label>
      <textarea id="labIdea" style="min-height:105px" placeholder="Die KI formuliert hier die musikalische Idee der Vorlage. Der Text bleibt editierbar."></textarea>
      <div class="toolbar" style="margin-top:8px;margin-bottom:4px"><button type="button" class="secondary smallbtn" id="labIdeaGenerateBtn">Erzeuge</button></div>
      <div class="uploadinfo" id="labIdeaInfo">Die Idee gehört zusammen mit MIDI-Vorlage und Einstellungen zum gespeicherten Vorlagenpaket.</div>`;
    const buttons=content.querySelector('.labbuttons');
    if(buttons)content.insertBefore(box,buttons);else content.appendChild(box);
    try{$('labIdea').value=localStorage.getItem(IDEA_KEY)||''}catch(_){ }
    $('labIdea').addEventListener('input',()=>{try{localStorage.setItem(IDEA_KEY,$('labIdea').value)}catch(_){}});
    $('labIdeaGenerateBtn').onclick=async()=>{
      const b=$('labIdeaGenerateBtn'),info=$('labIdeaInfo');
      const provider=$('provider')?.value, model=$('model')?.value, apiKey=$('apiKey')?.value;
      if(!apiKey){info.textContent='Bitte zuerst unter Technisches einen API-Key eintragen.';return;}
      const measures=$('templateLength')?.value||'4', bpm=$('labTempo')?.value||'96', ensemble=text($('labEnsemble')?.value)||'Klavier solo', style=text($('labStyle')?.value)||'frei';
      b.disabled=true;const old=b.textContent;b.textContent='KI denkt …';
      try{
        const system='Du bist Kompositionspartner. Formuliere nur einen kurzen, konkreten musikalischen Gedanken für eine MIDI-Vorlage. Keine technischen JSON-Daten, keine allgemeinen Qualitätsregeln.';
        const user=`Entwirf eine Kompositionsidee für eine ${measures}-taktige musikalische Vorlage. Besetzung: ${ensemble}. Tempo: ${bpm} BPM. Charakter/Stil: ${style}. Formuliere prägnant in 2 bis 4 Sätzen: musikalischer Kern, mögliche motivische Bewegung und Entwicklungsrichtung.`;
        const out=await callLLM(provider,model,apiKey,system,user,false);
        $('labIdea').value=text(out?.text??out);try{localStorage.setItem(IDEA_KEY,$('labIdea').value)}catch(_){ }
        info.textContent='Kompositionsidee erzeugt. Du kannst sie vor der Vorlagenerzeugung ändern.';
      }catch(e){info.textContent='Fehler: '+(e?.message||e)}finally{b.disabled=false;b.textContent=old;}
    };
  }

  const tplBtn=$('randomToTemplateBtn');
  if(tplBtn){tplBtn.textContent='Vorlage erzeugen';tplBtn.title='Erzeugt die MIDI-Vorlage. Kompositionsidee, Einstellungen und MIDI werden gemeinsam im Vorlagenverlauf gespeichert.';}

  const hs=$('experimentHistorySection');
  if(hs){hs.open=true;const s=hs.querySelector('summary');if(s)s.textContent='Vorlagenverlauf';const player=$('randomTemplateBox');if(player&&player.parentElement===hs.parentElement)player.after(hs);}

  if(typeof window.compositionLabAddTemplateHistory==='function'&&!window.__compositionLabAddTemplateHistoryV21){
    window.__compositionLabAddTemplateHistoryV21=window.compositionLabAddTemplateHistory;
    const base=window.compositionLabAddTemplateHistory;
    window.compositionLabAddTemplateHistory=function(score,kind,meta={}){
      const idea=text($('labIdea')?.value)||text(meta.idea)||text(score?.sm);
      return base(score,kind,{...meta,idea,labIdea:idea,ensemble:text($('labEnsemble')?.value)||meta.ensemble,style:text($('labStyle')?.value)||meta.style,bpm:Number($('labTempo')?.value)||meta.bpm,templateLength:$('templateLength')?.value||meta.templateLength});
    };
  }

  const hbox=$('experimentHistoryList');
  if(hbox&&!hbox.dataset.ideaRestoreV21){
    hbox.dataset.ideaRestoreV21='1';
    hbox.addEventListener('click',()=>setTimeout(()=>{try{const raw=JSON.parse(localStorage.getItem('composition_lab_experiment_history_v1')||'[]');const title=$('randomTemplateName')?.textContent||'';const it=raw.find(x=>title&&String(title).includes(x.title||''));const idea=text(it?.meta?.idea)||text(it?.score?.sm);if(idea&&$('labIdea')){$('labIdea').value=idea;localStorage.setItem(IDEA_KEY,idea)}}catch(_){}},80));
  }

  const techHost=tech.querySelector('.foldcontent');
  if(techHost&&!$('backupTechV21')){
    const sec=document.createElement('div');sec.id='backupTechV21';sec.style.cssText='margin-top:14px;padding-top:12px;border-top:1px solid var(--line,#444)';
    sec.innerHTML='<strong>Backup & Wiederherstellung</strong><div class="toolbar" style="margin-top:8px;margin-bottom:4px"><button type="button" class="secondary smallbtn" id="backupExportV21">Sicherung exportieren</button><button type="button" class="secondary smallbtn" id="backupImportV21">Sicherung importieren</button></div><div class="uploadinfo">Sichert Einstellungen, Kompositionsverlauf und Vorlagenverlauf. Vor einer Wiederherstellung wird der aktuelle Stand intern gesichert.</div>';
    techHost.appendChild(sec);
    $('backupExportV21').onclick=()=>{if(typeof window.compositionLabExportBackup==='function')window.compositionLabExportBackup();else $('exportBackupBtn')?.click();};
    $('backupImportV21').onclick=()=>$('importBackupBtn')?.click();
  }
  ['exportBackupBtn','importBackupBtn','backupFileInput'].forEach(id=>{const e=$(id);if(e&&e.closest('#technicalSection')==null)e.style.display='none';});
  const ch=$('historySection')?.querySelector('summary');if(ch)ch.textContent='Kompositionsverlauf · Stücke wieder laden';

  const inspiration=$('inspirationBtn'), free=$('randomFreeBtn'), guided=$('randomGuidedBtn');
  if(inspiration){inspiration.disabled=false;inspiration.onclick=()=>{try{if(typeof generateInspiration!=='function')throw new Error('Inspiration-Funktion fehlt');generateInspiration();setInfo('Neue Inspiration erzeugt.')}catch(e){setInfo('Inspiration fehlgeschlagen: '+(e?.message||e),true)}};}
  if(free){free.disabled=false;free.onclick=()=>{try{if(typeof generateRandomMusic!=='function')throw new Error('Zufallsfunktion fehlt');generateRandomMusic(false);setInfo('Völliger Zufall erzeugt.')}catch(e){setInfo('Völliger Zufall fehlgeschlagen: '+(e?.message||e),true)}};}
  if(guided){guided.disabled=false;guided.onclick=()=>{try{if(typeof generateRandomMusic!=='function')throw new Error('Zufallsfunktion fehlt');generateRandomMusic(true);setInfo('Zufall mit Eckdaten erzeugt.')}catch(e){setInfo('Zufall mit Eckdaten fehlgeschlagen: '+(e?.message||e),true)}};}
  if(techHost&&!$('webRepairBuildV22')){const d=document.createElement('div');d.id='webRepairBuildV22';d.className='uploadinfo';d.style.marginTop='12px';d.textContent='WebApp Repair V22 · Zufallssteuerung aktiv';techHost.appendChild(d);}
  exp.open=true;
  return true;
}
let n=0;const t=setInterval(()=>{n++;try{if(install()){clearInterval(t);setTimeout(install,500)}}catch(e){}if(n>200)clearInterval(t)},100);
})();
