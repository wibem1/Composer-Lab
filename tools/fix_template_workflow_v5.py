from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1. Make template history visibly open by default.
s=s.replace('<details class="foldbox" id="experimentHistorySection">\n            <summary>Vorlagen-Verlauf (unabhängig gespeichert)</summary>', '<details class="foldbox" id="experimentHistorySection" open>\n            <summary>Vorlagen-Verlauf (unabhängig gespeichert)</summary>')

# 2. Preserve the actual random compositional impulse in the template summary.
s=s.replace('score.sm = score.sm || `KI-Ausgangsvorlage · ${ensemble} · ${meter} · ${bpm} BPM · ${key}`;', 'score.sm = score.sm || `KI-Ausgangsvorlage · ${ensemble} · ${meter} · ${bpm} BPM · ${key}. Kompositorische Idee: ${seed}`;')

# 3. Immediately store every freshly generated KI template in the independent template history.
needle='''      setTemplateStatus("KI-Vorlage bereit.");\n      $("status").innerHTML = `<span class="ok">KI-Vorlage „${esc(score.ti)}“ erzeugt.</span>`;'''
repl='''      setTemplateStatus("KI-Vorlage bereit.");\n      if(typeof window.compositionLabAddTemplateHistory === "function") {\n        window.compositionLabAddTemplateHistory(score, "KI-Vorlage", {ensemble, idea: score.sm || seed});\n      }\n      $("status").innerHTML = `<span class="ok">KI-Vorlage „${esc(score.ti)}“ erzeugt und im Vorlagen-Verlauf gespeichert.</span>`;'''
if needle in s:
    s=s.replace(needle,repl,1)

# 4. Replace the direct template-use function: copy values + idea, never touch fold state.
old='''  function useTemplate(){\n    if(!randomTemplateScore) return;\n    uploadedScore = JSON.parse(JSON.stringify(randomTemplateScore));\n    uploadedName = randomTemplateFileName || `${randomTemplateScore.ti}.mid`;\n    const count = (uploadedScore.tr || []).reduce((sum,t) => sum + (t.nt?.length || 0), 0);\n    $("uploadInfo").textContent = `Geladen: ${uploadedName} (${count} Noten) · aus Experimentierlabor`;\n    $("prompt").value = "";\n    saveCurrentState();\n    if($("experimentSection")) $("experimentSection").open = false;\n    $("status").innerHTML = `<span class="ok">„${esc(randomTemplateScore.ti)}“ wurde als Vorlage in die eigentliche Komposition übernommen.</span>`;\n  }'''
new='''  function useTemplate(){\n    if(!randomTemplateScore) return;\n    uploadedScore = JSON.parse(JSON.stringify(randomTemplateScore));\n    uploadedName = randomTemplateFileName || `${randomTemplateScore.ti}.mid`;\n    const count = (uploadedScore.tr || []).reduce((sum,t) => sum + (t.nt?.length || 0), 0);\n    if(typeof window.compositionLabApplyTemplate === "function") {\n      window.compositionLabApplyTemplate(uploadedScore, {ensemble: $("labInstrumentCombo")?.value || "", idea: uploadedScore.sm || ""});\n    }\n    $("uploadInfo").textContent = `Geladen: ${uploadedName} (${count} Noten) · aus Experimentierlabor`;\n    saveCurrentState();\n    $("status").innerHTML = `<span class="ok">„${esc(randomTemplateScore.ti)}“ wurde mit Einstellungen und Kompositionsidee übernommen.</span>`;\n  }'''
if old in s:
    s=s.replace(old,new,1)

# 5. Replace enhancement helpers so history-use also copies everything and never closes lab.
old_apply='''  function applyTemplateToComposition(score,meta={}){if(!score)return;const meter=`${Number(score.ts?.n)||4}/${Number(score.ts?.d)||4}`;const ensemble=meta.ensemble||templateEnsemble(score,$("ensemble").value||"Piano solo");$("measures").value=meta.targetMeasures||templateMeasures(score);$("meter").value=meter;$("tempo").value=Number(score.bpm)||96;$("musicalKey").value=score.k||"C major";$("ensemble").value=ensemble;const idea=String(score.sm||"").trim();$("prompt").value=`Entwickle die übernommene Vorlage „${score.ti||"Vorlage"}“ zu einer eigenständigen Komposition weiter. Bewahre ihren erkennbaren musikalischen Grundgedanken, entwickle und variiere ihn schlüssig und forme daraus einen überzeugenden Spannungsbogen.${idea?` Ausgangsidee der Vorlage: ${idea}`:""}`;}'''
new_apply='''  function applyTemplateToComposition(score,meta={}){if(!score)return;const meter=`${Number(score.ts?.n)||4}/${Number(score.ts?.d)||4}`;const ensemble=meta.ensemble||templateEnsemble(score,$("ensemble").value||"Piano solo");$("measures").value=meta.targetMeasures||templateMeasures(score);$("meter").value=meter;$("tempo").value=Number(score.bpm)||96;$("musicalKey").value=score.k||"C major";$("ensemble").value=ensemble;const idea=String(meta.idea||score.sm||"").trim();$("prompt").value=idea ? `Vorlage: ${score.ti||"Vorlage"}. ${idea}\n\nEntwickle diese musikalische Idee weiter. Bewahre ihren erkennbaren Grundgedanken, variiere und entwickle ihn schlüssig und forme daraus einen überzeugenden Spannungsbogen.` : `Entwickle die übernommene Vorlage „${score.ti||"Vorlage"}“ zu einer eigenständigen Komposition weiter. Bewahre ihren erkennbaren musikalischen Grundgedanken und entwickle ihn schlüssig.`;saveCurrentState();}\n  window.compositionLabApplyTemplate=applyTemplateToComposition;'''
if old_apply in s:
    s=s.replace(old_apply,new_apply,1)

s=s.replace('''$("uploadInfo").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;$("experimentSection").open=false;saveCurrentState();$("status")''','''$("uploadInfo").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;saveCurrentState();$("status")''')

# 6. Expose history insertion to the template generator and avoid duplicate insert-on-use listener.
s=s.replace('''  function addHist(score,kind,meta={}){if(!score)return;let h=hist();h.unshift({id:Date.now()+Math.random(),time:new Date().toLocaleString(),kind:kind||"Vorlage",title:score.ti||"Vorlage",score:JSON.parse(JSON.stringify(score)),meta:{...meta}});localStorage.setItem(EXPERIMENT_HISTORY_ID,JSON.stringify(h.slice(0,20)));renderHist();}\n  renderHist();''','''  function addHist(score,kind,meta={}){if(!score)return;let h=hist();h.unshift({id:Date.now()+Math.random(),time:new Date().toLocaleString(),kind:kind||"Vorlage",title:score.ti||"Vorlage",score:JSON.parse(JSON.stringify(score)),meta:{...meta}});localStorage.setItem(EXPERIMENT_HISTORY_ID,JSON.stringify(h.slice(0,20)));renderHist();}\n  window.compositionLabAddTemplateHistory=addHist;\n  renderHist();''')
s=s.replace('''  if($("templateUseBtn"))$("templateUseBtn").addEventListener("click",()=>setTimeout(()=>{if(uploadedScore)addHist(uploadedScore,"KI-Vorlage",{ensemble:$("labInstrumentCombo")?.value||$("ensemble")?.value||""})},0));\n''','')

p.write_text(s,encoding='utf-8')
