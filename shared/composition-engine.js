(()=>{
'use strict';
const VERSION='shared-engine-2.0';
const BUILD=14;
const SYSTEM_PREFIX=`Du bist ein Kompositions- und Produktionsassistent für MIDI.
Erfinde selbständige, geschlossene Musik nach dem Auftrag des Nutzers. Achte auf Stimmführung, Dynamik (Velocity 1-127), Rhythmik und Artikulation.`;
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
const CONCEPT_SYSTEM=`Du bist Kompositionspartner. Formuliere ausschließlich einen kurzen musikalischen Entwurf in normalem Text. Antworte prägnant in 2 bis 4 Sätzen. Beschreibe nur den musikalischen Kern und eine mögliche Entwicklungsrichtung. Keine JSON-Daten, keine Notenlisten, keine Codeblöcke, keine vollständige Partitur und keine langen Gliederungen.`;
const DISCUSSION_SYSTEM=`Du bist ein musikalischer Analyse- und Kompositionspartner. Der Nutzer hat eine MIDI-Datei geladen und führt darüber ein fortlaufendes Gespräch mit dir.
Beziehe dich auf die konkrete MIDI-Datei und auf den gesamten bisherigen Gesprächsverlauf. Widersprich früheren eigenen Aussagen nicht stillschweigend: Wenn du deine Einschätzung änderst, benenne ausdrücklich, was du korrigierst und warum.
Trenne beobachtbare Befunde von ästhetischer Wertung. Behaupte keine musikalischen Eigenschaften, die sich aus MIDI-Daten oder Gesprächskontext nicht begründen lassen. Titel, Gattungsbezeichnung und Stilwunsch sind kein Qualitätsbeweis.
Antworte knapp und direkt. Normalerweise reichen 3 bis 6 Sätze bzw. höchstens etwa 120 Wörter. Vermeide lange Einleitungen, unnötige Überschriften, Wiederholungen und ausufernde Aufzählungen. Werde nur ausführlicher, wenn der Nutzer ausdrücklich eine ausführliche Analyse verlangt.
Hier wird noch keine Partitur verändert; es geht um Analyse, Kritik, Planung, Erklärung und musikalische Diskussion.`;

function extractJSON(str){
  str=String(str??'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const s=str.indexOf('{'),e=str.lastIndexOf('}');
  if(s<0||e<s)throw new Error('Kein valides JSON in Modellantwort gefunden.');
  return JSON.parse(str.slice(s,e+1));
}
function providerName(p){return p==='gemini'?'Google / Gemini':p==='anthropic'?'Anthropic / Claude':p==='openai'?'OpenAI':p}

async function callLLM({provider,model,apiKey,reasoning='medium',systemPrompt,userPrompt,wantJson=false}){
  if(!apiKey)throw new Error(`Bitte API-Key für ${providerName(provider)} eintragen.`);
  if(!model)throw new Error('Bitte ein KI-Modell auswählen.');
  if(provider==='anthropic'){
    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model,max_tokens:32000,output_config:{effort:reasoning||'medium'},system:systemPrompt,messages:[{role:'user',content:userPrompt}]})
    });
    const data=await r.json();
    if(!r.ok)throw new Error(data?.error?.message||`Anthropic HTTP ${r.status}`);
    const text=data.content?.filter(x=>x.type==='text').map(x=>x.text).join('')||'';
    return{text,usage:{in:data.usage?.input_tokens||0,out:data.usage?.output_tokens||0}};
  }
  if(provider==='gemini'){
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const cfg={maxOutputTokens:32000,thinkingConfig:{thinkingLevel:String(reasoning||'medium').toUpperCase()}};
    if(wantJson)cfg.responseMimeType='application/json';
    const r=await fetch(url,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:userPrompt}]}],generationConfig:cfg})
    });
    const data=await r.json();
    if(!r.ok)throw new Error(data?.error?.message||`Gemini HTTP ${r.status}`);
    const text=data.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';
    return{text,usage:{in:data.usageMetadata?.promptTokenCount||0,out:data.usageMetadata?.candidatesTokenCount||0}};
  }
  if(provider==='openai'){
    const reqBody={model,messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],reasoning_effort:reasoning||'medium'};
    if(wantJson)reqBody.response_format={type:'json_object'};
    const r=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'content-type':'application/json','authorization':`Bearer ${apiKey}`},
      body:JSON.stringify(reqBody)
    });
    const data=await r.json();
    if(!r.ok)throw new Error(data?.error?.message||`OpenAI HTTP ${r.status}`);
    const text=data.choices?.[0]?.message?.content||'';
    return{text,usage:{in:data.usage?.prompt_tokens||0,out:data.usage?.completion_tokens||0}};
  }
  throw new Error('Unbekannter KI-Anbieter.');
}

function legacyPromptText(req){
  const s=req.settings||{};
  let text=`Besetzung: ${s.ensemble??'frei'}\nTakte: ${s.measures??32}\nTaktart: ${s.meter??'4/4'}\nTempo: ${s.bpm??96} BPM\nTonart: ${s.key??'frei'}\n\nAuftrag:\n${s.task??s.idea??''}`;
  if(req.source){
    text+=`\n\nVORHANDENES MATERIAL (${req.sourceName||''}):\n`+JSON.stringify(req.source);
  }
  return text;
}

function wantsConceptOnly(req){
  const task=String(req?.settings?.task||req?.settings?.idea||'').trim().toLowerCase();
  if(!task)return false;
  const explicitCompose=/\b(?:komponier\w*|erzeug\w*\s+(?:eine\s+)?(?:midi|komposition|partitur|stück)|schreib\w*\s+(?:ein\w*\s+)?(?:stück|komposition)|fertig\w*\s+(?:stück|komposition)|als\s+midi|midi[- ]?datei)\b/i.test(task);
  const explicitSketch=/\b(?:musikalisch\w*\s+entwurf|kompositionsentwurf|kompositionsidee|musikalisch\w*\s+idee|musikalisch\w*\s+konzept|kompositionskonzept|musikalisch\w*\s+impuls)\b/i.test(task);
  const sketchVerb=/\b(?:entwirf\w*|entwickl\w*|formuliere\w*|erstelle\w*|skizziere\w*)\b/i.test(task);
  return explicitSketch&&(sketchVerb||!explicitCompose)&&!explicitCompose;
}

async function compose(req){
  if(wantsConceptOnly(req)){
    const a=legacyPromptText({...req,source:null});
    const conceptUser=`Der Nutzer möchte ausdrücklich nur einen musikalischen Entwurf, noch keine Komposition.\n\n${a}\n\nAntworte ausschließlich mit 2 bis 4 Sätzen normalem Text. Keine JSON-Daten, keine Notenliste und keine Partitur.`;
    const conceptRes=await callLLM({provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium',systemPrompt:CONCEPT_SYSTEM,userPrompt:conceptUser,wantJson:false});
    if(typeof req.onConcept==='function')await req.onConcept({concept:conceptRes.text,conceptOnly:true,usage:conceptRes.usage});
    return{engineVersion:VERSION,engineBuild:BUILD,conceptOnly:true,concept:conceptRes.text,score:null,usage:{concept:conceptRes.usage,score:null},diagnostic:{kind:'concept-only',engineBuild:BUILD,systemPrompt:CONCEPT_SYSTEM,assignment:a,conceptPrompt:conceptUser,compositionPrompt:null,conceptResponse:conceptRes.text,scoreResponse:null}};
  }

  const promptText=legacyPromptText(req);
  const conceptPrompt=`Formuliere einen kurzen musikalischen Gedanken/Impuls für folgenden Auftrag:\n\n${promptText}`;
  const conceptRes=await callLLM({provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium',systemPrompt:SYSTEM_PREFIX,userPrompt:conceptPrompt,wantJson:false});
  if(typeof req.onConcept==='function')await req.onConcept({concept:conceptRes.text||'',conceptOnly:false,usage:conceptRes.usage});

  const compPrompt=`${TECHNICAL_PROMPT}\n\nAUFTRAG:\n${promptText}\n\nDEIN KONZEPT:\n${conceptRes.text}\n\nGib jetzt die fertige JSON-Partitur aus.`;
  const scoreRes=await callLLM({provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium',systemPrompt:SYSTEM_PREFIX,userPrompt:compPrompt,wantJson:true});
  const score=extractJSON(scoreRes.text);
  return{
    engineVersion:VERSION,engineBuild:BUILD,conceptOnly:false,concept:conceptRes.text||'',score,
    usage:{concept:conceptRes.usage,score:scoreRes.usage},
    diagnostic:{kind:'composition',engineBuild:BUILD,engineMode:'exact-old-apk-universal-studio',systemPrompt:SYSTEM_PREFIX,conceptSystemPrompt:SYSTEM_PREFIX,assignment:promptText,assignmentMode:'exact-old-apk',technicalPromptMode:'exact-old-apk',conceptPrompt,compositionPrompt:compPrompt,conceptResponse:conceptRes.text,scoreResponse:scoreRes.text}
  };
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

window.CompositionLabEngine={VERSION,BUILD,SYSTEM_PREFIX,TECHNICAL_PROMPT,CONCEPT_SYSTEM,DISCUSSION_SYSTEM,callLLM,compose,discuss,discussionPrompt,extractJSON,legacyPromptText,wantsConceptOnly};
window.dispatchEvent(new CustomEvent('compositionlab-engine-ready',{detail:{version:VERSION,build:BUILD}}));
if(!window.__compositionLabStorageLoader){window.__compositionLabStorageLoader=true;const fresh=Date.now();const s=document.createElement('script');s.src='/Composer-Lab/shared/storage-engine.js?fresh='+fresh;s.onload=()=>{const a=document.createElement('script');a.src='/Composer-Lab/shared/storage-adapter.js?fresh='+fresh;(document.head||document.body).appendChild(a)};(document.head||document.body).appendChild(s)}
})();