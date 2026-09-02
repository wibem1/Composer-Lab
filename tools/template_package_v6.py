from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) Add template idea display below current template player and before template history.
needle='''          </div>\n          <details class="foldbox" id="experimentHistorySection" open>\n            <summary>Vorlagen-Verlauf (unabhängig gespeichert)</summary>'''
replacement='''          </div>\n          <div id="templateIdeaBox" class="resultcard" style="display:none;margin-top:10px;">\n            <strong>Kompositionsidee der Vorlage</strong>\n            <div id="templateIdeaText" style="margin-top:6px;white-space:pre-wrap;">Noch keine Kompositionsidee vorhanden.</div>\n          </div>\n          <details class="foldbox" id="experimentHistorySection" open>\n            <summary>Vorlagen-Verlauf (unabhängig gespeichert)</summary>'''
if needle in s and 'id="templateIdeaBox"' not in s:
    s=s.replace(needle,replacement,1)

# 2) Main player gets an explicit active score: template after handoff, composition after successful compose.
needle='''let lastConcept = "";\n\nconst $ = id => document.getElementById(id);'''
replacement='''let lastConcept = "";\nlet mainPlayerScore = null; // Vorlage nach Übernahme, später fertige Komposition\n\nconst $ = id => document.getElementById(id);'''
if needle in s and 'let mainPlayerScore = null' not in s:
    s=s.replace(needle,replacement,1)

s=s.replace('''$("playBtn").addEventListener("click", async () => {\n  try { await playGMScore(lastScore); }''','''$("playBtn").addEventListener("click", async () => {\n  try { await playGMScore(mainPlayerScore || lastScore || uploadedScore); }''',1)

# compose success switches main player to finished composition
needle='''    lastScore = score;\n    lastProvider = provider;'''
replacement='''    lastScore = score;\n    mainPlayerScore = score;\n    lastProvider = provider;'''
if needle in s:
    s=s.replace(needle,replacement,1)

# 3) Template generation: make the compositional idea explicit in task and preserve it.
old='''- Gib ihr einen kurzen, einprägsamen deutschen Titel, der zur musikalischen Idee passt.\\n- Nutze Dynamik und Artikulation sinnvoll.'''
new='''- Gib ihr einen kurzen, einprägsamen deutschen Titel, der zur musikalischen Idee passt.\\n- Schreibe in das Feld "sm" eine prägnante musikalische Kompositionsidee für genau diese Vorlage: charakteristische Motive, Gestus, Rhythmik/Harmonik und mögliche Entwicklungsrichtung. Sie ist Teil der Vorlage und soll später gemeinsam mit MIDI und Einstellungen weiterverwendet werden.\\n- Nutze Dynamik und Artikulation sinnvoll.'''
if old in s:
    s=s.replace(old,new,1)

# show idea and save full metadata when template created
needle='''      setTemplateStatus("KI-Vorlage bereit.");\n      if(typeof window.compositionLabAddTemplateHistory === "function") {\n        window.compositionLabAddTemplateHistory(score, "KI-Vorlage", {ensemble, idea: score.sm || seed});\n      }'''
replacement='''      setTemplateStatus("KI-Vorlage bereit.");\n      if($("templateIdeaBox")) $("templateIdeaBox").style.display = "block";\n      if($("templateIdeaText")) $("templateIdeaText").textContent = score.sm || seed;\n      if(typeof window.compositionLabAddTemplateHistory === "function") {\n        window.compositionLabAddTemplateHistory(score, "KI-Vorlage", {\n          ensemble, idea: score.sm || seed, measures, meter, bpm: score.bpm || bpm, key: score.k || key\n        });\n      }'''
if needle in s:
    s=s.replace(needle,replacement,1)

# 4) Direct template handoff: set main player to template and never collapse lab.
needle='''    $("uploadInfo").textContent = `Geladen: ${uploadedName} (${count} Noten) · aus Experimentierlabor`;\n    saveCurrentState();\n    $("status").innerHTML = `<span class="ok">„${esc(randomTemplateScore.ti)}“ wurde mit Einstellungen und Kompositionsidee übernommen. Das Experimentierlabor bleibt unverändert geöffnet oder geschlossen.</span>`;'''
replacement='''    $("uploadInfo").textContent = `Geladen: ${uploadedName} (${count} Noten) · aus Experimentierlabor`;\n    mainPlayerScore = uploadedScore;\n    if($("playerStatus")) $("playerStatus").textContent = `Vorlage „${randomTemplateScore.ti || "Vorlage"}“ im Hauptplayer bereit.`;\n    saveCurrentState();\n    $("status").innerHTML = `<span class="ok">„${esc(randomTemplateScore.ti)}“ wurde als vollständiges Vorlagenpaket übernommen. Der Hauptplayer spielt jetzt diese Vorlage.</span>`;'''
if needle in s:
    s=s.replace(needle,replacement,1)

# expose current-template loader inside template closure, before event binding
needle='''  $("randomToTemplateBtn").onclick = createTemplate;'''
insert='''  window.compositionLabSetCurrentTemplate = function(pkg){\n    if(!pkg || !pkg.score) return;\n    randomTemplateScore = JSON.parse(JSON.stringify(pkg.score));\n    const meta = pkg.meta || {};\n    randomTemplateFileName = pkg.fileName || `${safeFileName(randomTemplateScore.ti || "Vorlage")}.mid`;\n    $("randomTemplateBox").style.display = "flex";\n    const measures = meta.measures || (typeof window.compositionLabTemplateMeasures === "function" ? window.compositionLabTemplateMeasures(randomTemplateScore) : "");\n    const ensemble = meta.ensemble || (randomTemplateScore.tr || []).map(t=>t.nm).filter(Boolean).join(" + ");\n    $("randomTemplateName").textContent = `${randomTemplateScore.ti || "Vorlage"}${ensemble ? " · "+ensemble : ""}${measures ? " · "+measures+" Takte" : ""} · ${randomTemplateScore.ts?.n || 4}/${randomTemplateScore.ts?.d || 4} · ${randomTemplateScore.bpm || 96} BPM`;\n    if($("templateIdeaBox")) $("templateIdeaBox").style.display = "block";\n    if($("templateIdeaText")) $("templateIdeaText").textContent = meta.idea || randomTemplateScore.sm || "Keine Kompositionsidee gespeichert.";\n    setTemplateStatus("Gespeicherte Vorlage geladen.");\n  };\n\n  $("randomToTemplateBtn").onclick = createTemplate;'''
if needle in s and 'window.compositionLabSetCurrentTemplate' not in s:
    s=s.replace(needle,insert,1)

# 5) Enhancement package semantics.
# expose template measure helper
needle='''  function templateEnsemble(score,fallback=""){'''
replacement='''  window.compositionLabTemplateMeasures = templateMeasures;\n  function templateEnsemble(score,fallback=""){'''
if needle in s and 'compositionLabTemplateMeasures = templateMeasures' not in s:
    s=s.replace(needle,replacement,1)

# apply settings from saved metadata when available
old='''function applyTemplateToComposition(score,meta={}){if(!score)return;const meter=`${Number(score.ts?.n)||4}/${Number(score.ts?.d)||4}`;const ensemble=meta.ensemble||templateEnsemble(score,$("ensemble").value||"Piano solo");$("measures").value=meta.targetMeasures||templateMeasures(score);$("meter").value=meter;$("tempo").value=Number(score.bpm)||96;$("musicalKey").value=score.k||"C major";$("ensemble").value=ensemble;const idea=String(meta.idea||score.sm||"").trim();$("prompt").value=idea ? `Vorlage: ${score.ti||"Vorlage"}. ${idea}\n\nEntwickle diese musikalische Idee weiter. Bewahre ihren erkennbaren Grundgedanken, variiere und entwickle ihn schlüssig und forme daraus einen überzeugenden Spannungsbogen.` : `Entwickle die übernommene Vorlage „${score.ti||"Vorlage"}“ zu einer eigenständigen Komposition weiter. Bewahre ihren erkennbaren musikalischen Grundgedanken und entwickle ihn schlüssig.`;saveCurrentState();}'''
new='''function applyTemplateToComposition(score,meta={}){if(!score)return;const meter=meta.meter||`${Number(score.ts?.n)||4}/${Number(score.ts?.d)||4}`;const ensemble=meta.ensemble||templateEnsemble(score,$("ensemble").value||"Piano solo");$("measures").value=meta.measures||meta.targetMeasures||templateMeasures(score);$("meter").value=meter;$("tempo").value=Number(meta.bpm||score.bpm)||96;$("musicalKey").value=meta.key||score.k||"C major";$("ensemble").value=ensemble;const idea=String(meta.idea||score.sm||"").trim();$("prompt").value=idea||`Entwickle den musikalischen Grundgedanken der Vorlage „${score.ti||"Vorlage"}“ weiter.`;saveCurrentState();}'''
if old in s:
    s=s.replace(old,new,1)

# history render: replay should reload package into current template area; handoff should set main player and not collapse
old='''d.querySelector('[data-p]').onclick=()=>playGMScore(it.score,0).catch(()=>{});d.querySelector('[data-u]').onclick=()=>{uploadedScore=JSON.parse(JSON.stringify(it.score));uploadedName=(it.title||"Vorlage")+".mid";applyTemplateToComposition(uploadedScore,it.meta||{});const n=(uploadedScore.tr||[]).reduce((a,t)=>a+(t.nt?.length||0),0);$("uploadInfo").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;saveCurrentState();$("status").innerHTML=`<span class="ok">Vorlage „${esc(it.title||"Vorlage")}“ mit ihren Einstellungen und einem editierbaren Kompositionsauftrag übernommen.</span>`;};'''
new='''d.querySelector('[data-p]').onclick=()=>{if(typeof window.compositionLabSetCurrentTemplate==="function")window.compositionLabSetCurrentTemplate(it);playGMScore(it.score,0).catch(()=>{});};d.querySelector('[data-u]').onclick=()=>{uploadedScore=JSON.parse(JSON.stringify(it.score));uploadedName=(it.title||"Vorlage")+".mid";applyTemplateToComposition(uploadedScore,it.meta||{});mainPlayerScore=uploadedScore;if(typeof window.compositionLabSetCurrentTemplate==="function")window.compositionLabSetCurrentTemplate(it);const n=(uploadedScore.tr||[]).reduce((a,t)=>a+(t.nt?.length||0),0);$("uploadInfo").textContent=`Vorlage geladen: ${uploadedName} (${n} Noten)`;if($("playerStatus"))$("playerStatus").textContent=`Vorlage „${it.title||"Vorlage"}“ im Hauptplayer bereit.`;saveCurrentState();$("status").innerHTML=`<span class="ok">Vorlagenpaket „${esc(it.title||"Vorlage")}“ vollständig übernommen.</span>`;};'''
if old in s:
    s=s.replace(old,new,1)

# richer history display shows settings + idea
old='''d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)}</div><div class="historyactions"><button class="secondary smallbtn" data-p>▶ Anhören</button><button class="secondary smallbtn" data-u>↗ In Komposition übernehmen</button></div>`;'''
new='''const m=it.meta||{};const ts=m.meter||`${it.score?.ts?.n||4}/${it.score?.ts?.d||4}`;const bpm=m.bpm||it.score?.bpm||96;const key=m.key||it.score?.k||"";const ens=m.ensemble||templateEnsemble(it.score,"");const idea=m.idea||it.score?.sm||"";d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)} · ${esc(ens)} · ${esc(ts)} · ${esc(bpm)} BPM${key?" · "+esc(key):""}</div>${idea?`<div style="margin-top:6px;font-size:12px;white-space:pre-wrap;color:var(--muted);"><strong>Idee:</strong> ${esc(idea)}</div>`:""}<div class="historyactions"><button class="secondary smallbtn" data-p>▶ Laden & anhören</button><button class="secondary smallbtn" data-u>↗ In Komposition übernehmen</button></div>`;'''
if old in s:
    s=s.replace(old,new,1)

# preserve current lab ensemble setting saving if present (already separate script may do it); no change needed.

p.write_text(s,encoding='utf-8')
