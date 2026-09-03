(()=>{
'use strict';
const VERSION='shared-engine-1.0';
const BUILD=2;
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
    {"nm":"Piano","ch":0,"pg":0,"nt":[[0.0,1.0,60,80,1,0.95]],"ct":[]}
  ]
}
nt-Array: [StartBeat, Dauer, Pitch, Velocity, Staff, Gate] (Gate optional, Standard 0.95).
ct-Array: [Beat, CC, Wert].
Gib ausschließlich valides JSON aus.`;

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
    const body={model,max_tokens:32000,system:systemPrompt,messages:[{role:'user',content:userPrompt}]};
    body.output_config={effort:reasoning||'medium'};
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});
    const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`Anthropic HTTP ${r.status}`);
    return {text:(j.content||[]).filter(x=>x.type==='text').map(x=>x.text||'').join(''),usage:{in:j.usage?.input_tokens||0,out:j.usage?.output_tokens||0}};
  }
  if(provider==='gemini'){
    const cfg={maxOutputTokens:32000,thinkingConfig:{thinkingLevel:String(reasoning||'medium').toUpperCase()}};if(wantJson)cfg.responseMimeType='application/json';
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:userPrompt}]}],generationConfig:cfg})});
    const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`Gemini HTTP ${r.status}`);
    return {text:j.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'',usage:{in:j.usageMetadata?.promptTokenCount||0,out:j.usageMetadata?.candidatesTokenCount||0}};
  }
  if(provider==='openai'){
    const body={model,messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],reasoning_effort:reasoning||'medium'};if(wantJson)body.response_format={type:'json_object'};
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${apiKey}`},body:JSON.stringify(body)});
    const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`OpenAI HTTP ${r.status}`);
    return {text:j.choices?.[0]?.message?.content||'',usage:{in:j.usage?.prompt_tokens||0,out:j.usage?.completion_tokens||0}};
  }
  throw new Error('Unbekannter KI-Anbieter.');
}
function assignment(req){
  const s=req.settings||{};
  let text=`VERBINDLICHE ECKDATEN (haben Vorrang vor widersprechenden Angaben im freien Auftrag):\nBesetzung: ${s.ensemble||'frei'}\nTakte des fertigen Stücks: ${s.measures||32}\nTaktart: ${s.meter||'4/4'}\nTempo: ${s.bpm||96} BPM\nTonart: ${s.key||'frei'}\n\nFreier musikalischer Auftrag (ergänzt die Eckdaten):\n${s.task||s.idea||'Komponiere ein eigenständiges Stück.'}`;
  if(req.source)text+=`\n\nVORHANDENES MATERIAL (${req.sourceName||req.source.ti||'Vorlage'}):\n${JSON.stringify(req.source)}`;
  return text;
}
async function compose(req){
  const a=assignment(req);
  const common={provider:req.provider,model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium'};
  const conceptUser=`Formuliere einen kurzen musikalischen Gedanken/Impuls für folgenden Auftrag:\n\n${a}`;
  const conceptRes=await callLLM({...common,systemPrompt:SYSTEM_PREFIX,userPrompt:conceptUser,wantJson:false});
  const compUser=`${TECHNICAL_PROMPT}\n\nAUFTRAG:\n${a}\n\nDEIN KONZEPT:\n${conceptRes.text}\n\nGib jetzt die fertige JSON-Partitur aus.`;
  const scoreRes=await callLLM({...common,systemPrompt:SYSTEM_PREFIX,userPrompt:compUser,wantJson:true});
  const score=extractJSON(scoreRes.text);
  return {engineVersion:VERSION,engineBuild:BUILD,concept:conceptRes.text,score,usage:{concept:conceptRes.usage,score:scoreRes.usage},diagnostic:{engineBuild:BUILD,systemPrompt:SYSTEM_PREFIX,assignment:a,conceptPrompt:conceptUser,compositionPrompt:compUser,conceptResponse:conceptRes.text,scoreResponse:scoreRes.text}};
}
window.CompositionLabEngine={VERSION,BUILD,SYSTEM_PREFIX,TECHNICAL_PROMPT,callLLM,compose,extractJSON,assignment};
window.dispatchEvent(new CustomEvent('compositionlab-engine-ready',{detail:{version:VERSION,build:BUILD}}));
})();