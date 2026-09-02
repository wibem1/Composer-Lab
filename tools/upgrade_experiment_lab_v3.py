from pathlib import Path
p=Path('index.html')
s=p.read_text()

# 1) Add seek bars to both players.
s=s.replace('<span class="playerstatus" id="playerStatus">GM-Player bereit.</span>', '<span class="playerstatus" id="playerStatus">GM-Player bereit.</span>\n      <div style="flex-basis:100%;height:0"></div>\n      <input id="playerSeek" type="range" min="0" max="1000" value="0" step="1" style="flex:1 1 260px;">\n      <span class="playerstatus" id="playerTime">0:00 / 0:00</span>')
s=s.replace('<span class="playerstatus" id="templatePlayerStatus">KI-Vorlage bereit.</span>', '<span class="playerstatus" id="templatePlayerStatus">KI-Vorlage bereit.</span>\n          <div style="flex-basis:100%;height:0"></div>\n          <input id="templateSeek" type="range" min="0" max="1000" value="0" step="1" style="flex:1 1 260px;">\n          <span class="playerstatus" id="templateTime">0:00 / 0:00</span>')

# 2) Add lab controls/history UI after template length.
needle='''        <div class="uploadinfo" style="margin-bottom:9px;">Nur die Länge der Vorlage. Die oben eingestellte Taktzahl bestimmt weiterhin die Länge des fertigen Stücks.</div>'''
insert='''        <div class="uploadinfo" style="margin-bottom:9px;">Nur die Länge der Vorlage. Die oben eingestellte Taktzahl bestimmt weiterhin die Länge des fertigen Stücks.</div>\n        <div class="row">\n          <div>\n            <label for="labInstrumentCount">Anzahl Instrumente</label>\n            <select id="labInstrumentCount">\n              <option value="1">1 Instrument</option>\n              <option value="2" selected>2 Instrumente</option>\n              <option value="3">3 Instrumente</option>\n              <option value="4">4 Instrumente</option>\n            </select>\n          </div>\n          <div>\n            <label for="labInstrumentCombo">Instrumentenkombination</label>\n            <select id="labInstrumentCombo"></select>\n          </div>\n        </div>'''
s=s.replace(needle,insert)
needle2='''        <div class="uploadinfo" id="experimentInfo">'''
s=s.replace(needle2,'''        <details class="foldbox" id="experimentHistorySection">\n          <summary>Frühere Entwürfe</summary>\n          <div class="foldcontent"><div id="experimentHistoryList">Noch keine Entwürfe vorhanden.</div></div>\n        </details>\n        <div class="uploadinfo" id="experimentInfo">''',1)

# 3) Move technical analysis out of right panel and place after experiment lab.
val='''    <details class="foldbox" id="validationSection">\n      <summary>Technische Analyse & Validierung</summary>\n      <div class="foldcontent">\n        <pre id="validation">Noch keine Komposition geprüft.</pre>\n      </div>\n    </details>\n'''
s=s.replace(val,'')
lab_end='''  </details>\n\n  <details style="grid-column:1 / -1;" class="foldbox" id="technicalSection">'''
replacement='''  </details>\n\n  <details style="grid-column:1 / -1;" class="foldbox" id="validationSection">\n    <summary>Technische Analyse &amp; Validierung</summary>\n    <div class="foldcontent"><pre id="validation">Noch keine Komposition geprüft.</pre></div>\n  </details>\n\n  <details style="grid-column:1 / -1;" class="foldbox" id="technicalSection">'''
s=s.replace(lab_end,replacement)

# 4) Add lab history storage constant.
s=s.replace('const HISTORY_ID = "ai_midi_composer_history_v37";','const HISTORY_ID = "ai_midi_composer_history_v37";\nconst EXPERIMENT_HISTORY_ID = "composition_lab_experiment_history_v1";')

# 5) Append robust enhancement script before closing body.
addon=r'''
<script id="experiment-lab-v3-enhancements">
(() => {
  const comboMap = {
    "1": ["Klavier solo","Violine solo","Cello solo","Flöte solo","Klarinette solo"],
    "2": ["Violine und Klavier","Cello und Klavier","Klarinette und Klavier","Flöte und Klavier","Flöte und Cello","Violine und Cello"],
    "3": ["Streichtrio","Klaviertrio (Violine, Cello, Klavier)","Flöte, Klarinette und Klavier"],
    "4": ["Streichquartett","Klavierquartett (Violine, Viola, Cello, Klavier)","Flöte, Klarinette, Cello und Klavier"]
  };
  function syncCombos(){
    const c=$("labInstrumentCount"), sel=$("labInstrumentCombo"); if(!c||!sel) return;
    const old=sel.value; sel.innerHTML="";
    (comboMap[c.value]||[]).forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;sel.appendChild(o)});
    if([...sel.options].some(o=>o.value===old)) sel.value=old;
  }
  if($("labInstrumentCount")){ $("labInstrumentCount").onchange=()=>{syncCombos();saveCurrentState();}; syncCombos(); }
  if($("labInstrumentCombo")) $("labInstrumentCombo").onchange=saveCurrentState;

  const oldSave=saveCurrentState;
  saveCurrentState=function(){ oldSave(); try{const d=getStoredData(); d.form=d.form||{}; d.form.labInstrumentCount=$("labInstrumentCount")?.value||"2"; d.form.labInstrumentCombo=$("labInstrumentCombo")?.value||""; localStorage.setItem(STORAGE_ID,JSON.stringify(d));}catch(_){}};
  const oldInit=initApp;
  initApp=function(){ oldInit(); try{const d=getStoredData(); if(d.form?.labInstrumentCount && $("labInstrumentCount")) $("labInstrumentCount").value=d.form.labInstrumentCount; syncCombos(); if(d.form?.labInstrumentCombo && $("labInstrumentCombo") && [...$("labInstrumentCombo").options].some(o=>o.value===d.form.labInstrumentCombo)) $("labInstrumentCombo").value=d.form.labInstrumentCombo;}catch(_){} renderExperimentHistory(); };

  function expHistory(){ try{return JSON.parse(localStorage.getItem(EXPERIMENT_HISTORY_ID)||"[]")}catch(_){return[]} }
  function addExperimentHistory(score, kind){
    if(!score) return; let h=expHistory(); h.unshift({id:Date.now()+Math.random(),time:new Date().toLocaleString(),kind:kind||"Entwurf",title:score.ti||"Entwurf",score:JSON.parse(JSON.stringify(score))}); h=h.slice(0,20); localStorage.setItem(EXPERIMENT_HISTORY_ID,JSON.stringify(h)); renderExperimentHistory();
  }
  function renderExperimentHistory(){
    const box=$("experimentHistoryList"); if(!box) return; const h=expHistory(); if(!h.length){box.textContent="Noch keine Entwürfe vorhanden.";return;} box.innerHTML="";
    h.forEach(it=>{const d=document.createElement("div");d.className="historyitem";d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)}</div><div class="historyactions"><button class="secondary smallbtn" data-p>▶ Anhören</button><button class="secondary smallbtn" data-u>Als Vorlage übernehmen</button></div>`; d.querySelector('[data-p]').onclick=()=>playGMScore(it.score,0).catch(()=>{}); d.querySelector('[data-u]').onclick=()=>{uploadedScore=JSON.parse(JSON.stringify(it.score));uploadedName=(it.title||"Entwurf")+".mid";const n=(uploadedScore.tr||[]).reduce((a,t)=>a+(t.nt?.length||0),0);$("uploadInfo").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;$("prompt").value="";$("experimentSection").open=false;saveCurrentState();}; box.appendChild(d);});
  }
  window.addExperimentHistory=addExperimentHistory;

  // Capture local experiments in their own history instead of the main composition history.
  const oldInstall=installGeneratedScore;
  installGeneratedScore=function(score,label){ oldInstall(score,label); addExperimentHistory(score,"Lokales Experiment"); };

  // Shared seekable player.
  let seekScore=null, seekStartBeat=0, seekBaseTime=0, seekRAF=0;
  const oldStop=stopGMPlayback;
  stopGMPlayback=function(update=true){ if(seekRAF) cancelAnimationFrame(seekRAF); seekRAF=0; oldStop(update); };
  const basePlay=playGMScore;
  playGMScore=async function(score,startBeat=0){
    if(!score) return; seekScore=score; seekStartBeat=Math.max(0,startBeat||0);
    const max=scoreMaxBeat(score); const bpm=Math.max(20,Math.min(300,Number(score.bpm)||96)); const secPerBeat=60/bpm;
    const ac=ensurePlayerAudio(); if(ac.state==='suspended') await ac.resume(); stopGMPlayback(false);
    $("playerStatus") && ($("playerStatus").textContent="GM-Klänge werden geladen …");
    const used=[],seen=new Set(); for(const t of score.tr||[]){const ch=Math.max(0,Math.min(15,Number(t.ch)||0)),pg=Math.max(0,Math.min(127,Number(t.pg)||0)),k=ch===9?'drums':String(pg);if(!seen.has(k)){seen.add(k);used.push([pg,ch])}}
    await Promise.all(used.map(([pg,ch])=>loadGMInstrument(pg,ch)));
    const base=ac.currentTime+0.08; seekBaseTime=base;
    for(const t of score.tr||[]){const ch=Math.max(0,Math.min(15,Number(t.ch)||0)),pg=Math.max(0,Math.min(127,Number(t.pg)||0)),inst=await loadGMInstrument(pg,ch); for(const n of t.nt||[]){const st=Number(n[0])||0,d=Math.max(.02,Number(n[1])||.25),g=n.length>5?Math.max(.05,Math.min(4,Number(n[5])||.95)):.95,en=st+d*g;if(en<=seekStartBeat)continue;const p=Math.max(0,Math.min(127,Math.round(Number(n[2])||60))),v=Math.max(1,Math.min(127,Number(n[3])||80));const rel=Math.max(0,st-seekStartBeat);try{inst.play(p,base+rel*secPerBeat,{duration:Math.max(.03,(en-Math.max(st,seekStartBeat))*secPerBeat),gain:Math.max(.02,Math.min(1,v/127))})}catch(_){}}}
    playerPlaying=true;playerPaused=false;
    const fmt=x=>{x=Math.max(0,Math.floor(x));return Math.floor(x/60)+":"+String(x%60).padStart(2,'0')};
    function tick(){ if(!playerPlaying)return; const beat=Math.min(max,seekStartBeat+Math.max(0,ac.currentTime-seekBaseTime)*bpm/60); const frac=max?beat/max:0; [[$("playerSeek"),$("playerTime")],[$("templateSeek"),$("templateTime")]].forEach(([r,t])=>{if(r)r.value=String(Math.round(frac*1000));if(t)t.textContent=`${fmt(beat*secPerBeat)} / ${fmt(max*secPerBeat)}`}); if(beat<max) seekRAF=requestAnimationFrame(tick); }
    tick();
  };
  function bindSeek(id, scoreGetter){const r=$(id);if(!r)return;r.onchange=()=>{const sc=scoreGetter();if(!sc)return;const beat=scoreMaxBeat(sc)*(Number(r.value)||0)/1000;playGMScore(sc,beat).catch(()=>{});};}
  bindSeek("playerSeek",()=>lastScore); bindSeek("templateSeek",()=>window.__currentLabTemplateScore||seekScore);

  // Instrument selection should drive AI template generation without changing the main composition fields.
  const originalCallLLM=callLLM;
  callLLM=async function(provider,model,key,system,user,wantJson){
    if(typeof user==='string' && user.includes('Komponiere KEIN fertiges großes Stück') && $("labInstrumentCombo")){
      user=user.replace(/- Besetzung: .*\n/,`- Besetzung: ${$("labInstrumentCombo").value}\n`);
    }
    return originalCallLLM(provider,model,key,system,user,wantJson);
  };

  // Observe the lab template card and retain AI templates once they are created.
  const obsTarget=$("randomTemplateName"); if(obsTarget){new MutationObserver(()=>{const title=obsTarget.textContent||"";if(title && !title.includes('komponiert') && !title.includes('konnte') && seekScore){window.__currentLabTemplateScore=seekScore;}}).observe(obsTarget,{childList:true,subtree:true});}

  // Save transferred/created AI templates when the use button is clicked.
  if($("templateUseBtn")) $("templateUseBtn").addEventListener("click",()=>{if(window.__currentLabTemplateScore)addExperimentHistory(window.__currentLabTemplateScore,"KI-Entwurf")});
})();
</script>
'''
s=s.replace('</body>',addon+'\n</body>')
p.write_text(s)
