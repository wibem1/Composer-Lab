from pathlib import Path
import re

ROOT = Path('index.html')
IPAD = Path('ipad/index.html')
ROOT_BOOTSTRAP = '''<script id="compositionLabFreshBootstrap">
(()=>{
  const stamp=Date.now();
  const load=(src)=>{const s=document.createElement('script');s.async=false;s.src=src+(src.includes('?')?'&':'?')+'fresh='+stamp;(document.head||document.body).appendChild(s);};
  load('workspace-repair-v21.js');
  load('diagnostics-v2.js');
})();
</script>'''
IPAD_TAG = '<script src="../diagnostics-v2.js?v=20260903-21"></script>'


def insert_before_body(text: str, tag: str) -> str:
    marker = '</body>'
    if marker not in text:
        raise RuntimeError('Kein </body> gefunden')
    return text.replace(marker, tag + '\n' + marker, 1)


root = ROOT.read_text(encoding='utf-8')
# Alte statische Loader und einen eventuell schon vorhandenen Fresh-Bootstrap entfernen.
root = re.sub(r'<script[^>]+src=["\']diagnostics-v2\.js[^>]*></script>\s*', '', root, flags=re.I)
root = re.sub(r'<script[^>]+src=["\']workspace-repair-v21\.js[^>]*></script>\s*', '', root, flags=re.I)
root = re.sub(r'<script id=["\']compositionLabFreshBootstrap["\']>.*?</script>\s*', '', root, flags=re.I|re.S)
root = insert_before_body(root, ROOT_BOOTSTRAP)
ROOT.write_text(root, encoding='utf-8')

ipad = IPAD.read_text(encoding='utf-8')
ipad = ipad.replace('stable=20260903-15', 'stable=20260903-16')
ipad = ipad.replace('iPad Build 2026.09.03.15', 'iPad Build 2026.09.03.16')
for old in ('diagnostics-v2.js?v=20260903-14','diagnostics-v2.js?v=20260903-15','diagnostics-v2.js?v=20260903-16','diagnostics-v2.js?v=20260903-17','diagnostics-v2.js?v=20260903-18','diagnostics-v2.js?v=20260903-19','diagnostics-v2.js?v=20260903-20'):
    ipad = ipad.replace(old,'diagnostics-v2.js?v=20260903-21')
if 'diagnostics-v2.js' not in ipad:
    ipad = insert_before_body(ipad, IPAD_TAG)
IPAD.write_text(ipad, encoding='utf-8')
