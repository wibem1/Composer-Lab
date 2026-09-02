from pathlib import Path
p=Path('index.html')
s=p.read_text()
needle='''        <div class="uploadinfo" style="margin-bottom:9px;">Länge der experimentellen Vorlage. Sie ist vollständig unabhängig von der oben eingestellten Länge des fertigen Stücks.</div>'''
insert=needle+'''\n        <div class="row">\n          <div>\n            <label for="labInstrumentCount">Anzahl Instrumente</label>\n            <select id="labInstrumentCount">\n              <option value="1">1 Instrument</option>\n              <option value="2" selected>2 Instrumente</option>\n              <option value="3">3 Instrumente</option>\n              <option value="4">4 Instrumente</option>\n            </select>\n          </div>\n          <div>\n            <label for="labInstrumentCombo">Instrumentenkombination</label>\n            <select id="labInstrumentCombo"></select>\n          </div>\n        </div>'''
if 'id="labInstrumentCount"' not in s:
    if needle not in s: raise SystemExit('template length marker not found')
    s=s.replace(needle,insert,1)
# Make experiment-history transfer robust even if template was not played first.
s=s.replace('if($("templateUseBtn")) $("templateUseBtn").addEventListener("click",()=>{if(window.__currentLabTemplateScore)addExperimentHistory(window.__currentLabTemplateScore,"KI-Entwurf")});', 'if($("templateUseBtn")) $("templateUseBtn").addEventListener("click",()=>setTimeout(()=>{if(uploadedScore)addExperimentHistory(uploadedScore,"KI-Entwurf")},0));')
p.write_text(s)
