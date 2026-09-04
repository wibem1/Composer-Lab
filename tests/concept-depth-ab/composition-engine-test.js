(()=>{
'use strict';
const VERSION='shared-engine-1.5';
const BUILD=9;
const TEST_VARIANT='concept-depth-ab-detailed-plan';
const SYSTEM_PREFIX=`Du bist ein Kompositions- und Produktionsassistent für MIDI.
Erfinde selbständige, geschlossene Musik nach dem Auftrag des Nutzers. Achte auf Stimmführung, Dynamik (Velocity 1-127), Rhythmik und Artikulation.`;
const CONCEPT_SYSTEM=`Du bist Kompositionspartner. Formuliere ausschließlich einen kurzen musikalischen Entwurf in normalem Text. Antworte prägnant in 2 bis 4 Sätzen. Beschreibe nur den musikalischen Kern und eine mögliche Entwicklungsrichtung. Keine JSON-Daten, keine Notenlisten, keine Codeblöcke, keine vollständige Partitur und keine langen Gliederungen.`;
const DETAILED_CONCEPT_SYSTEM=`Du bist Kompositionspartner. Entwickle vor der eigentlichen Komposition einen musikalisch konkreten, ausführlichen Entwurf. Plane selbständig aus dem Auftrag heraus Motivik, Formverlauf, harmonische Entwicklung, Register, Dynamik, Artikulation, Begleit- oder Stimmkonzept und den dramaturgischen Bogen, soweit dies für das Stück musikalisch sinnvoll ist. Lege dich konkret genug fest, dass der Entwurf als tragfähiger Kompositionsplan dienen kann, ohne bereits eine vollständige Partitur oder JSON-Daten auszugeben. Keine Codeblöcke und keine vollständigen Notenlisten.`;
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
function extractJSON(str){str=String(str??'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const s=str.indexOf('{'),e=str.lastIndexOf('}');if(s<0||e<s)throw new Error('Kein valides JSON in Modellantwort gefunden.');return JSON.parse(str.slice(s,e+1))}
async function callLLM({model,apiKey,reasoning='medium',systemPrompt,userPrompt,wantJson=false}){
  if(!apiKey)throw new Error('Bitte Google/Gemini API-Key eintragen.');
  const cfg={maxOutputTokens:wantJson?32000:1200,thinkingConfig:{thinkingLevel:String(reasoning||'medium').toUpperCase()}};
  if(wantJson)cfg.responseMimeType='application/json';
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:userPrompt}]}],generationConfig:cfg})});
  const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||`Gemini HTTP ${r.status}`);
  return{text:j.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'',usage:{in:j.usageMetadata?.promptTokenCount||0,out:j.usageMetadata?.candidatesTokenCount||0}};
}
function assignment(s){return `VERBINDLICHE ECKDATEN (haben Vorrang vor widersprechenden Angaben im freien Auftrag):\nBesetzung: ${s.ensemble||'frei'}\nTakte des fertigen Stücks: ${s.measures||32}\nTaktart: ${s.meter||'4/4'}\nTempo: ${s.bpm||96} BPM\nTonart: ${s.key||'frei'}\n\nFreier musikalischer Auftrag (ergänzt die Eckdaten):\n${s.task||'Komponiere ein eigenständiges Stück.'}`}
async function compose(req){
  const a=assignment(req.settings||{}),common={model:req.model,apiKey:req.apiKey,reasoning:req.reasoning||'medium'};
  const conceptUser=`Entwickle als Vorbereitung auf die spätere Komposition einen ausführlichen musikalischen Entwurf für den folgenden Auftrag. Plane das Stück selbständig und konkret genug, dass du diesen Entwurf anschließend als Grundlage für die eigentliche Komposition verwenden kannst.\n\n${a}\n\nKeine JSON-Daten und keine vollständige Partitur.`;
  const conceptRes=await callLLM({...common,systemPrompt:DETAILED_CONCEPT_SYSTEM,userPrompt:conceptUser,wantJson:false});
  const compUser=`${TECHNICAL_PROMPT}\n\nAUFTRAG:\n${a}\n\nDEIN MUSIKALISCHER ENTWURF:\n${conceptRes.text}\n\nGib jetzt die fertige JSON-Partitur aus.`;
  const scoreRes=await callLLM({...common,systemPrompt:SYSTEM_PREFIX,userPrompt:compUser,wantJson:true});
  return{engineVersion:VERSION,engineBuild:BUILD,testVariant:TEST_VARIANT,concept:conceptRes.text,score:extractJSON(scoreRes.text),usage:{concept:conceptRes.usage,score:scoreRes.usage},diagnostic:{kind:'composition',engineBuild:BUILD,testVariant:TEST_VARIANT,settings:req.settings,model:req.model,reasoning:req.reasoning,conceptSystemPrompt:DETAILED_CONCEPT_SYSTEM,conceptPrompt:conceptUser,conceptResponse:conceptRes.text,compositionSystemPrompt:SYSTEM_PREFIX,compositionPrompt:compUser,scoreResponse:scoreRes.text}};
}
window.CompositionLabTestEngine={VERSION,BUILD,TEST_VARIANT,compose};
})();