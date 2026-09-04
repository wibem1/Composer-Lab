from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Remove the redundant imported-MIDI play button. Imported material is already routed
# to the main player when selected.
s=s.replace('''      <button type="button" class="secondary smallbtn" id="playImportedBtn" disabled>▶ Im Player anhören</button>\n''','',1)

# Replace the fixed compare/synthesis controls with a free-form AI chat.
start='''              <div class="toolbar" style="margin-top:12px"><button type="button" class="secondary" id="aiCompareBtn">Mit KI vergleichen</button></div>\n              <div id="aiCompareResult" class="resultcard">Noch kein KI-Vergleich.</div>\n              <label for="synthesisPrompt">Syntheseauftrag</label>\n              <textarea id="synthesisPrompt" placeholder="z. B. Übernimm das Hauptmotiv aus A und das Begleitmuster aus B. Entwickle daraus ein eigenständiges 32-taktiges Stück."></textarea>\n              <div class="toolbar"><button type="button" class="secondary" id="suggestSynthesisBtn">KI-Vorschlag erstellen</button><button type="button" class="primary" style="width:auto;margin-top:0" id="useSynthesisBtn">Als Kompositionsauftrag übernehmen</button></div>'''
repl='''              <div id="sourceChatLog" class="chatlog" style="margin-top:12px;max-height:360px;">
                <div class="chatai chatmsg">Frage die KI frei zu Quelle A, Quelle B oder beiden. Du entscheidest selbst, ob du ein Stück analysieren, zwei Stücke vergleichen, Verbesserungsvorschläge erhalten oder einen neuen Kompositionsgedanken entwickeln möchtest.</div>
              </div>
              <div class="chatrow">
                <textarea id="sourceChatInput" style="min-height:70px;" placeholder="z. B. „Analysiere Quelle A“, „Vergleiche A und B“ oder eine beliebige eigene Frage …"></textarea>
                <button id="sourceChatSendBtn" class="secondary" type="button">Senden</button>
              </div>
              <div class="toolbar" style="margin-top:8px;">
                <button id="sourceChatUseBtn" class="secondary smallbtn" type="button" disabled>Letzte KI-Antwort als Kompositionsauftrag übernehmen</button>
              </div>'''
if start in s:
    s=s.replace(start,repl,1)

# Update the section wording to match the open-ended workflow.
s=s.replace('<summary>Vergleich & Synthese</summary>','<summary>Musik untersuchen & vergleichen</summary>',1)
s=s.replace('Zwei beliebige Stücke oder Vorlagen gegenüberstellen, anhören, von der KI analysieren lassen und daraus einen neuen Kompositionsauftrag entwickeln.',
            'Ein oder zwei beliebige Stücke oder Vorlagen laden und der KI dazu frei Fragen stellen. Analyse, Vergleich, Kritik, Verbesserungsideen oder Weiterentwicklung bestimmst du selbst.',1)

if 'free-source-chat-v20' not in s:
    script=r'''
<script id="free-source-chat-v20">
(()=>{
  const $=id=>document.getElementById(id);
  const log=$('sourceChatLog'), input=$('sourceChatInput'), send=$('sourceChatSendBtn'), use=$('sourceChatUseBtn');
  if(!log||!input||!send) return;
  let lastAnswer='';

  function append(role,text){
    const d=document.createElement('div');
    d.className='chatmsg '+(role==='user'?'chatuser':'chatai');
    d.textContent=text;
    log.appendChild(d); log.scrollTop=log.scrollHeight;
  }
  function sourceName(w){
    const card=$('source'+w+'Card');
    return card?.querySelector('strong')?.textContent?.trim() || ('Quelle '+w);
  }
  function compact(score){
    if(!score) return null;
    const out={ti:score.ti||'',sm:score.sm||'',bpm:score.bpm||96,ts:score.ts||null,k:score.k||'',tr:[]};
    const tracks=Array.isArray(score.tr)?score.tr:[];
    const total=tracks.reduce((n,t)=>n+(Array.isArray(t?.nt)?t.nt.length:0),0);
    const cap=7000, ratio=total>cap?cap/total:1;
    for(const t of tracks){
      const notes=Array.isArray(t?.nt)?t.nt:[];
      let kept=notes;
      if(ratio<1 && notes.length){
        const n=Math.max(24,Math.floor(notes.length*ratio)); kept=[];
        const step=notes.length/n;
        for(let i=0;i<n;i++) kept.push(notes[Math.min(notes.length-1,Math.floor(i*step))]);
      }
      out.tr.push({nm:t.nm||t.n||'',ch:t.ch,pg:t.pg,nt:kept,ct:Array.isArray(t.ct)?t.ct.slice(0,1200):[]});
    }
    return out;
  }
  async function ask(){
    const q=input.value.trim(); if(!q) return;
    const a=window.compositionLabGetComparisonSource?.('A')||null;
    const b=window.compositionLabGetComparisonSource?.('B')||null;
    if(!a&&!b){ append('ai','Bitte zuerst mindestens Quelle A oder Quelle B laden.'); return; }
    const provider=$('provider')?.value||'', model=$('model')?.value?.trim()||'', key=$('apiKey')?.value?.trim()||'';
    if(!key){ append('ai','Bitte zuerst den API-Key der gewählten KI eingeben.'); return; }
    append('user',q); input.value=''; send.disabled=true;
    append('ai','KI beschäftigt sich mit deiner Frage …');
    const pending=log.lastElementChild;
    try{
      let material='';
      if(a) material+=`\n\nQUELLE A – ${sourceName('A')}:\n${JSON.stringify(compact(a))}`;
      if(b) material+=`\n\nQUELLE B – ${sourceName('B')}:\n${JSON.stringify(compact(b))}`;
      const system='Du bist ein musikalischer Analyse- und Kompositionspartner. Der Nutzer entscheidet selbst, was er über die geladenen MIDI-Stücke wissen oder tun möchte. Antworte genau auf seine freie Frage. Analysiere, vergleiche, kritisiere oder entwickle nur das, wonach gefragt wurde. Schreibe musikalisch verständlich und vermeide unnötige technische MIDI-Zahlen.';
      const task=`FRAGE DES NUTZERS:\n${q}${material}`;
      const res=await callLLM(provider,model,key,system,task,false);
      lastAnswer=(res&&typeof res==='object'?res.text:res)||'Keine Antwort erhalten.';
      pending.textContent=lastAnswer;
      if(use) use.disabled=!lastAnswer.trim();
    }catch(e){ pending.textContent='Fehler: '+(e?.message||e); }
    finally{ send.disabled=false; }
  }
  send.addEventListener('click',ask);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask();}});
  if(use) use.addEventListener('click',()=>{
    if(!lastAnswer.trim()) return;
    const p=$('prompt'); if(p) p.value=lastAnswer.trim();
    const a=window.compositionLabGetComparisonSource?.('A')||null;
    const b=window.compositionLabGetComparisonSource?.('B')||null;
    window.comparisonSynthesisSources={
      a:a?JSON.parse(JSON.stringify(a)):null,
      b:b?JSON.parse(JSON.stringify(b)):null,
      nameA:a?sourceName('A'):'', nameB:b?sourceName('B'):''
    };
    try{saveCurrentState();}catch(_){}
    const st=$('status'); if(st) st.innerHTML='<span class="ok">Letzte KI-Antwort als Kompositionsauftrag übernommen.</span>';
  });
})();
</script>
'''
    s=s.replace('</body>',script+'\n</body>',1)

# Disable obsolete fixed buttons if a legacy fragment survives for any reason.
for bid in ['aiCompareBtn','suggestSynthesisBtn','useSynthesisBtn']:
    s=s.replace(f'id="{bid}"',f'id="{bid}" style="display:none"',1) if f'id="{bid}"' in s and 'sourceChatSendBtn' not in s else s

# Bump service worker URL so installed PWAs request the new document promptly.
s=re.sub(r'navigator\.serviceWorker\.register\("\./service-worker\.js\?v=\d+"\)', 'navigator.serviceWorker.register("./service-worker.js?v=20")', s)
p.write_text(s,encoding='utf-8')
