from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Move Experimentierlabor before Versuche & Verlauf, while keeping it inside the right panel.
start=s.find('  <details class="labbox" id="experimentSection"')
end=s.find('\n\n  <details style="grid-column:1 / -1;" class="foldbox" id="validationSection">', start)
if start!=-1 and end!=-1:
    lab=s[start:end]
    s=s[:start]+s[end:]
    hist=s.find('    <details class="foldbox" id="historySection" open>')
    if hist!=-1:
        # Insert directly before the normal history. Indent outer lab so it visually belongs to right panel.
        lab_in='\n'.join(('    '+line[2:] if line.startswith('  ') else '    '+line) for line in lab.splitlines())
        s=s[:hist]+lab_in+'\n\n'+s[hist:]

# Rename experiment history to clearly be an independent template history and add clear button.
s=s.replace('<summary>Frühere Entwürfe</summary>\n          <div class="foldcontent"><div id="experimentHistoryList">Noch keine Entwürfe vorhanden.</div></div>',
'''<summary>Vorlagen-Verlauf (unabhängig gespeichert)</summary>
          <div class="foldcontent">
            <div class="toolbar" style="margin-top:0"><button type="button" class="secondary smallbtn" id="clearExperimentHistoryBtn">Vorlagen-Verlauf leeren</button></div>
            <div id="experimentHistoryList">Noch keine Vorlagen vorhanden.</div>
          </div>''')

# Upgrade history helpers: use template wording, restore settings/prompt when loading, and allow clearing.
s=s.replace('if(!h.length){box.textContent="Noch keine Entwürfe vorhanden.";return;}', 'if(!h.length){box.textContent="Noch keine Vorlagen vorhanden.";return;}')
old="""d.querySelector('[data-u]').onclick=()=>{uploadedScore=JSON.parse(JSON.stringify(it.score));uploadedName=(it.title||\"Entwurf\")+\".mid\";const n=(uploadedScore.tr||[]).reduce((a,t)=>a+(t.nt?.length||0),0);$(\"uploadInfo\").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;$(\"prompt\").value=\"\";$(\"experimentSection\").open=false;saveCurrentState();};"""
new="""d.querySelector('[data-u]').onclick=()=>{uploadedScore=JSON.parse(JSON.stringify(it.score));uploadedName=(it.title||\"Vorlage\")+\".mid\";applyTemplateToComposition(uploadedScore,it.meta||{});const n=(uploadedScore.tr||[]).reduce((a,t)=>a+(t.nt?.length||0),0);$(\"uploadInfo\").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;$(\"experimentSection\").open=false;saveCurrentState();$(\"status\").innerHTML=`<span class=\"ok\">Vorlage „${esc(it.title||\"Vorlage\")}“ mit ihren Einstellungen und einem editierbaren Kompositionsauftrag übernommen.</span>`;};"""
s=s.replace(old,new)
old2='function addHist(score,kind){if(!score)return;let h=hist();h.unshift({id:Date.now()+Math.random(),time:new Date().toLocaleString(),kind:kind||"Entwurf",title:score.ti||"Entwurf",score:JSON.parse(JSON.stringify(score))});localStorage.setItem(EXPERIMENT_HISTORY_ID,JSON.stringify(h.slice(0,20)));renderHist();}'
new2='function addHist(score,kind,meta={}){if(!score)return;let h=hist();h.unshift({id:Date.now()+Math.random(),time:new Date().toLocaleString(),kind:kind||"Vorlage",title:score.ti||"Vorlage",score:JSON.parse(JSON.stringify(score)),meta:{...meta}});localStorage.setItem(EXPERIMENT_HISTORY_ID,JSON.stringify(h.slice(0,20)));renderHist();}'
s=s.replace(old2,new2)

# Shared adoption helper: copy template musical settings into visible fields and create a useful editable prompt.
marker='  function hist(){try{return JSON.parse(localStorage.getItem(EXPERIMENT_HISTORY_ID)||"[]")}catch(_){return[]}}'
helper='''  function templateMeasures(score){const n=Number(score?.ts?.n)||4,d=Number(score?.ts?.d)||4,bpmBeats=n*4/d;let max=0;(score?.tr||[]).forEach(t=>(t.nt||[]).forEach(x=>{max=Math.max(max,(Number(x[0])||0)+(Number(x[1])||0));}));return Math.max(1,Math.round(max/bpmBeats));}
  function templateEnsemble(score,fallback=""){const names=(score?.tr||[]).map(t=>String(t.nm||"").trim()).filter(Boolean);return names.length?names.join(" + "):fallback;}
  function applyTemplateToComposition(score,meta={}){if(!score)return;const meter=`${Number(score.ts?.n)||4}/${Number(score.ts?.d)||4}`;const ensemble=meta.ensemble||templateEnsemble(score,$("ensemble").value||"Piano solo");$("measures").value=meta.targetMeasures||templateMeasures(score);$("meter").value=meter;$("tempo").value=Number(score.bpm)||96;$("musicalKey").value=score.k||"C major";$("ensemble").value=ensemble;const idea=String(score.sm||"").trim();$("prompt").value=`Entwickle die übernommene Vorlage „${score.ti||"Vorlage"}“ zu einer eigenständigen Komposition weiter. Bewahre ihren erkennbaren musikalischen Grundgedanken, entwickle und variiere ihn schlüssig und forme daraus einen überzeugenden Spannungsbogen.${idea?` Ausgangsidee der Vorlage: ${idea}`:""}`;}
'''
if marker in s and 'function applyTemplateToComposition' not in s:
    s=s.replace(marker, helper+marker)

# Clear button for independent template history.
needle='  renderHist();\n  const oldInstall=installGeneratedScore;'
repl='''  renderHist();
  if($("clearExperimentHistoryBtn"))$("clearExperimentHistoryBtn").onclick=()=>{if(confirm("Vorlagen-Verlauf wirklich leeren?")){localStorage.removeItem(EXPERIMENT_HISTORY_ID);renderHist();}};
  const oldInstall=installGeneratedScore;'''
s=s.replace(needle,repl)

# Store useful metadata for local experiments and AI templates.
s=s.replace('addHist(score,"Lokales Experiment");', 'addHist(score,"Lokale Vorlage",{ensemble:$("ensemble")?.value||""});')
s=s.replace('addHist(uploadedScore,"KI-Entwurf")', 'addHist(uploadedScore,"KI-Vorlage",{ensemble:$("labInstrumentCombo")?.value||$("ensemble")?.value||""})')

# Replace current direct template adoption with field + prompt transfer.
old3='''    $("uploadInfo").textContent = `Geladen: ${uploadedName} (${count} Noten) · aus Experimentierlabor`;
    $("prompt").value = "";
    saveCurrentState();'''
new3='''    $("uploadInfo").textContent = `Geladen: ${uploadedName} (${count} Noten) · aus Experimentierlabor`;
    if(typeof applyTemplateToComposition === "function") applyTemplateToComposition(uploadedScore,{ensemble:$("labInstrumentCombo")?.value||""});
    saveCurrentState();'''
s=s.replace(old3,new3)

p.write_text(s,encoding='utf-8')
