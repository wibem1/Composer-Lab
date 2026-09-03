(()=>{
'use strict';
const VERSION='shared-engine-1.9';
const BUILD=13;
const SYSTEM_PREFIX=`Du bist ein Kompositions- und Produktionsassistent für MIDI.
Erfinde selbständige, geschlossene Musik nach dem Auftrag des Nutzers. Achte auf Stimmführung, Dynamik (Velocity 1-127), Rhythmik und Artikulation.`;
const CONCEPT_SYSTEM=`Du bist Kompositionspartner. Formuliere ausschließlich einen kurzen musikalischen Entwurf in normalem Text. Antworte prägnant in 2 bis 4 Sätzen. Beschreibe nur den musikalischen Kern und eine mögliche Entwicklungsrichtung. Keine JSON-Daten, keine Notenlisten, keine Codeblöcke, keine vollständige Partitur und keine langen Gliederungen.`;
const DISCUSSION_SYSTEM=`Du bist ein musikalischer Analyse- und Kompositionspartner. Der Nutzer hat eine MIDI-Datei geladen und führt darüber ein fortlaufendes Gespräch mit dir.
Beziehe dich auf die konkrete MIDI-Datei und auf den gesamten bisherigen Gesprächsverlauf. Widersprich früheren eigenen Aussagen nicht stillschweigend: Wenn du deine Einschätzung änderst, benenne ausdrücklich, was du korrigierst und warum.
Trenne beobachtbare Befunde von ästhetischer Wertung. Behaupte keine musikalischen Eigenschaften, die sich aus MIDI-Daten oder Gesprächskontext nicht begründen lassen. Titel, Gattungsbezeichnung und Stilwunsch sind kein Qualitätsbeweis.
Antworte knapp und direkt. Normalerweise reichen 3 bis 6 Sätze bzw. höchstens etwa 120 Wörter. Vermeide lange Einleitungen, unnötige Überschriften, Wiederholungen und ausufernde Aufzählungen. Werde nur ausführlicher, wenn der Nutzer ausdrücklich eine ausführliche Analyse verlangt.
Hier wird noch keine Partitur verändert; es geht um Analyse, Kritik, Planung, Erklärung und musikalische Diskussion.`;
const TECHNICAL_PROMPT=`NOTATION UND AUSGABE:
- "d" = Notierter Wert in Viertelnoten-Beats (0.125, 0.25, 0.333333, 0.5, 0.666667, 0.75, 1, 1.5, 2, 3, 4, 6, 8).
- "g" = Gate/Klingdauer als Faktor (z.B. 0.95 = normal, 0.5 = staccato, 1.05 = legato).
- "st" = System (0=Standard, 1=Rechte Hand / oberes System, 2=Linke Hand / unteres System).
- Format: JSON mit folgender Struktur:
{
  "ti": "Titel",
  "bpm": 96,
  "ts": {"n": 4, "d": 4},
  "k": "e minor",
  "sm": "Kurze Zusammenfassung",
  "tr": [
    {"nm":"Piano","ch":0,"pg":0,"nt":[[0.0,1.0,60,80,1,0.95]],"ct":[]}
  ]
}
nt-Array: [StartBeat, Dauer, Pitch, Velocity, Staff, Gate] (Gate optional, Standard 0.95).
ct-Array: [Beat, CC, Wert].
Gib ausschließlich valides JSON aus.`;
const LEGACY_TECHNICAL_PROMPT=`NOTATION UND AUSGABE:
- "d" = Notierter Wert in Viertelnoten-Beats (0.125, 0.25, 0.333333, 0.5, 0.666667, 0.75, 1, 1.5, 2, 3, 4, 6, 8).
- "g" = Gate/Klingdauer als Faktor (z.B. 0.95 = normal, 0.5 = staccato, 1.05 = legato).
- "st" = System (0=Standard, 1=Rechte Hand / oberes System, 2=Linke Hand / unteres System).
- Format: JSON mit folgender Struktur:
{
  "ti": "Titel",
  "bpm": 96,
  "ts": {"n": 4, "d": 4},
  "k": "e minor",
  "sm": "Kurze Zusammenfassung",
  "tr": [
    {
      "nm": "Piano",
      "ch": 0,
      "pg": 0,
      "nt": [[0.0, 1.0, 60, 80, 1]],
      "ct": [[0.0, 64, 0]]
    }
  ]
}
nt-Array: [StartBeat, Dauer, Pitch, Velocity, Staff, Gate] (Gate ist optional, Standard 0.95).
ct-Array: [Beat, CC, Wert].
Gib ausschließlich valides JSON aus.`;
function extractJSON(str){str=String(str??'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const s=str.indexOf('{'),e=str.lastIndexOf('}');if(s<0||e<s)throw new Error('Kein valides JSON in Modellantwort gefunden.');return JSON.parse(str.slice(s,e+1))}
function providerName(p){return p==='gemini'?'Google / Gemini':p==='anthropic'?'Anthropic / Claude':p==='openai'?'OpenAI':p}
async function callLLM({provider,model,apiKey,reasoning='medium',systemPrompt,userPrompt,wantJson=false,maxOutputTokens=null}){
  if(!apiKey)throw new Error(`Bitte API-Key für ${providerName(provider)} eintragen.`);if(!model)throw new Error('Bitte ein KI-Modell auswählen.');
  if(provider==='anthropic'){const body={model,max_tokens:maxOutputTokens||32000,system:systemPrompt,messages:[{role:'user',content:userPrompt}],output_config:{effort:reasoning||'medium'}};const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`Anthropic HTTP ${r.status}`);return{text:(j.content||[]).filter(x=>x.type==='text').map(x=>x.text||'').join(''),usage:{in:j.usage?.input_tokens||0,out:j.usage?.output_tokens||0}}}
  if(provider==='gemini'){const cfg={maxOutputTokens:maxOutputTokens||(wantJson?32000:1200),thinkingConfig:{thinkingLevel:String(reasoning||'medium').toUpperCase()}};if(wantJson)cfg.responseMimeType='application/json';const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:userPrompt}]}],generationConfig:cfg})});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`Gemini HTTP ${r.status}`);return{text:j.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'',usage:{in:j.usageMetadata?.promptTokenCount||0,out:j.usageMetadata?.candidatesTokenCount||0}}}
  if(provider==='openai'){const body={model,messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],reasoning_effort:reasoning||'medium'};if(wantJson)body.response_format={type:'json_object'};const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${apiKey}`},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`OpenAI HTTP ${r.status}`);return{text:j.choices?.[0]?.message?.content||'',usage:{in:j.usage?.prompt_tokens||0,out:j.usage?.completion_tokens||0}}}
  throw new Error('Unbekannter KI-Anbieter.');
}
function assignment(req){
  const s=req.settings||{};
  let text=`VERBINDLICHE ECKDATEN (haben Vorrang vor widersprechenden Angaben im freien Auftrag):\nBesetzung: ${s.ensemble||'frei'}\nTakte des fertigen Stücks: ${s.measures||32}\nTaktart: ${s.meter||'4/4'}\nTempo: ${s.bpm||96} BPM\nTonart: ${s.key||'frei'}\n\nFreier musikalischer Auftrag (ergänzt die Eckdaten):\n${s.task||s.idea||'Komponiere ein eigenständiges Stück.'}`;
  const sourceInstruction=String(req.sourceInstruction||s.sourceInstruction||'').trim();
  if(req.source && sourceInstruction){
    text+=`\n\nVORHANDENES MIDI-MATERIAL (${req.sourceName||req.source.ti||'Vorlage'}):\n${JSON.stringify(req.source)}`;
    text+=`\n\nAUFTRAG FÜR DAS VORHANDENE MIDI-MATERIAL:\n${sourceInstruction}`;
    text+=`\n\nWICHTIG ZUM QUELLMATERIAL:\n- Behandle den Auftrag für das vorhandene MIDI-Material als konkrete Bearbeitungsanweisung.\n- Wenn der Nutzer bestimmte Takte unverändert übernehmen will, müssen deren Noten, Rhythmus und Stimmen bis zu dieser Grenze erhalten bleiben.\n- Wenn nur einzelne Motive, Stimmen, Basslinien oder Harmonien übernommen werden sollen, verwende nur diese genannten Bestandteile.\n- Komponiere Änderungen oder Fortsetzungen erst dort, wo der Nutzer sie verlangt.\n- Die fertige JSON-Partitur muss das vollständige Ergebnis enthalten, also auch ausdrücklich beizubehaltende Teile der Quelle.`;
  }
  return text;
}
function legacyAssignment(req){
  const s=req.settings||{};
  return `Besetzung: ${s.ensemble||'frei'}\nTakte: ${s.measures||32}\nTaktart: ${s.meter||'4/4'}\nTempo: ${s.bpm||96} BPM\nTonart: ${s.key||'frei'}\n\nAuftrag:\n${s.task||s.idea||'Komponiere ein eigenständiges Stück.'}`;
}
function wantsConceptOnly(req){
  const task=String(req?.settings?.task||req?.settings?.idea||'').trim().toLowerCase();
  if(!task)return false;
  const explicitCompose=/\b(?:komponier\w*|erzeug\w*\s+(?:eine\s+)?(?:midi|komposition|partitur|stück)|schreib\w*\s+(?:ein\w*\s+)?(?:stück|komposition)|fertig\w*\s+(?:stück|komposition)|als\s+midi|midi[- ]?datei)\b/i.test(task);
  const explicitSketch=/\b(?:musikalisch\w*\s+entwurf|kompositionsentwurf|kompositionsidee|musikalisch\w*\s+idee|musikalisch\w*\s+konzept|kompositionskonzept|musikalisch\w*\s+impuls)\b/i.test(task);
  const sketchVerb=/\b(?:entwirf\w*|entwickl\w*|formuliere\w*|erstelle\w*|skizziere\w*)\b/i.test(task);
  return explicitSketch && (sketchVerb || !explicitCompose) && !explicitCompose;
}
function discussionPrompt(req){
  const history=Array.isArray(req.history)?req.history:[];
  const transcript=history.map((m,i)=>`${i+1}. ${m.role==='assistant'?'KI':'NUTZER'}:\n${String(m.text||'')}`).join('\n\n');
  return `DATEI: ${req.sourceName||req.source?.ti||'MIDI-Datei'}\n\nMIDI-DATEN:\n${JSON.stringify(req.source||{})}\n\nBISHERIGER GESPRÄCHSVERLAUF:\n${transcript||'(noch kein vorheriger Dialog)'}\n\nNEUER BEITRAG DES NUTZERS:\n${String(req.question||'').trim()}\n\nAntworte als Fortsetzung genau dieses Gesprächs.`;
}
async function discuss(req){
  if(!req.source)throw new Error('Bitte zuerst eine MIDI-Datei laden.');
  if(!String(req.question||'').trim())throw new Error('Bitte zuerst eine Frage oder einen Auftrag eingeben.');
  const userPrompt=discussionPrompt(req);
  const r=await callLLM({provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium',systemPrompt:DISCUSSION_SYSTEM,userPrompt,wantJson:false});
  return{engineVersion:VERSION,engineBuild:BUILD,text:r.text,usage:r.usage,diagnostic:{kind:'midi-discussion',engineBuild:BUILD,systemPrompt:DISCUSSION_SYSTEM,userPrompt,history:Array.isArray(req.history)?req.history:[],question:req.question,response:r.text,sourceName:req.sourceName||'',source:req.source}};
}
async function compose(req){
  const common={provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium'};
  const conceptOnly=wantsConceptOnly(req);
  const currentAssignment=assignment(req);
  if(conceptOnly){
    const conceptUser=`Der Nutzer möchte ausdrücklich nur einen musikalischen Entwurf, noch keine Komposition.\n\n${currentAssignment}\n\nAntworte ausschließlich mit 2 bis 4 Sätzen normalem Text. Keine JSON-Daten, keine Notenliste und keine Partitur.`;
    const conceptRes=await callLLM({...common,systemPrompt:CONCEPT_SYSTEM,userPrompt:conceptUser,wantJson:false,maxOutputTokens:1200});
    if(typeof req.onConcept==='function')await req.onConcept({concept:conceptRes.text,conceptOnly:true,usage:conceptRes.usage});
    return{engineVersion:VERSION,engineBuild:BUILD,conceptOnly:true,concept:conceptRes.text,score:null,usage:{concept:conceptRes.usage,score:null},diagnostic:{kind:'concept-only',engineBuild:BUILD,systemPrompt:CONCEPT_SYSTEM,assignment:currentAssignment,sourceInstruction:req.sourceInstruction||req.settings?.sourceInstruction||'',conceptPrompt:conceptUser,compositionPrompt:null,conceptResponse:conceptRes.text,scoreResponse:null}};
  }
  const sourceInstruction=String(req.sourceInstruction||req.settings?.sourceInstruction||'').trim();
  const usesSource=!!(req.source&&sourceInstruction);
  const a=usesSource?currentAssignment:legacyAssignment(req);
  const conceptUser=`Formuliere einen kurzen musikalischen Gedanken/Impuls für folgenden Auftrag:\n\n${a}\n\nBleibe in diesem Schritt ausschließlich bei der musikalischen Planung. Erzeuge noch keine Partitur, keine JSON-Daten, keinen Programmcode und kein Skript zur MIDI-Erzeugung.`;
  const conceptRes=await callLLM({...common,systemPrompt:SYSTEM_PREFIX,userPrompt:conceptUser,wantJson:false,maxOutputTokens:32000});
  if(typeof req.onConcept==='function')await req.onConcept({concept:conceptRes.text,conceptOnly:false,usage:conceptRes.usage});
  const scorePrompt=usesSource?TECHNICAL_PROMPT:LEGACY_TECHNICAL_PROMPT;
  const compUser=`${scorePrompt}\n\nAUFTRAG:\n${a}\n\nDEIN KONZEPT:\n${conceptRes.text}\n\nGib jetzt die fertige JSON-Partitur aus.`;
  const scoreRes=await callLLM({...common,systemPrompt:SYSTEM_PREFIX,userPrompt:compUser,wantJson:true});
  const score=extractJSON(scoreRes.text);
  return{engineVersion:VERSION,engineBuild:BUILD,conceptOnly:false,concept:conceptRes.text,score,usage:{concept:conceptRes.usage,score:scoreRes.usage},diagnostic:{kind:'composition',engineBuild:BUILD,systemPrompt:SYSTEM_PREFIX,conceptSystemPrompt:SYSTEM_PREFIX,assignment:a,assignmentMode:usesSource?'source-aware':'legacy-universal-studio',technicalPromptMode:usesSource?'current':'legacy-universal-studio',sourceInstruction,conceptPrompt:conceptUser,compositionPrompt:compUser,conceptResponse:conceptRes.text,scoreResponse:scoreRes.text}};
}
window.CompositionLabEngine={VERSION,BUILD,SYSTEM_PREFIX,CONCEPT_SYSTEM,DISCUSSION_SYSTEM,TECHNICAL_PROMPT,LEGACY_TECHNICAL_PROMPT,callLLM,compose,discuss,discussionPrompt,extractJSON,assignment,legacyAssignment,wantsConceptOnly};
window.dispatchEvent(new CustomEvent('compositionlab-engine-ready',{detail:{version:VERSION,build:BUILD}}));
if(!window.__compositionLabStorageLoader){window.__compositionLabStorageLoader=true;const fresh=Date.now();const s=document.createElement('script');s.src='/Composer-Lab/shared/storage-engine.js?fresh='+fresh;s.onload=()=>{const a=document.createElement('script');a.src='/Composer-Lab/shared/storage-adapter.js?fresh='+fresh;(document.head||document.body).appendChild(a)};(document.head||document.body).appendChild(s)}
})();