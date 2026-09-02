from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_html = '''        <div class="playerbar" id="randomTemplateBox" style="display:none;margin-top:10px;">
          <strong id="randomTemplateName" style="flex:1 1 100%;">Zufallsvorlage</strong>
          <button type="button" class="secondary smallbtn" id="templatePlayBtn">▶ Vorlage anhören</button>
          <button type="button" class="secondary smallbtn" id="templateSaveBtn">💾 Vorlage speichern</button>
          <button type="button" class="secondary smallbtn" id="templateUseBtn">🤖 Als Vorlage verwenden</button>
          <button type="button" class="secondary smallbtn" id="templateRerollBtn">🎲 Neu würfeln</button>
        </div>'''

new_html = '''        <div class="playerbar" id="randomTemplateBox" style="display:none;margin-top:10px;">
          <strong id="randomTemplateName" style="flex:1 1 100%;">KI-Vorlage</strong>
          <button type="button" class="secondary smallbtn" id="templatePlayBtn">▶ Abspielen</button>
          <button type="button" class="secondary smallbtn" id="templatePauseBtn">⏸ Pause</button>
          <button type="button" class="secondary smallbtn" id="templateStopBtn">⏹ Stop</button>
          <button type="button" class="secondary smallbtn" id="templateLoopBtn">🔁 Loop: Aus</button>
          <label for="templateVolume" style="margin:0;font-weight:600;display:flex;align-items:center;gap:7px;">Lautstärke
            <input id="templateVolume" type="range" min="0" max="100" value="75">
          </label>
          <span class="playerstatus" id="templatePlayerStatus">KI-Vorlage bereit.</span>
          <div style="flex-basis:100%;height:0"></div>
          <button type="button" class="secondary smallbtn" id="templateSaveBtn">💾 MIDI speichern</button>
          <button type="button" class="secondary smallbtn" id="templateUseBtn">🤖 Als Vorlage verwenden</button>
          <button type="button" class="secondary smallbtn" id="templateRerollBtn">🎲 Neue KI-Vorlage</button>
        </div>'''

if old_html in s:
    s = s.replace(old_html, new_html, 1)
elif 'id="templatePauseBtn"' not in s:
    raise SystemExit('template html marker not found')

start = s.find('<script id="v23-template-controls">')
if start < 0:
    raise SystemExit('template script start not found')
end = s.find('</script>', start)
if end < 0:
    raise SystemExit('template script end not found')
end += len('</script>')

new_script = r'''<script id="v23-template-controls">
(() => {
  let randomTemplateScore = null;
  let randomTemplateFileName = "";
  let templateBusy = false;

  const seedMotifs = [
    "ein prägnantes Motiv aus drei oder vier Tönen",
    "eine kleine rhythmische Verschiebung, die später wichtig wird",
    "eine gesangliche Linie mit einer überraschenden Intervallwendung",
    "eine ruhige Figur, die zwischen den Stimmen wandert",
    "ein kurzer Frage-Antwort-Gedanke",
    "eine zunächst unscheinbare Nebenstimme, die Eigenständigkeit gewinnt"
  ];
  const seedChars = [
    "ruhig und konzentriert", "spielerisch, aber nicht beliebig", "leicht melancholisch",
    "klar und kammermusikalisch", "gesanglich mit innerer Spannung", "zurückhaltend mit einer überraschenden Wendung"
  ];
  const seedDevelopments = [
    "entwickle das Motiv erkennbar statt neues Material aneinanderzureihen",
    "lasse die Stimmen zunehmend aufeinander reagieren",
    "variiere Rhythmus oder Register, ohne den Grundgedanken zu verlieren",
    "führe zu einem kleinen Höhepunkt und ende musikalisch plausibel",
    "lasse aus der Begleitung zeitweise eine gleichberechtigte Stimme werden"
  ];

  function safeFileName(text){
    return String(text || "KI_Vorlage")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function setTemplateStatus(text, isError=false){
    const el = $("templatePlayerStatus");
    if(el) el.textContent = text;
    if(isError) $("status").innerHTML = '<span class="err">' + esc(text) + '</span>';
  }

  function syncLoopButtons(){
    const text = playerLoopEnabled ? "🔁 Loop: Ein" : "🔁 Loop: Aus";
    if($("loopBtn")) $("loopBtn").textContent = text;
    if($("templateLoopBtn")) $("templateLoopBtn").textContent = text;
  }

  async function createTemplate(){
    if(templateBusy) return;
    const provider = $("provider").value;
    const model = $("model").value.trim();
    const apiKeyVal = $("apiKey").value.trim();
    if(!apiKeyVal){
      $("status").innerHTML = `<span class="err">Bitte zuerst den API-Key für ${esc(providerDisplayName(provider))} eingeben. Die Vorlage wird jetzt von der gewählten KI komponiert.</span>`;
      return;
    }

    templateBusy = true;
    $("randomToTemplateBtn").disabled = true;
    if($("templateRerollBtn")) $("templateRerollBtn").disabled = true;
    $("randomTemplateBox").style.display = "flex";
    $("randomTemplateName").textContent = "KI komponiert eine neue Vorlage …";
    setTemplateStatus("KI komponiert …");
    $("status").innerHTML = '<span class="ok">Die gewählte KI komponiert eine musikalische Vorlage …</span>';

    try {
      const measures = Math.max(2, Math.min(32, parseInt($("measures").value,10) || 8));
      const meter = $("meter").value || "4/4";
      const bpm = Math.max(20, Math.min(300, parseInt($("tempo").value,10) || 96));
      const key = $("musicalKey").value || "C major";
      const ensemble = $("ensemble").value || "Piano solo";
      const seed = `${pick(seedMotifs)}; Charakter: ${pick(seedChars)}; ${pick(seedDevelopments)}.`;

      const task = `Komponiere KEIN fertiges großes Stück, sondern eine musikalisch brauchbare MIDI-Ausgangsvorlage, die später von Mensch und KI weiterentwickelt werden kann.\n\nEckdaten:\n- Besetzung: ${ensemble}\n- Länge: ${measures} Takte\n- Taktart: ${meter}\n- Tempo: ${bpm} BPM\n- Tonart: ${key}\n- Zufälliger kompositorischer Impuls: ${seed}\n\nWICHTIG:\n- Die genannte Besetzung muss tatsächlich in getrennten, passend benannten MIDI-Spuren mit korrekten GM-Programmen vorkommen. Wenn zwei Instrumente genannt sind, müssen beide musikalisch hörbar beteiligt sein.\n- Erzeuge zusammenhängendes, motivisch erkennbares Material, keine statistische Tonfolge und keine bloße Zufallswolke.\n- Die Vorlage darf offen und anregend sein, soll aber bereits musikalischen Sinn ergeben.\n- Gib ihr einen kurzen, einprägsamen deutschen Titel, der zur musikalischen Idee passt.\n- Nutze Dynamik und Artikulation sinnvoll.\n- Halte die angegebene Taktzahl möglichst genau ein.\n\n${TECHNICAL_PROMPT}`;

      const res = await callLLM(provider, model, apiKeyVal, SYSTEM_PREFIX, task, true);
      const score = extractJSON(res.text);
      score.bpm = Number(score.bpm) || bpm;
      score.k = score.k || key;
      score.ti = String(score.ti || "KI-Vorlage").trim();
      score.sm = score.sm || `KI-Ausgangsvorlage · ${ensemble} · ${meter} · ${bpm} BPM · ${key}`;
      randomTemplateScore = score;

      const meterFile = String(score.ts?.n || meter.split('/')[0]) + "-" + String(score.ts?.d || meter.split('/')[1]);
      randomTemplateFileName = `${safeFileName(score.ti)}_${measures}T_${meterFile}_${score.bpm}BPM.mid`;
      const trackNames = (score.tr || []).map(t => t.nm).filter(Boolean).join(" + ");
      $("randomTemplateName").textContent = `${score.ti} · ${trackNames || ensemble} · ${measures} Takte · ${score.ts?.n || ""}/${score.ts?.d || ""} · ${score.bpm} BPM`;
      $("experimentInfo").textContent = `KI-Vorlage mit ${providerDisplayName(provider)} erzeugt. Du kannst sie vollständig anhören, pausieren, stoppen, loopen, als MIDI speichern oder erst danach als Vorlage aktivieren.`;
      setTemplateStatus("KI-Vorlage bereit.");
      $("status").innerHTML = `<span class="ok">KI-Vorlage „${esc(score.ti)}“ erzeugt.</span>`;
    } catch(err) {
      randomTemplateScore = null;
      $("randomTemplateName").textContent = "KI-Vorlage konnte nicht erzeugt werden";
      setTemplateStatus("Fehler: " + err.message, true);
    } finally {
      templateBusy = false;
      $("randomToTemplateBtn").disabled = false;
      if($("templateRerollBtn")) $("templateRerollBtn").disabled = false;
    }
  }

  function useTemplate(){
    if(!randomTemplateScore) return;
    uploadedScore = JSON.parse(JSON.stringify(randomTemplateScore));
    uploadedName = randomTemplateFileName || `${randomTemplateScore.ti}.mid`;
    const count = (uploadedScore.tr || []).reduce((sum,t) => sum + (t.nt?.length || 0), 0);
    $("uploadInfo").textContent = `Als Vorlage aktiv: ${uploadedName} (${count} Noten)`;
    $("status").innerHTML = `<span class="ok">„${esc(randomTemplateScore.ti)}“ ist jetzt als KI-Vorlage aktiviert.</span>`;
  }

  $("randomToTemplateBtn").onclick = createTemplate;
  $("templateRerollBtn").onclick = createTemplate;
  $("templatePlayBtn").onclick = async () => {
    if(!randomTemplateScore) return;
    try {
      const vol = Number($("templateVolume").value || 75);
      if($("playerVolume")) $("playerVolume").value = String(vol);
      if(playerMasterGain) playerMasterGain.gain.value = Math.max(0, Math.min(1, vol / 100));
      setTemplateStatus("GM-Klänge werden geladen …");
      await playGMScore(randomTemplateScore);
      setTemplateStatus("▶ Wiedergabe läuft.");
    } catch(err) {
      setTemplateStatus("Player-Fehler: " + err.message, true);
    }
  };
  $("templatePauseBtn").onclick = () => toggleGMPause()
    .then(() => setTemplateStatus(playerPaused ? "⏸ Pausiert." : "▶ Wiedergabe fortgesetzt."))
    .catch(err => setTemplateStatus("Player-Fehler: " + err.message, true));
  $("templateStopBtn").onclick = () => { stopGMPlayback(true); setTemplateStatus("Gestoppt."); };
  $("templateLoopBtn").onclick = () => {
    playerLoopEnabled = !playerLoopEnabled;
    syncLoopButtons();
    setTemplateStatus(playerLoopEnabled ? "Loop eingeschaltet." : "Loop ausgeschaltet.");
  };
  $("templateVolume").oninput = e => {
    const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    if($("playerVolume")) $("playerVolume").value = String(v);
    if(playerMasterGain) playerMasterGain.gain.value = v / 100;
  };
  $("templateSaveBtn").onclick = () => {
    if(!randomTemplateScore) return;
    downloadBlob(buildMidi(randomTemplateScore), randomTemplateFileName || "KI_Vorlage.mid", "audio/midi");
  };
  $("templateUseBtn").onclick = useTemplate;

  const oldLoop = $("loopBtn");
  if(oldLoop) oldLoop.addEventListener("click", () => setTimeout(syncLoopButtons, 0));
  const mainVol = $("playerVolume");
  if(mainVol) mainVol.addEventListener("input", e => { if($("templateVolume")) $("templateVolume").value = e.target.value; });

  const info = $("experimentInfo");
  if(info) info.textContent = 'Inspiration ändert nur den Kompositionsauftrag. „Völliger Zufall“ und „Zufall mit Eckdaten“ bleiben lokale Experimente. „Zufall als Vorlage“ lässt dagegen die aktuell gewählte KI ein musikalisch zusammenhängendes Ausgangsmaterial komponieren.';
  syncLoopButtons();
})();
</script>'''

s = s[:start] + new_script + s[end:]
p.write_text(s, encoding='utf-8')
