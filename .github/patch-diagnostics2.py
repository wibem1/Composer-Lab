from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(a,b):
    global s
    if a not in s:
        raise SystemExit('Missing target: '+a[:100])
    s=s.replace(a,b,1)

rep('''        <div class="keyrow">
          <label class="checklabel"><input id="rememberApiKey" type="checkbox" checked> Eingaben &amp; Keys auf diesem Gerät merken</label>
          <button type="button" class="secondary smallbtn" id="saveKeyBtn">💾 Jetzt speichern</button>
          <button type="button" class="secondary smallbtn" id="clearApiKeyBtn">🗑 Key löschen</button>
        </div>''','''        <div class="keyrow">
          <label class="checklabel"><input id="rememberApiKey" type="checkbox" checked> Eingaben &amp; Keys auf diesem Gerät merken</label>
          <button type="button" class="secondary smallbtn" id="saveKeyBtn">💾 Jetzt speichern</button>
          <button type="button" class="secondary smallbtn" id="clearApiKeyBtn">🗑 Key löschen</button>
        </div>
        <div class="toolbar" style="margin-top:12px; margin-bottom:4px;">
          <button type="button" class="secondary smallbtn" id="diagnosticBtn" disabled>Diagnosedatei herunterladen</button>
        </div>
        <div class="uploadinfo" id="diagnosticInfo">Nach einem Kompositionsversuch enthält die Diagnosedatei die tatsächlich verwendeten Prompts, Antworten, Einstellungen und Plattformdaten. Der API-Key wird nicht gespeichert.</div>''')

rep('let lastConcept = "";','let lastConcept = "";\nlet lastDiagnostic = null;')

rep('function downloadBlob(data, name, type){','''function downloadDiagnostic(){
  if(!lastDiagnostic) return;
  const stamp=new Date(lastDiagnostic.startedAt||Date.now()).toISOString().replace(/[:.]/g,"-");
  const title=lastDiagnostic.result?.score?.ti||lastScore?.ti||"Komposition";
  const safe=String(title).replace(/[^a-z0-9äöüß_-]+/gi,"_").replace(/^_+|_+$/g,"").slice(0,60)||"Komposition";
  downloadBlob(JSON.stringify(lastDiagnostic,null,2),`Composition-Lab-Diagnose_${safe}_${stamp}.json`,"application/json");
}

function downloadBlob(data, name, type){''')

rep('''  try {
    let promptText = `VERBINDLICHE ECKDATEN''','''  lastDiagnostic={
    format:"composition-lab-diagnostic",diagnosticVersion:1,startedAt:new Date().toISOString(),
    environment:{href:location.href,origin:location.origin,userAgent:navigator.userAgent,platform:navigator.platform||"",language:navigator.language||"",online:navigator.onLine,androidBridge:!!window.AndroidBridge,storageId:STORAGE_ID,historyId:HISTORY_ID},
    settings:{provider,model,reasoningEffort:$("reasoningEffort").value,measures:$("measures").value,meter:$("meter").value,tempo:$("tempo").value,musicalKey:$("musicalKey").value,ensemble:$("ensemble").value,freePrompt:$("prompt").value,templateLength:$("templateLength").value,uploadedName:uploadedName||null,uploadedScore:uploadedScore?JSON.parse(JSON.stringify(uploadedScore)):null},
    prompts:{system:SYSTEM_PREFIX,technical:TECHNICAL_PROMPT},calls:{},result:null,error:null
  };
  $("diagnosticBtn").disabled=false;
  $("diagnosticInfo").textContent="Diagnose für den aktuellen Kompositionsversuch wird aufgezeichnet. API-Key ist ausgeschlossen.";

  try {
    let promptText = `VERBINDLICHE ECKDATEN''')

lines=s.splitlines()
for i,line in enumerate(lines):
    if 'const conceptRes = await callLLM(provider, model, apiKeyVal, SYSTEM_PREFIX,' in line:
        if i+1>=len(lines) or 'lastConcept = conceptRes.text' not in lines[i+1]:
            raise SystemExit('Concept call neighbor mismatch')
        lines[i:i+2]=[
'    lastDiagnostic.prompts.effectiveAssignment=promptText;',
'    const conceptPrompt=`Formuliere einen kurzen musikalischen Gedanken/Impuls für folgenden Auftrag:\\n\\n${promptText}`;',
'    lastDiagnostic.calls.concept={request:{system:SYSTEM_PREFIX,user:conceptPrompt,wantJson:false}};',
'    const conceptRes=await callLLM(provider,model,apiKeyVal,SYSTEM_PREFIX,conceptPrompt,false);',
'    lastDiagnostic.calls.concept.response={text:conceptRes.text||"",usage:conceptRes.usage||null};',
'    lastConcept = conceptRes.text || "";']
        break
else:
    raise SystemExit('Concept call not found')
s='\n'.join(lines)+'\n'

rep('''    const scoreRes = await callLLM(provider, model, apiKeyVal, SYSTEM_PREFIX, compPrompt, true);
    const score = extractJSON(scoreRes.text);''','''    lastDiagnostic.calls.composition={request:{system:SYSTEM_PREFIX,user:compPrompt,wantJson:true}};
    const scoreRes=await callLLM(provider,model,apiKeyVal,SYSTEM_PREFIX,compPrompt,true);
    lastDiagnostic.calls.composition.response={text:scoreRes.text||"",usage:scoreRes.usage||null};
    const score = extractJSON(scoreRes.text);''')

rep('''    lastMidiBytes = buildMidi(score);

    $("downloadBtn").disabled = false;''','''    lastMidiBytes = buildMidi(score);
    lastDiagnostic.result={score:JSON.parse(JSON.stringify(score)),completedAt:new Date().toISOString()};

    $("downloadBtn").disabled = false;''')

rep('''  } catch(err) {
    $("status").innerHTML = `<span class="err">Fehler: ${esc(err.message)}</span>`;''','''  } catch(err) {
    if(lastDiagnostic) lastDiagnostic.error={message:String(err?.message||err),name:String(err?.name||"Error"),at:new Date().toISOString()};
    $("status").innerHTML = `<span class="err">Fehler: ${esc(err.message)}</span>`;''')

rep('$("rememberApiKey").addEventListener("change", saveCurrentState);','$("rememberApiKey").addEventListener("change", saveCurrentState);\n$("diagnosticBtn").addEventListener("click", downloadDiagnostic);')

p.write_text(s,encoding='utf-8')
