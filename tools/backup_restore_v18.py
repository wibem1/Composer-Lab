from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='</body>'
if 'backup-restore-v18' not in s:
    script=r'''
<script id="backup-restore-v18">
(()=>{
  const FORMAT='composition-lab-backup', VERSION=1;
  function safeParse(raw, fallback=null){try{return raw==null?fallback:JSON.parse(raw);}catch(_){return fallback;}}
  function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
  function status(msg, cls='ok'){
    const el=document.getElementById('status');
    if(el) el.innerHTML='<span class="'+cls+'">'+esc(msg)+'</span>';
  }
  function collect(){
    return {
      format:FORMAT,
      version:VERSION,
      createdAt:new Date().toISOString(),
      data:{
        settings:safeParse(localStorage.getItem(STORAGE_ID),{}),
        history:safeParse(localStorage.getItem(HISTORY_ID),[]),
        experimentHistory:safeParse(localStorage.getItem(EXPERIMENT_HISTORY_ID),[])
      }
    };
  }
  function downloadBackup(){
    const backup=collect();
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download='Composition-Lab-Sicherung-'+stamp()+'.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    status('Sicherung exportiert. API-Schlüssel werden nicht zusätzlich in die Sicherung aufgenommen.');
  }
  function validBackup(x){
    return x&&x.format===FORMAT&&Number(x.version)>=1&&x.data&&typeof x.data==='object'&&
      Array.isArray(x.data.history)&&Array.isArray(x.data.experimentHistory)&&x.data.settings&&typeof x.data.settings==='object';
  }
  function makeSafetySnapshot(){
    const key='composition_lab_pre_restore_'+Date.now();
    try{localStorage.setItem(key,JSON.stringify(collect())); return key;}catch(_){return null;}
  }
  async function importBackup(file){
    if(!file) return;
    let backup;
    try{backup=JSON.parse(await file.text());}catch(_){status('Die Sicherungsdatei ist kein gültiges JSON.','err');return;}
    if(!validBackup(backup)){status('Diese Datei ist keine gültige Composition-Lab-Sicherung.','err');return;}
    const ok=confirm('Sicherung vom '+(backup.createdAt||'unbekannten Datum')+' wiederherstellen? Die aktuellen Daten werden vorher intern gesichert.');
    if(!ok) return;
    const snapshotKey=makeSafetySnapshot();
    try{
      localStorage.setItem(STORAGE_ID,JSON.stringify(backup.data.settings));
      localStorage.setItem(HISTORY_ID,JSON.stringify(backup.data.history));
      localStorage.setItem(EXPERIMENT_HISTORY_ID,JSON.stringify(backup.data.experimentHistory));
      sessionStorage.setItem('composition_lab_restore_message','Sicherung erfolgreich wiederhergestellt'+(snapshotKey?' · vorheriger Stand intern gesichert.':'.'));
      location.reload();
    }catch(e){status('Wiederherstellung fehlgeschlagen: '+(e?.message||e),'err');}
  }
  function installUI(){
    const clear=document.getElementById('clearHistoryBtn');
    if(!clear||document.getElementById('exportBackupBtn')) return;
    const exp=document.createElement('button'); exp.type='button'; exp.id='exportBackupBtn'; exp.className='secondary smallbtn'; exp.textContent='Sicherung exportieren';
    const imp=document.createElement('button'); imp.type='button'; imp.id='importBackupBtn'; imp.className='secondary smallbtn'; imp.textContent='Sicherung importieren';
    const input=document.createElement('input'); input.type='file'; input.id='backupFileInput'; input.accept='.json,application/json'; input.style.display='none';
    exp.addEventListener('click',downloadBackup);
    imp.addEventListener('click',()=>{input.value='';input.click();});
    input.addEventListener('change',()=>importBackup(input.files&&input.files[0]));
    const parent=clear.parentElement; if(parent){parent.appendChild(exp);parent.appendChild(imp);parent.appendChild(input);}
  }
  window.compositionLabExportBackup=downloadBackup;
  window.compositionLabImportBackup=importBackup;
  installUI();
  const msg=sessionStorage.getItem('composition_lab_restore_message');
  if(msg){sessionStorage.removeItem('composition_lab_restore_message'); setTimeout(()=>status(msg),100);}
})();
</script>
'''
    s=s.replace(marker,script+'\n'+marker,1)
# bump service worker registration query where present
import re
s=re.sub(r'navigator\.serviceWorker\.register\("\./service-worker\.js\?v=\d+"\)', 'navigator.serviceWorker.register("./service-worker.js?v=18")', s)
p.write_text(s,encoding='utf-8')
