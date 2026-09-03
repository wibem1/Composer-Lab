from pathlib import Path

ROOT = Path('index.html')
IPAD = Path('ipad/index.html')
ROOT_TAG = '<script src="diagnostics-v2.js?v=20260903-14"></script>'
IPAD_TAG = '<script src="../diagnostics-v2.js?v=20260903-14"></script>'


def insert_before_body(text: str, tag: str) -> str:
    if 'diagnostics-v2.js' in text:
        return text
    marker = '</body>'
    if marker not in text:
        raise RuntimeError('Kein </body> gefunden')
    return text.replace(marker, tag + '\n' + marker, 1)


root = ROOT.read_text(encoding='utf-8')
root = insert_before_body(root, ROOT_TAG)
ROOT.write_text(root, encoding='utf-8')

ipad = IPAD.read_text(encoding='utf-8')
ipad = ipad.replace('stable=20260903-13', 'stable=20260903-14')
ipad = ipad.replace("iPad Build 2026.09.03.13", "iPad Build 2026.09.03.14")
ipad = insert_before_body(ipad, IPAD_TAG)
IPAD.write_text(ipad, encoding='utf-8')
