from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Robust fold-state persistence in the app's central settings object.
save_marker='    localStorage.setItem(STORAGE_ID, JSON.stringify(data));\n  } catch(_) {}\n}\n\nfunction initApp(){'
if save_marker in s and 'data.foldStates = {};' not in s:
    s=s.replace(save_marker,'''    data.foldStates = {};
    document.querySelectorAll("details[id]").forEach(el => { data.foldStates[el.id] = !!el.open; });
    localStorage.setItem(STORAGE_ID, JSON.stringify(data));
  } catch(_) {}
}

function initApp(){''',1)

init_marker='  syncUIForProvider(p);\n  renderHistory();\n}\n'
if init_marker in s and 'if(data.foldStates && typeof data.foldStates === "object")' not in s:
    s=s.replace(init_marker,'''  if(data.foldStates && typeof data.foldStates === "object"){
    document.querySelectorAll("details[id]").forEach(el => {
      if(Object.prototype.hasOwnProperty.call(data.foldStates, el.id)) el.open = !!data.foldStates[el.id];
    });
  }
  syncUIForProvider(p);
  renderHistory();
}
''',1)

listener='$("rememberApiKey").addEventListener("change", saveCurrentState);\n'
fold_listener='document.querySelectorAll("details[id]").forEach(el => el.addEventListener("toggle", saveCurrentState));\n'
if listener in s and fold_listener not in s:
    s=s.replace(listener,listener+fold_listener,1)

# Direct template handoff: make the template the actual main-player score as well as upload material.
direct_old='    mainPlayerScore = uploadedScore;\n    if($("mainPlayerTitle")) $("mainPlayerTitle").textContent = `Vorlage: ${randomTemplateScore.ti || "Vorlage"}`;'
direct_new='    mainPlayerScore = uploadedScore;\n    lastScore = uploadedScore;\n    lastMidiBytes = buildMidi(uploadedScore);\n    if($("mainPlayerTitle")) $("mainPlayerTitle").textContent = `Vorlage: ${randomTemplateScore.ti || "Vorlage"}`;'
if direct_old in s:
    s=s.replace(direct_old,direct_new,1)

hist_old='applyTemplateToComposition(uploadedScore,it.meta||{});mainPlayerScore=uploadedScore;if($("mainPlayerTitle"))'
hist_new='applyTemplateToComposition(uploadedScore,it.meta||{});mainPlayerScore=uploadedScore;lastScore=uploadedScore;lastMidiBytes=buildMidi(uploadedScore);if($("mainPlayerTitle"))'
if hist_old in s:
    s=s.replace(hist_old,hist_new,1)

s=s.replace('playGMScore(mainPlayerScore || lastScore || uploadedScore)','playGMScore(mainPlayerScore || uploadedScore || lastScore)')
s=s.replace('bindSeek("playerSeek",()=>mainPlayerScore || lastScore || uploadedScore);','bindSeek("playerSeek",()=>mainPlayerScore || uploadedScore || lastScore);')

# Tempo + Charakter/Stil controls for the Experimentierlabor.
if 'id="labTempo"' not in s:
    marker='''          <div class="uploadinfo" style="margin-bottom:9px;">Länge der experimentellen Vorlage. Sie ist vollständig unabhängig von der oben eingestellten Länge des fertigen Stücks.</div>
          <label for="labEnsemble">Besetzung / Instrumente</label>'''
    repl='''          <div class="uploadinfo" style="margin-bottom:9px;">Länge der experimentellen Vorlage. Sie ist vollständig unabhängig von der oben eingestellten Länge des fertigen Stücks.</div>
          <label for="labTempo">Tempo (BPM)</label>
          <input id="labTempo" type="number" min="20" max="300" value="96" placeholder="z. B. 90">
          <div class="uploadinfo" style="margin-bottom:9px;">Tempo der experimentellen Vorlage.</div>
          <label for="labEnsemble">Besetzung / Instrumente</label>'''
    if marker in s: s=s.replace(marker,repl,1)

if 'id="labStyle"' not in s:
    marker='''          <div class="uploadinfo" style="margin-bottom:9px;">Besetzung frei eingeben. Die KI verwendet diese Angabe für die experimentelle Vorlage.</div>
          <div class="labbuttons">'''
    repl='''          <div class="uploadinfo" style="margin-bottom:9px;">Besetzung frei eingeben. Die KI verwendet diese Angabe für die experimentelle Vorlage.</div>
          <label for="labStyle">Charakter / Stil</label>
          <input id="labStyle" value="" placeholder="z. B. klassisch, modern, romantisch, experimentell, ruhig und geheimnisvoll">
          <div class="uploadinfo" style="margin-bottom:9px;">Freie ästhetische Vorgabe für die Vorlage. Tonart, Taktart, Motivik und Harmonik darf die KI weiterhin selbst gestalten.</div>
          <div class="labbuttons">'''
    if marker in s: s=s.replace(marker,repl,1)

old='''      prompt: $("prompt").value,
      templateLength: $("templateLength").value
'''
new='''      prompt: $("prompt").value,
      templateLength: $("templateLength").value,
      labTempo: $("labTempo")?.value || "96",
      labEnsemble: $("labEnsemble")?.value || "",
      labStyle: $("labStyle")?.value || ""
'''
if old in s: s=s.replace(old,new,1)

restore='''    if(data.form.templateLength !== undefined && ["2","4","8"].includes(String(data.form.templateLength))) $("templateLength").value = String(data.form.templateLength);
'''
restore_new='''    if(data.form.templateLength !== undefined && ["2","4","8"].includes(String(data.form.templateLength))) $("templateLength").value = String(data.form.templateLength);
    if(data.form.labTempo !== undefined && $("labTempo")) $("labTempo").value = data.form.labTempo;
    if(data.form.labEnsemble !== undefined && $("labEnsemble")) $("labEnsemble").value = data.form.labEnsemble;
    if(data.form.labStyle !== undefined && $("labStyle")) $("labStyle").value = data.form.labStyle;
'''
if restore in s and 'data.form.labTempo' not in s: s=s.replace(restore,restore_new,1)

s=s.replace('"ensemble", "prompt", "templateLength"].forEach(id => {','"ensemble", "prompt", "templateLength", "labTempo", "labEnsemble", "labStyle"].forEach(id => {')

# AI-template generation: tempo is binding; character/style is a soft aesthetic instruction.
old='''      const meter = $("meter").value || "4/4";
      const bpm = Math.max(20, Math.min(300, parseInt($("tempo").value,10) || 96));
      const key = $("musicalKey").value || "C major";
      const ensemble = $("labEnsemble")?.value.trim() || $("ensemble").value || "Piano solo";
      const seed = `${pick(seedMotifs)}; Charakter: ${pick(seedChars)}; ${pick(seedDevelopments)}.`;
'''
new='''      const bpm = Math.max(20, Math.min(300, parseInt($("labTempo")?.value,10) || 96));
      const ensemble = $("labEnsemble")?.value.trim() || $("ensemble").value || "Piano solo";
      const style = $("labStyle")?.value.trim() || "frei";
      const seed = `${pick(seedMotifs)}; Charakter: ${pick(seedChars)}; ${pick(seedDevelopments)}.`;
'''
if old in s: s=s.replace(old,new,1)

# Exact escaped-JS prompt replacement. Tonart/Taktart must be chosen by the AI.
s=s.replace(
    '- Länge: ${measures} Takte\\n- Taktart: ${meter}\\n- Tempo: ${bpm} BPM\\n- Tonart: ${key}\\n- Zufälliger kompositorischer Impuls: ${seed}',
    '- Länge: ${measures} Takte\\n- Tempo: ${bpm} BPM (verbindlich)\\n- Charakter / Stil: ${style}\\n- Taktart und Tonart: von dir frei passend zur musikalischen Idee zu wählen\\n- Zufälliger kompositorischer Impuls: ${seed}'
)

old='''      score.bpm = Number(score.bpm) || bpm;
      score.k = score.k || key;
      score.ti = String(score.ti || "KI-Vorlage").trim();
      score.sm = score.sm || `KI-Ausgangsvorlage · ${ensemble} · ${meter} · ${bpm} BPM · ${key}. Kompositorische Idee: ${seed}`;
'''
new='''      score.bpm = bpm;
      score.k = score.k || "C major";
      score.ti = String(score.ti || "KI-Vorlage").trim();
      score.sm = score.sm || `KI-Ausgangsvorlage · ${ensemble} · ${bpm} BPM · Charakter/Stil: ${style}. Kompositorische Idee: ${seed}`;
'''
if old in s: s=s.replace(old,new,1)

old='''      const meterFile = String(score.ts?.n || meter.split('/')[0]) + "-" + String(score.ts?.d || meter.split('/')[1]);
'''
new='''      const meterFile = String(score.ts?.n || 4) + "-" + String(score.ts?.d || 4);
'''
if old in s: s=s.replace(old,new,1)

old='''          ensemble, idea: score.sm || seed, measures, meter, bpm: score.bpm || bpm, key: score.k || key
'''
new='''          ensemble, style, idea: score.sm || seed, measures, meter: `${score.ts?.n || 4}/${score.ts?.d || 4}`, bpm, key: score.k || "C major"
'''
if old in s: s=s.replace(old,new,1)

old='''        ensemble: $("labEnsemble")?.value.trim() || "",
        idea: uploadedScore.sm || ""
'''
new='''        ensemble: $("labEnsemble")?.value.trim() || "",
        style: $("labStyle")?.value.trim() || "",
        idea: uploadedScore.sm || ""
'''
if old in s: s=s.replace(old,new,1)

old='''  try{const d=getStoredData();if(d.form?.labEnsemble&&$("labEnsemble"))$("labEnsemble").value=d.form.labEnsemble;}catch(_){}
  function saveLabPrefs(){try{const d=getStoredData();d.form=d.form||{};d.form.labEnsemble=$("labEnsemble")?.value||"";localStorage.setItem(STORAGE_ID,JSON.stringify(d));}catch(_){}}
  if($("labEnsemble"))$("labEnsemble").addEventListener("input",saveLabPrefs);
'''
new='''  try{const d=getStoredData();if(d.form?.labEnsemble&&$("labEnsemble"))$("labEnsemble").value=d.form.labEnsemble;if(d.form?.labTempo&&$("labTempo"))$("labTempo").value=d.form.labTempo;if(d.form?.labStyle&&$("labStyle"))$("labStyle").value=d.form.labStyle;}catch(_){}
  function saveLabPrefs(){try{const d=getStoredData();d.form=d.form||{};d.form.labEnsemble=$("labEnsemble")?.value||"";d.form.labTempo=$("labTempo")?.value||"96";d.form.labStyle=$("labStyle")?.value||"";localStorage.setItem(STORAGE_ID,JSON.stringify(d));}catch(_){}}
  ["labEnsemble","labTempo","labStyle"].forEach(id=>{if($(id))$(id).addEventListener("input",saveLabPrefs);});
'''
if old in s: s=s.replace(old,new,1)

old='''const idea=m.idea||it.score?.sm||"";d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)} · ${esc(ens)} · ${esc(ts)} · ${esc(bpm)} BPM${key?" · "+esc(key):""}</div>'''
new='''const idea=m.idea||it.score?.sm||"";const style=m.style||"";d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)} · ${esc(ens)} · ${esc(ts)} · ${esc(bpm)} BPM${key?" · "+esc(key):""}${style?" · "+esc(style):""}</div>'''
if old in s: s=s.replace(old,new,1)

s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=8")','navigator.serviceWorker.register("./service-worker.js?v=9")')
s=s.replace('navigator.serviceWorker.register("./service-worker.js")','navigator.serviceWorker.register("./service-worker.js?v=9")')

p.write_text(s,encoding='utf-8')
