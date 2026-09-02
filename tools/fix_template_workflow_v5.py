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

# History template handoff: same semantics.
hist_old='applyTemplateToComposition(uploadedScore,it.meta||{});mainPlayerScore=uploadedScore;if($("mainPlayerTitle"))'
hist_new='applyTemplateToComposition(uploadedScore,it.meta||{});mainPlayerScore=uploadedScore;lastScore=uploadedScore;lastMidiBytes=buildMidi(uploadedScore);if($("mainPlayerTitle"))'
if hist_old in s:
    s=s.replace(hist_old,hist_new,1)

# Main player and seek always prefer the active template/composition source.
s=s.replace('playGMScore(mainPlayerScore || lastScore || uploadedScore)','playGMScore(mainPlayerScore || uploadedScore || lastScore)')
s=s.replace('bindSeek("playerSeek",()=>mainPlayerScore || lastScore || uploadedScore);','bindSeek("playerSeek",()=>mainPlayerScore || uploadedScore || lastScore);')

# Give the installed app a new service-worker URL so it checks for a fresh script.
s=s.replace('navigator.serviceWorker.register("./service-worker.js")','navigator.serviceWorker.register("./service-worker.js?v=8")')

p.write_text(s,encoding='utf-8')
