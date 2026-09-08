(()=>{
'use strict';
if(window.__compositionLabDiagnosticsAlias)return;
window.__compositionLabDiagnosticsAlias=true;
const s=document.createElement('script');
s.async=false;
s.src='/Composer-Lab/diagnostics.js?fresh='+Date.now();
(document.head||document.body).appendChild(s);
})();
