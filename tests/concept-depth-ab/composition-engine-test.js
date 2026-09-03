(()=>{
'use strict';
const VERSION='shared-engine-1.5';
const BUILD=9;
const TEST_VARIANT='concept-depth-ab-universal-studio-exact';
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
function extractJSON(str){str=String(str??'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const s=str.indexOf('{'),e=str.lastIndexOf('}');if(s<0||e<s)throw new Error('Kein valides JSON in Modellantwort gefunden.');return JSON.parse(str.slice(s,e+1))}
async function callLLM({model,apiKey,reasoning='medium',systemPrompt,userPrompt,wantJson=false}){
  if(!apiKey)throw new Error('Bitte Google/Gemini API-Key eintragen.');
  const cfg={maxOutputTokens:32000,thinkingConfig:{thinkingLevel:String(reasoning||'medium').toUpperCase()}};
  if(wantJson)cfg.responseMimeType='application/json';
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:userPrompt}]}],generationConfig:cfg})});
  const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`Gemini HTTP ${r.status}`);
  return{text:j.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'',usage:{in:j.usageMetadata?.promptTokenCount||0,out:j.usageMetadata?.candidatesTokenCount||0}};
}
function originalPromptText(s){return `Besetzung: ${s.ensemble}\nTakte: ${s.measures}\nTaktart: ${s.meter}\nTempo: ${s.bpm} BPM\nTonart: ${s.key}\n\nAuftrag:\n${s.task}`}
async function compose(req){
  const promptText=originalPromptText(req.settings||{}),common={model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium'};
  const conceptUser=`Formuliere einen kurzen musikalischen Gedanken/Impuls für folgenden Auftrag:\n\n${promptText}`;
  const conceptRes=await callLLM({...common,systemPrompt:SYSTEM_PREFIX,userPrompt:conceptUser,wantJson:false});
  const compUser=`${TECHNICAL_PROMPT}\n\nAUFTRAG:\n${promptText}\n\nDEIN KONZEPT:\n${conceptRes.text}\n\nGib jetzt die fertige JSON-Partitur aus.`;
  const scoreRes=await callLLM({...common,systemPrompt:SYSTEM_PREFIX,userPrompt:compUser,wantJson:true});
  return{engineVersion:VERSION,engineBuild:BUILD,testVariant:TEST_VARIANT,concept:conceptRes.text,score:extractJSON(scoreRes.text),usage:{concept:conceptRes.usage,score:scoreRes.usage},diagnostic:{kind:'composition',engineBuild:BUILD,testVariant:TEST_VARIANT,settings:req.settings,model:req.model,reasoning:req.reasoning,promptText,conceptSystemPrompt:SYSTEM_PREFIX,conceptPrompt:conceptUser,conceptResponse:conceptRes.text,compositionSystemPrompt:SYSTEM_PREFIX,technicalPrompt:TECHNICAL_PROMPT,compositionPrompt:compUser,scoreResponse:scoreRes.text}};
}
window.CompositionLabTestEngine={VERSION,BUILD,TEST_VARIANT,compose};
})();