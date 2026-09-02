from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='''          <div class="uploadinfo" style="margin-bottom:9px;">Länge der experimentellen Vorlage. Sie ist vollständig unabhängig von der oben eingestellten Länge des fertigen Stücks.</div>\n          <label for="labEnsemble">Besetzung / Instrumente</label>'''
new='''          <div class="uploadinfo" style="margin-bottom:9px;">Länge der experimentellen Vorlage. Sie ist vollständig unabhängig von der oben eingestellten Länge des fertigen Stücks.</div>\n          <label for="labTempo">Tempo (BPM)</label>\n          <input id="labTempo" type="number" min="20" max="300" value="96" placeholder="z. B. 90">\n          <div class="uploadinfo" style="margin-bottom:9px;">Tempo der experimentellen Vorlage.</div>\n          <label for="labEnsemble">Besetzung / Instrumente</label>'''
assert old in s
s=s.replace(old,new,1)
old='''          <div class="uploadinfo" style="margin-bottom:9px;">Besetzung frei eingeben. Die KI verwendet diese Angabe für die experimentelle Vorlage.</div>\n          <div class="labbuttons">'''
new='''          <div class="uploadinfo" style="margin-bottom:9px;">Besetzung frei eingeben. Die KI verwendet diese Angabe für die experimentelle Vorlage.</div>\n          <label for="labStyle">Charakter / Stil</label>\n          <input id="labStyle" value="" placeholder="z. B. klassisch, modern, romantisch, experimentell, ruhig und geheimnisvoll">\n          <div class="uploadinfo" style="margin-bottom:9px;">Freie ästhetische Vorgabe für die Vorlage. Tonart, Taktart, Motivik und Harmonik darf die KI weiterhin selbst gestalten.</div>\n          <div class="labbuttons">'''
assert old in s
s=s.replace(old,new,1)
# persist fields in main state
s=s.replace('''      templateLength: $("templateLength").value\n''','''      templateLength: $("templateLength").value,\n      labTempo: $("labTempo")?.value || "96",\n      labEnsemble: $("labEnsemble")?.value || "",\n      labStyle: $("labStyle")?.value || ""\n''',1)
s=s.replace('''    if(data.form.templateLength !== undefined && ["2","4","8"].includes(String(data.form.templateLength))) $("templateLength").value = String(data.form.templateLength);\n''','''    if(data.form.templateLength !== undefined && ["2","4","8"].includes(String(data.form.templateLength))) $("templateLength").value = String(data.form.templateLength);\n    if(data.form.labTempo !== undefined && $("labTempo")) $("labTempo").value = data.form.labTempo;\n    if(data.form.labEnsemble !== undefined && $("labEnsemble")) $("labEnsemble").value = data.form.labEnsemble;\n    if(data.form.labStyle !== undefined && $("labStyle")) $("labStyle").value = data.form.labStyle;\n''',1)
s=s.replace('''"prompt", "templateLength"].forEach(id => {''','''"prompt", "templateLength", "labTempo", "labEnsemble", "labStyle"].forEach(id => {''',1)
# template creation: use lab tempo, style; let KI choose key/meter while prompt requests them
old='''    const ensemble = $("labEnsemble")?.value.trim() || "Klavier solo";\n    const meter = $("meter").value || "4/4";\n    const bpm = Math.max(20, Math.min(300, parseInt($("tempo").value,10) || 96));\n    const key = $("musicalKey").value || "C major";'''
new='''    const ensemble = $("labEnsemble")?.value.trim() || "Klavier solo";\n    const style = $("labStyle")?.value.trim() || "frei";\n    const bpm = Math.max(20, Math.min(300, parseInt($("labTempo")?.value,10) || 96));\n    const meter = "von der KI passend zum musikalischen Gedanken gewählt";\n    const key = "von der KI passend zum musikalischen Gedanken gewählt";'''
assert old in s
s=s.replace(old,new,1)
# enrich prompt near ensemble instruction
needle='''- Besetzung: ${ensemble}\n'''
repl='''- Besetzung: ${ensemble}\n- Tempo: ${bpm} BPM (verbindlich)\n- Charakter / Stil: ${style}\n- Wähle Taktart und Tonart selbst passend zur musikalischen Idee.\n'''
assert needle in s
s=s.replace(needle,repl,1)
# don't overwrite AI key/ts with descriptive placeholders; keep tempo binding
s=s.replace('''      score.bpm = Number(score.bpm) || bpm;\n      score.ts = score.ts || {n: meterN, d: meterD};\n      score.k = score.k || key;''','''      score.bpm = bpm;\n      score.ts = score.ts || {n: 4, d: 4};\n      score.k = score.k || "C major";''',1)
# metadata add style and actual meter/key
s=s.replace('''          ensemble, idea: score.sm || seed, measures, meter, bpm: score.bpm || bpm, key: score.k || key\n''','''          ensemble, style, idea: score.sm || seed, measures, meter: `${score.ts?.n || 4}/${score.ts?.d || 4}`, bpm, key: score.k || "C major"\n''',1)
# include style in fallback idea if needed
s=s.replace('''score.sm = score.sm || `KI-Ausgangsvorlage · ${ensemble} · ${meter} · ${bpm} BPM · ${key}. Kompositorische Idee: ${seed}`;''','''score.sm = score.sm || `KI-Ausgangsvorlage · ${ensemble} · ${bpm} BPM · Charakter/Stil: ${style}. Kompositorische Idee: ${seed}`;''',1)
# history display style
old='''const idea=m.idea||it.score?.sm||"";d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)} · ${esc(ens)} · ${esc(ts)} · ${esc(bpm)} BPM${key?" · "+esc(key):""}</div>${idea?'''
new='''const idea=m.idea||it.score?.sm||"";const style=m.style||"";d.innerHTML=`<strong>${esc(it.title)}</strong><div class="historymeta">${esc(it.kind)} · ${esc(it.time)} · ${esc(ens)} · ${esc(ts)} · ${esc(bpm)} BPM${key?" · "+esc(key):""}${style?" · "+esc(style):""}</div>${idea?'''
assert old in s
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
