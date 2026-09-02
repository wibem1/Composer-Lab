from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Route comparison playback explicitly instead of relying only on score object identity.
old="""    try{await playGMScore(sc,fromBeat);setStatus(w,'▶ Wiedergabe läuft.');}\n    catch(e){setStatus(w,'Player-Fehler: '+(e?.message||e));}"""
new="""    try{\n      window.__compositionLabComparisonPlaybackSide=w;\n      await playGMScore(sc,fromBeat);\n      setStatus(w,'▶ Wiedergabe läuft.');\n    }\n    catch(e){setStatus(w,'Player-Fehler: '+(e?.message||e));}\n    finally{window.__compositionLabComparisonPlaybackSide=null;}"""
if old in s:
    s=s.replace(old,new,1)

old_detect="""    let comparisonSide=null;\n    try{\n      if(window.compositionLabGetComparisonSource?.('A')===score) comparisonSide='A';\n      else if(window.compositionLabGetComparisonSource?.('B')===score) comparisonSide='B';\n    }catch(_){}"""
new_detect="""    let comparisonSide=window.__compositionLabComparisonPlaybackSide||null;\n    try{\n      if(!comparisonSide && window.compositionLabGetComparisonSource?.('A')===score) comparisonSide='A';\n      else if(!comparisonSide && window.compositionLabGetComparisonSource?.('B')===score) comparisonSide='B';\n    }catch(_){}"""
if old_detect in s:
    s=s.replace(old_detect,new_detect,1)

# Keep comparison players' own progress/time controls authoritative during comparison playback.
# Also initialise duration as soon as playback starts so the user sees a live target immediately.
needle="""    playerPlaying=true; playerPaused=false;\n    if(status) status.textContent=lowMemoryImport?'Wiedergabe läuft (speicherschonende Vorschau).':'Wiedergabe läuft.';"""
repl="""    playerPlaying=true; playerPaused=false;\n    if(comparisonSide){\n      const rr=document.getElementById('seekSource'+comparisonSide);\n      const tt=document.getElementById('timeSource'+comparisonSide);\n      if(rr) rr.value=String(Math.round((activeMax?activeStart/activeMax:0)*1000));\n      if(tt) tt.textContent=`${fmt(activeStart*activeSpb)} / ${fmt(activeMax*activeSpb)}`;\n    }\n    if(status) status.textContent=lowMemoryImport?'Wiedergabe läuft (speicherschonende Vorschau).':'Wiedergabe läuft.';"""
if needle in s:
    s=s.replace(needle,repl,1)

# Cache bust.
for v in ['13','14','15','16']:
    s=s.replace(f'service-worker.js?v={v}', 'service-worker.js?v=17')

p.write_text(s,encoding='utf-8')
