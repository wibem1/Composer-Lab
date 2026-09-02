from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Visible source label in main player
needle='''    <div class="playerbar" id="gmPlayer">\n      <button class="secondary" id="playBtn" type="button">▶ Abspielen</button>'''
replacement='''    <div class="playerbar" id="gmPlayer">\n      <strong id="mainPlayerTitle" style="flex:1 1 100%;">Noch keine Wiedergabequelle geladen.</strong>\n      <button class="secondary" id="playBtn" type="button">▶ Abspielen</button>'''
if needle in s and 'id="mainPlayerTitle"' not in s:
    s=s.replace(needle,replacement,1)

# Compose success: main player visibly switches to composition
needle='''    lastScore = score;\n    mainPlayerScore = score;\n    lastProvider = provider;'''
replacement='''    lastScore = score;\n    mainPlayerScore = score;\n    if($("mainPlayerTitle")) $("mainPlayerTitle").textContent = `Komposition: ${score.ti || "Unbenannt"}`;\n    if($("playerSeek")) $("playerSeek").value = "0";\n    if($("playerTime")) $("playerTime").textContent = "0:00 / 0:00";\n    lastProvider = provider;'''
if needle in s:
    s=s.replace(needle,replacement,1)

# Direct template handoff: player visibly gets template
needle='''    mainPlayerScore = uploadedScore;\n    if($("playerStatus")) $("playerStatus").textContent = `Vorlage „${randomTemplateScore.ti || "Vorlage"}“ im Hauptplayer bereit.`;'''
replacement='''    mainPlayerScore = uploadedScore;\n    if($("mainPlayerTitle")) $("mainPlayerTitle").textContent = `Vorlage: ${randomTemplateScore.ti || "Vorlage"}`;\n    if($("playerSeek")) $("playerSeek").value = "0";\n    if($("playerTime")) $("playerTime").textContent = "0:00 / 0:00";\n    if($("playerStatus")) $("playerStatus").textContent = `Vorlage „${randomTemplateScore.ti || "Vorlage"}“ im Hauptplayer bereit.`;'''
if needle in s:
    s=s.replace(needle,replacement,1)

# History handoff: same behaviour
needle='''applyTemplateToComposition(uploadedScore,it.meta||{});mainPlayerScore=uploadedScore;if(typeof window.compositionLabSetCurrentTemplate==="function")window.compositionLabSetCurrentTemplate(it);'''
replacement='''applyTemplateToComposition(uploadedScore,it.meta||{});mainPlayerScore=uploadedScore;if($("mainPlayerTitle"))$("mainPlayerTitle").textContent=`Vorlage: ${it.title||"Vorlage"}`;if($("playerSeek"))$("playerSeek").value="0";if($("playerTime"))$("playerTime").textContent="0:00 / 0:00";if(typeof window.compositionLabSetCurrentTemplate==="function")window.compositionLabSetCurrentTemplate(it);'''
if needle in s:
    s=s.replace(needle,replacement,1)

# Main seek must seek within active player source, not stale lastScore
s=s.replace('bindSeek("playerSeek",()=>lastScore);','bindSeek("playerSeek",()=>mainPlayerScore || lastScore || uploadedScore);')

# Persist fold states for every details section with an id
marker='''</body>\n</html>'''
script='''<script id="fold-state-persistence-v7">\n(() => {\n  const KEY = "composition_lab_fold_states_v1";\n  function read(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(_) { return {}; } }\n  function save(){\n    const state = {};\n    document.querySelectorAll("details[id]").forEach(el => { state[el.id] = !!el.open; });\n    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(_) {}\n  }\n  const state = read();\n  document.querySelectorAll("details[id]").forEach(el => {\n    if(Object.prototype.hasOwnProperty.call(state, el.id)) el.open = !!state[el.id];\n    el.addEventListener("toggle", save);\n  });\n})();\n</script>\n\n</body>\n</html>'''
if 'id="fold-state-persistence-v7"' not in s and marker in s:
    s=s.replace(marker,script,1)

p.write_text(s,encoding='utf-8')
