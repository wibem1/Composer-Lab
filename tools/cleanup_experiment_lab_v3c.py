from pathlib import Path
import re
p=Path('index.html')
s=p.read_text()

# Remove all previous enhancement script copies; one clean version is added below.
s=re.sub(r'\n?<script id="experiment-lab-v3-enhancements">.*?</script>\n?', '\n', s, flags=re.S)

# Remove duplicated seek controls and reinsert exactly once.
s=re.sub(r'\s*<div style="flex-basis:100%;height:0"></div>\s*<input id="playerSeek"[^>]*>\s*<span class="playerstatus" id="playerTime">.*?</span>', '', s, flags=re.S)
s=s.replace('<span class="playerstatus" id="playerStatus">GM-Player bereit.</span>', '<span class="playerstatus" id="playerStatus">GM-Player bereit.</span>\n      <div style="flex-basis:100%;height:0"></div>\n      <input id="playerSeek" type="range" min="0" max="1000" value="0" step="1" style="flex:1 1 260px;">\n      <span class="playerstatus" id="playerTime">0:00 / 0:00</span>',1)
s=re.sub(r'\s*<div style="flex-basis:100%;height:0"></div>\s*<input id="templateSeek"[^>]*>\s*<span class="playerstatus" id="templateTime">.*?</span>', '', s, flags=re.S)
s=s.replace('<span class="playerstatus" id="templatePlayerStatus">KI-Vorlage bereit.</span>', '<span class="playerstatus" id="templatePlayerStatus">KI-Vorlage bereit.</span>\n          <div style="flex-basis:100%;height:0"></div>\n          <input id="templateSeek" type="range" min="0" max="1000" value="0" step="1" style="flex:1 1 260px;">\n          <span class="playerstatus" id="templateTime">0:00 / 0:00</span>',1)

# Remove all duplicated experiment-history blocks and add one.
s=re.sub(r'\s*<details class="foldbox" id="experimentHistorySection">.*?</details>', '', s, flags=re.S)
s=s.replace('        <div class="uploadinfo" id="experimentInfo">', '        <details class="foldbox" id="experimentHistorySection">\n          <summary>Frühere Entwürfe</summary>\n          <div class="foldcontent"><div id="experimentHistoryList">Noch keine Entwürfe vorhanden.</div></div>\n        </details>\n        <div class="uploadinfo" id="experimentInfo">',1)

# Remove all duplicated instrument-control rows and add one.
s=re.sub(r'\s*<div class="row">\s*<div>\s*<label for="labInstrumentCount">.*?</div>\s*</div>', '', s, flags=re.S)
marker='        <div class="uploadinfo" style="margin-bottom:9px;">Länge der experimentellen Vorlage. Sie ist vollständig unabhängig von der oben eingestellten Länge des fertigen Stücks.</div>'
controls='''\n        <div class="row">\n          <div>\n            <label for="labInstrumentCount">Anzahl Instrumente</label>\n            <select id="labInstrumentCount">\n              <option value="1">1 Instrument</option>\n              <option value="2" selected>2 Instrumente</option>\n              <option value="3">3 Instrumente</option>\n              <option value="4">4 Instrumente</option>\n            </select>\n          </div>\n          <div>\n            <label for="labInstrumentCombo">Instrumentenkombination</label>\n            <select id="labInstrumentCombo"></select>\n          </div>\n        </div>'''
if marker in s: s=s.replace(marker,marker+controls,1)

# Make AI template generation use the lab instrument choice directly.
s=s.replace('const ensemble = $("ensemble").value || "Piano solo";', 'const ensemble = $("labInstrumentCombo")?.value || $("ensemble").value || "Piano solo";')

# Ensure experiment history constant exists once.
s=re.sub(r'(const EXPERIMENT_HISTORY_ID = "composition_lab_experiment_history_v1";\n)+', 'const EXPERIMENT_HISTORY_ID = "composition_lab_experiment_history_v1";\n', s)
if 'const EXPERIMENT_HISTORY_ID' not in s:
    s=s.replace('const HISTORY_ID = "ai_midi_composer_history_v37";', 'const HISTORY_ID = "ai_midi_composer_history_v37";\nconst EXPERIMENT_HISTORY_ID = "composition_lab_experiment_history_v1";')

addon=r'''
<script id="experiment-lab-v3-enhancements">
(() => {
  const comboMap={
    "1":["Klavier solo","Violine solo","Cello solo","Flöte solo","Klarinette solo"],
    "2":["Violine und Klavier","Cello und Klavier","Klarinette und Klavier","Flöte und Klavier","Flöte und Cello","Violine und Cello"],
    "3":["Streichtrio","Klaviertrio (Violine, Cello, Klavier)","Flöte, Klarinette und Klavier"],
    "4":["Streichquartett","Klavierquartett (Violine, Viola, Cello, Klavier)","Flöte, Klarinette, Cello und Klavier"]
  };
  function syncCombos(){const c=$("labInstrumentCount"),sel=$("labInstrumentCombo");if(!c||!sel)return;const old=sel.value;sel.innerHTML="";(comboMap[c.value]||[]).forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;sel.appendChild(o)});if([...sel.options].some(o=>o.value===old))sel.value=old;}
  syncCombos();
  try{const d=getStoredData();if(d.form?.labInstrumentCount&&$("labInstrumentCount"))$("labInstrumentCount").value=d.form.labInstrumentCount;syncCombos();if(d.form?.labInstrumentCombo&&$("labInstrumentCombo")&&[...$("labInstrumentCombo").options].some(o=>o.value===d.form.labInstrumentCombo))$("labInstrumentCombo").value=d.form.labInstrumentCombo;}catch(_){}
  function saveLabPrefs(){try{const d=getStoredData();d.form=d.form||{};d.form.labInstrumentCount=$("labInstrumentCount")?.value||"2";d.form.labInstrumentCombo=$("labInstrumentCombo")?.value||"";localStorage.setItem(STORAGE_ID,JSON.stringify(d));}catch(_){}}
  if($("labInstrumentCount"))$("labInstrumentCount").onchange=()=>{syncCombos();saveLabPrefs();};if($("labInstrumentCombo"))$("labInstrumentCombo").onchange=saveLabPrefs;

  function hist(){try{return JSON.parse(localStorage.getItem(EXPERIMENT_HISTORY_ID)||"[]")}catch(_){return[]}}
  function renderHist(){const box=$("experimentHistoryList");if(!box)return;const h=hist();if(!h.length){box.textContent="Noch keine Entwürfe vorhanden.";return;}box.innerHTML="";h.forEach(it=>{const d=document.createElement("div");d.className="historyitem";d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)}</div><div class="historyactions"><button class="secondary smallbtn" data-p>▶ Anhören</button><button class="secondary smallbtn" data-u>↗ In Komposition übernehmen</button></div>`;d.querySelector('[data-p]').onclick=()=>playGMScore(it.score,0).catch(()=>{});d.querySelector('[data-u]').onclick=()=>{uploadedScore=JSON.parse(JSON.stringify(it.score));uploadedName=(it.title||"Entwurf")+".mid";const n=(uploadedScore.tr||[]).reduce((a,t)=>a+(t.nt?.length||0),0);$("uploadInfo").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;$("prompt").value="";$("experimentSection").open=false;saveCurrentState();};box.appendChild(d);});}
  function addHist(score,kind){if(!score)return;let h=hist();h.unshift({id:Date.now()+Math.random(),time:new Date().toLocaleString(),kind:kind||"Entwurf",title:score.ti||"Entwurf",score:JSON.parse(JSON.stringify(score))});localStorage.setItem(EXPERIMENT_HISTORY_ID,JSON.stringify(h.slice(0,20)));renderHist();}
  renderHist();
  const oldInstall=installGeneratedScore;installGeneratedScore=function(score,label){oldInstall(score,label);addHist(score,"Lokales Experiment");};
  if($("templateUseBtn"))$("templateUseBtn").addEventListener("click",()=>setTimeout(()=>{if(uploadedScore)addHist(uploadedScore,"KI-Entwurf")},0));

  let currentScore=null,startBeat=0,baseTime=0,raf=0;
  const oldStop=stopGMPlayback;stopGMPlayback=function(update=true){if(raf)cancelAnimationFrame(raf);raf=0;oldStop(update);};
  playGMScore=async function(score,fromBeat=0){if(!score||!score.tr?.length)return;currentScore=score;startBeat=Math.max(0,Number(fromBeat)||0);const ac=ensurePlayerAudio();if(ac.state==='suspended')await ac.resume();stopGMPlayback(false);const max=scoreMaxBeat(score),bpm=Math.max(20,Math.min(300,Number(score.bpm)||96)),spb=60/bpm;const used=[],seen=new Set();for(const t of score.tr){const ch=Math.max(0,Math.min(15,Number(t.ch)||0)),pg=Math.max(0,Math.min(127,Number(t.pg)||0)),k=ch===9?'d':String(pg);if(!seen.has(k)){seen.add(k);used.push([pg,ch])}}await Promise.all(used.map(([pg,ch])=>loadGMInstrument(pg,ch)));baseTime=ac.currentTime+.08;for(const t of score.tr){const ch=Math.max(0,Math.min(15,Number(t.ch)||0)),pg=Math.max(0,Math.min(127,Number(t.pg)||0)),inst=await loadGMInstrument(pg,ch);for(const n of t.nt||[]){const st=Number(n[0])||0,d=Math.max(.02,Number(n[1])||.25),g=n.length>5?Math.max(.05,Math.min(4,Number(n[5])||.95)):.95,en=st+d*g;if(en<=startBeat)continue;const p=Math.max(0,Math.min(127,Math.round(Number(n[2])||60))),v=Math.max(1,Math.min(127,Number(n[3])||80)),rel=Math.max(0,st-startBeat);try{inst.play(p,baseTime+rel*spb,{duration:Math.max(.03,(en-Math.max(st,startBeat))*spb),gain:Math.max(.02,Math.min(1,v/127))})}catch(_){}}}playerPlaying=true;playerPaused=false;const fmt=x=>{x=Math.max(0,Math.floor(x));return Math.floor(x/60)+":"+String(x%60).padStart(2,'0')};function tick(){if(!playerPlaying)return;const beat=Math.min(max,startBeat+Math.max(0,ac.currentTime-baseTime)*bpm/60),frac=max?beat/max:0;[[$("playerSeek"),$("playerTime")],[$("templateSeek"),$("templateTime")]].forEach(([r,t])=>{if(r)r.value=String(Math.round(frac*1000));if(t)t.textContent=`${fmt(beat*spb)} / ${fmt(max*spb)}`});if(beat>=max){if(playerLoopEnabled)playGMScore(score,0).catch(()=>{});else{playerPlaying=false;$("playerStatus")&&($("playerStatus").textContent="Wiedergabe beendet.");}return;}raf=requestAnimationFrame(tick)}tick();};
  function bindSeek(id,getScore){const r=$(id);if(!r)return;r.onchange=()=>{const sc=getScore();if(!sc)return;playGMScore(sc,scoreMaxBeat(sc)*(Number(r.value)||0)/1000).catch(()=>{});};}
  bindSeek("playerSeek",()=>lastScore);bindSeek("templateSeek",()=>currentScore);
})();
</script>
'''
s=s.replace('</body>',addon+'\n</body>')
p.write_text(s)
