from pathlib import Path

ROOT = Path('index.html')
IPAD = Path('ipad/index.html')
ROOT_TAG = '<script src="diagnostics-v2.js?v=20260903-20"></script>'
IPAD_TAG = '<script src="../diagnostics-v2.js?v=20260903-17"></script>'
WORKSPACE_TAG = '<script src="workspace-repair-v21.js?v=20260903-23"></script>'


def insert_before_body(text: str, tag: str, needle: str) -> str:
    if needle in text:
        return text
    marker = '</body>'
    if marker not in text:
        raise RuntimeError('Kein </body> gefunden')
    return text.replace(marker, tag + '\n' + marker, 1)


root = ROOT.read_text(encoding='utf-8')
for old in ('diagnostics-v2.js?v=20260903-14','diagnostics-v2.js?v=20260903-15','diagnostics-v2.js?v=20260903-16','diagnostics-v2.js?v=20260903-17','diagnostics-v2.js?v=20260903-18','diagnostics-v2.js?v=20260903-19'):
    root = root.replace(old,'diagnostics-v2.js?v=20260903-20')
for old in ('workspace-repair-v21.js?v=20260903-21','workspace-repair-v21.js?v=20260903-22'):
    root = root.replace(old,'workspace-repair-v21.js?v=20260903-23')
root = insert_before_body(root, ROOT_TAG, 'diagnostics-v2.js')
root = insert_before_body(root, WORKSPACE_TAG, 'workspace-repair-v21.js')
ROOT.write_text(root, encoding='utf-8')

ipad = IPAD.read_text(encoding='utf-8')
ipad = ipad.replace('stable=20260903-15', 'stable=20260903-16')
ipad = ipad.replace('iPad Build 2026.09.03.15', 'iPad Build 2026.09.03.16')
for old in ('diagnostics-v2.js?v=20260903-14','diagnostics-v2.js?v=20260903-15','diagnostics-v2.js?v=20260903-16'):
    ipad = ipad.replace(old,'diagnostics-v2.js?v=20260903-17')
ipad = insert_before_body(ipad, IPAD_TAG, 'diagnostics-v2.js')
IPAD.write_text(ipad, encoding='utf-8')
