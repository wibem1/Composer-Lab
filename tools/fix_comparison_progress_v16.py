from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Remove the earlier auxiliary comparison progress clock; the playback engine itself
# will now write to the correct comparison player controls.
s=re.sub(r'\n?<script id="comparison-progress-fix-v14">.*?</script>\n?', '\n', s, flags=re.S)

old_status="""    const isImport=(typeof uploadedScore!=='undefined' && score===uploadedScore);\n    const status=document.getElementById('playerStatus');"""
new_status="""    const isImport=(typeof uploadedScore!=='undefined' && score===uploadedScore);\n    let comparisonSide=null;\n    try{\n      if(window.compositionLabGetComparisonSource?.('A')===score) comparisonSide='A';\n      else if(window.compositionLabGetComparisonSource?.('B')===score) comparisonSide='B';\n    }catch(_){}\n    const status=document.getElementById(comparisonSide ? ('statusSource'+comparisonSide) : 'playerStatus');"""
if old_status in s:
    s=s.replace(old_status,new_status,1)

old_tick="""      const r=document.getElementById('playerSeek'), tt=document.getElementById('playerTime');\n      if(r) r.value=String(Math.round(frac*1000));\n      if(tt) tt.textContent=`${fmt(beat*activeSpb)} / ${fmt(activeMax*activeSpb)}`;"""
new_tick="""      const seekId=comparisonSide ? ('seekSource'+comparisonSide) : 'playerSeek';\n      const timeId=comparisonSide ? ('timeSource'+comparisonSide) : 'playerTime';\n      const r=document.getElementById(seekId), tt=document.getElementById(timeId);\n      if(r) r.value=String(Math.round(frac*1000));\n      if(tt) tt.textContent=`${fmt(beat*activeSpb)} / ${fmt(activeMax*activeSpb)}`;"""
if old_tick in s:
    s=s.replace(old_tick,new_tick,1)

# Give the comparison seek bars the same visual width behavior as the main player.
if '#sourceAPlayer #seekSourceA' not in s:
    s=s.replace('</style>', '''\n  #sourceAPlayer #seekSourceA, #sourceBPlayer #seekSourceB { flex:1 1 260px; width:auto; min-width:140px; }\n</style>''', 1)

# Cache-bust the service worker registration when present.
s=s.replace('service-worker.js?v=14','service-worker.js?v=16')
s=s.replace('service-worker.js?v=15','service-worker.js?v=16')
s=s.replace('service-worker.js?v=13','service-worker.js?v=16')

p.write_text(s,encoding='utf-8')
