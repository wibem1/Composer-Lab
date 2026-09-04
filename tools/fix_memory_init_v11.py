from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='''$("variantA").onchange = () => renderVariantCard("A");
$("variantB").onchange = () => renderVariantCard("B");
$("loadVariantA").onclick = () => loadVariant("A");
$("loadVariantB").onclick = () => loadVariant("B");
$("midiVariantA").onclick = () => downloadVariant("A");
$("midiVariantB").onclick = () => downloadVariant("B");

initApp();'''
new='''if($("variantA")) $("variantA").onchange = () => renderVariantCard("A");
if($("variantB")) $("variantB").onchange = () => renderVariantCard("B");
if($("loadVariantA")) $("loadVariantA").onclick = () => loadVariant("A");
if($("loadVariantB")) $("loadVariantB").onclick = () => loadVariant("B");
if($("midiVariantA")) $("midiVariantA").onclick = () => downloadVariant("A");
if($("midiVariantB")) $("midiVariantB").onclick = () => downloadVariant("B");

initApp();'''
if old not in s:
    raise SystemExit('obsolete variant handler block not found')
s=s.replace(old,new,1)
s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=13")','navigator.serviceWorker.register("./service-worker.js?v=14")')
s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=12")','navigator.serviceWorker.register("./service-worker.js?v=14")')
p.write_text(s,encoding='utf-8')
