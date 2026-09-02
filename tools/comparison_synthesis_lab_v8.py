from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Remove the old standalone variants section.
s=re.sub(r'\n\s*<details class="foldbox" id="compareSection"[\s\S]*?</details>\n\n(?=\s*<details class="labbox" id="experimentSection")','\n\n',s,count=1)

# Add Comparison & Synthesis as a collapsible subsection inside Experimentierlabor.
if 'id="synthesisSection"' not in s:
    marker='''          <details class="foldbox" id="experimentHistorySection" open>'''
    block='''          <details class="foldbox" id="synthesisSection">
            <summary>Vergleich & Synthese</summary>
            <div class="foldcontent">
              <p class="labhint">Zwei beliebige Stücke oder Vorlagen gegenüberstellen, anhören, von der KI analysieren lassen und daraus einen neuen Kompositionsauftrag entwickeln.</p>
              <div class="comparegrid">
                <div>
                  <label for="sourceASelect">Quelle A</label>
                  <select id="sourceASelect"><option value="">Quelle wählen …</option></select>
                  <div class="uploadrow"><input id="sourceAFile" type="file" accept=".mid,.midi,.json,application/json,audio/midi"></div>
                  <div id="sourceACard" class="variantcard">Noch keine Quelle geladen.</div>
                  <div class="historyactions"><button type="button" class="secondary smallbtn" id="playSourceA">▶ A anhören</button><button type="button" class="secondary smallbtn" id="stopSourceA">⏹ Stop</button></div>
                </div>
                <div>
                  <label for="sourceBSelect">Quelle B</label>
                  <select id="sourceBSelect"><option value="">Quelle wählen …</option></select>
                  <div class="uploadrow"><input id="sourceBFile" type="file" accept=".mid,.midi,.json,application/json,audio/midi"></div>
                  <div id="sourceBCard" class="variantcard">Noch keine Quelle geladen.</div>
                  <div class="historyactions"><button type="button" class="secondary smallbtn" id="playSourceB">▶ B anhören</button><button type="button" class="secondary smallbtn" id="stopSourceB">⏹ Stop</button></div>
                </div>
              </div>
              <div class="toolbar" style="margin-top:12px"><button type="button" class="secondary" id="aiCompareBtn">Mit KI vergleichen</button></div>
              <div id="aiCompareResult" class="resultcard">Noch kein KI-Vergleich.</div>
              <label for="synthesisPrompt">Syntheseauftrag</label>
              <textarea id="synthesisPrompt" placeholder="z. B. Übernimm das Hauptmotiv aus A und das Begleitmuster aus B. Entwickle daraus ein eigenständiges 32-taktiges Stück."></textarea>
              <div class="toolbar"><button type="button" class="secondary" id="suggestSynthesisBtn">KI-Vorschlag erstellen</button><button type="button" class="primary" style="width:auto;margin-top:0" id="useSynthesisBtn">Als Kompositionsauftrag übernehmen</button></div>
            </div>
          </details>

'''
    if marker not in s: raise SystemExit('experiment history marker not found')
    s=s.replace(marker,block+marker,1)

# Make both comparison sources available to the main composition call after transfer.
needle='''    if(uploadedScore){
      promptText += `\\
\\
VORHANDENES MATERIAL (${uploadedName}):\\
` + JSON.stringify(uploadedScore);
    }
'''
if 'SYNTHese-QUELLE A' not in s:
    addition=needle+'''    if(window.comparisonSynthesisSources?.a && window.comparisonSynthesisSources?.b){
      promptText += `\\
\\
SYNTHESE-QUELLE A (${window.comparisonSynthesisSources.nameA||"A"}):\\
` + JSON.stringify(window.comparisonSynthesisSources.a);
      promptText += `\\
\\
SYNTHESE-QUELLE B (${window.comparisonSynthesisSources.nameB||"B"}):\\
` + JSON.stringify(window.comparisonSynthesisSources.b);
      promptText += `\\
\\
WICHTIG: Nutze beide Synthese-Quellen entsprechend dem Kompositionsauftrag. Übernimm nicht mechanisch ganze Passagen, sondern entwickle die genannten musikalischen Merkmale eigenständig weiter.`;
    }
'''
    if needle in s: s=s.replace(needle,addition,1)

# Comparison/Synthesis logic. Reuses current provider/model/API settings and MIDI parser.
if 'comparison-synthesis-v8' not in s:
    insert='''
<script id="comparison-synthesis-v8">
(()=>{
  const $c=id=>document.getElementById(id);
  const src={A:null,B:null};
  const names={A:"",B:""};
  function normalHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_ID)||"[]")}catch(_){return[]}}
  function expHistory(){try{return JSON.parse(localStorage.getItem("composition_lab_experiment_history_v1")||"[]")}catch(_){return[]}}
  function fill(){
    ["A","B"].forEach(w=>{const sel=$c("source"+w+"Select");if(!sel)return;const old=sel.value;sel.innerHTML='<option value="">Quelle wählen …</option>';
      normalHistory().forEach((it,i)=>{const o=document.createElement("option");o.value="h:"+i;o.textContent="Komposition · "+(it.title||it.score?.ti||"Ohne Titel");sel.appendChild(o)});
      expHistory().forEach((it,i)=>{const o=document.createElement("option");o.value="e:"+i;o.textContent="Vorlage · "+(it.title||it.score?.ti||"Vorlage");sel.appendChild(o)});
      if([...sel.options].some(o=>o.value===old))sel.value=old;
    });
  }
  function card(w){const b=$c("source"+w+"Card"),x=src[w];if(!b)return;if(!x){b.textContent="Noch keine Quelle geladen.";return;}const n=(x.tr||[]).reduce((a,t)=>a+(t.nt?.length||0),0);b.innerHTML=`<strong>${esc(names[w]||x.ti||("Quelle "+w))}</strong><div class="historymeta">${esc(x.bpm||"")} BPM · ${esc(x.k||"")} · ${x.tr?.length||0} Spur(en) · ${n} Noten</div>${x.sm?`<div style="margin-top:6px;font-size:12px;color:var(--muted);">${esc(String(x.sm)).slice(0,300)}</div>`:""}`}
  function choose(w,v){if(!v)return;const [kind,ix]=v.split(":");const it=(kind==="h"?normalHistory():expHistory())[Number(ix)];if(!it?.score)return;src[w]=JSON.parse(JSON.stringify(it.score));names[w]=it.title||it.score.ti||("Quelle "+w);card(w)}
  async function file(w,f){if(!f)return;try{src[w]=f.name.toLowerCase().endsWith(".json")?JSON.parse(await f.text()):parseUploadedMidi(await f.arrayBuffer());names[w]=f.name;card(w)}catch(e){$c("source"+w+"Card").innerHTML=`<span class="err">${esc(e.message)}</span>`}}
  async function compare(makePrompt=false){
    if(!src.A||!src.B)throw new Error("Bitte zuerst Quelle A und Quelle B laden.");
    const provider=$c("provider").value,model=$c("model").value,key=$c("apiKey").value.trim();if(!key)throw new Error("API-Key fehlt.");
    const task=makePrompt?"Erstelle aus der Analyse einen konkreten, editierbaren Kompositionsauftrag. Benenne ausdrücklich, welche musikalischen Merkmale aus Quelle A und welche aus Quelle B übernommen, kombiniert oder weiterentwickelt werden sollen. Das Ergebnis soll ein eigenständiges neues Stück C ermöglichen.":"Vergleiche beide musikalischen Quellen präzise. Untersuche Motivik, Rhythmik, Harmonik, Begleitmuster, Form, Satztechnik, Instrumentation, Artikulation, Dynamik und Charakter. Benenne besonders brauchbare Merkmale beider Quellen und sinnvolle Möglichkeiten ihrer Kombination. Keine bloße Siegerwertung.";
    const text=`${task}\n\nQUELLE A – ${names.A}:\n${JSON.stringify(src.A)}\n\nQUELLE B – ${names.B}:\n${JSON.stringify(src.B)}`;
    const r=await callLLM(provider,model,key,SYSTEM_PREFIX,text,false);return r.text;
  }
  ["A","B"].forEach(w=>{const sel=$c("source"+w+"Select"),fi=$c("source"+w+"File");if(sel)sel.onchange=()=>choose(w,sel.value);if(fi)fi.onchange=e=>file(w,e.target.files?.[0]);const pb=$c("playSource"+w);if(pb)pb.onclick=()=>{if(src[w])playGMScore(src[w],0).catch(()=>{})};const sb=$c("stopSource"+w);if(sb)sb.onclick=()=>stopGM();});
  if($c("aiCompareBtn"))$c("aiCompareBtn").onclick=async()=>{const b=$c("aiCompareResult");try{b.textContent="KI analysiert A und B …";b.textContent=await compare(false)}catch(e){b.innerHTML=`<span class="err">${esc(e.message)}</span>`}};
  if($c("suggestSynthesisBtn"))$c("suggestSynthesisBtn").onclick=async()=>{try{$c("synthesisPrompt").value="KI erstellt Syntheseauftrag …";$c("synthesisPrompt").value=await compare(true)}catch(e){$c("synthesisPrompt").value="";$c("aiCompareResult").innerHTML=`<span class="err">${esc(e.message)}</span>`}};
  if($c("useSynthesisBtn"))$c("useSynthesisBtn").onclick=()=>{if(!src.A||!src.B){$c("aiCompareResult").innerHTML='<span class="err">Bitte zuerst A und B laden.</span>';return}const t=$c("synthesisPrompt").value.trim();if(!t){$c("aiCompareResult").innerHTML='<span class="err">Bitte zuerst einen Syntheseauftrag formulieren.</span>';return}$c("prompt").value=t;window.comparisonSynthesisSources={a:JSON.parse(JSON.stringify(src.A)),b:JSON.parse(JSON.stringify(src.B)),nameA:names.A,nameB:names.B};saveCurrentState();$c("status").innerHTML='<span class="ok">Syntheseauftrag übernommen. Quelle A und B werden beim nächsten Komponieren gemeinsam an die KI übergeben.</span>';window.scrollTo({top:0,behavior:"smooth"})};
  fill();window.compositionLabRefreshComparisonSources=fill;
})();
</script>
'''
    s=s.replace('</body>',insert+'\n</body>',1)

s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=9")','navigator.serviceWorker.register("./service-worker.js?v=10")')
p.write_text(s,encoding='utf-8')
