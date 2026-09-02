from pathlib import Path
import re
p=Path('index.html')
s=p.read_text()
pat=r'(?:\s*<details style="grid-column:1 / -1;" class="foldbox" id="validationSection">\s*<summary>Technische Analyse &amp; Validierung</summary>\s*<div class="foldcontent"><pre id="validation">Noch keine Komposition geprüft\.</pre></div>\s*</details>\s*)+'
canonical='''\n\n  <details style="grid-column:1 / -1;" class="foldbox" id="validationSection">\n    <summary>Technische Analyse &amp; Validierung</summary>\n    <div class="foldcontent"><pre id="validation">Noch keine Komposition geprüft.</pre></div>\n  </details>\n\n'''
s,n=re.subn(pat,canonical,s,count=1,flags=re.S)
if n!=1: raise SystemExit('validation block not found')
p.write_text(s)
