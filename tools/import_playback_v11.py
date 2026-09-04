from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

if 'import-playback-v11' not in s:
    script=r'''
<script id="import-playback-v11">
(()=>{
  let timer=0, raf=0, playToken=0, cursors=[], activeScore=null, activeStart=0, activeMax=0, activeBpm=96, activeSpb=.625, baseTime=0, instMap=new Map();
  const prevStop=stopGMPlayback;

  function clearLocal(){
    playToken++;
    if(timer){clearTimeout(timer);timer=0;}
    if(raf){cancelAnimationFrame(raf);raf=0;}
    cursors=[];
    activeScore=null;
  }

  stopGMPlayback=function(update=true){
    clearLocal();
    return prevStop(update);
  };

  const fmt=x=>{x=Math.max(0,Math.floor(x));return Math.floor(x/60)+":"+String(x%60).padStart(2,'0')};

  playGMScore=async function(score,fromBeat=0){
    if(!score||!Array.isArray(score.tr)||!score.tr.length){
      const ps=document.getElementById('playerStatus');
      if(ps) ps.textContent='Noch keine Komposition zum Abspielen.';
      return;
    }

    clearLocal();
    const my=playToken;
    prevStop(false);
    const ac=ensurePlayerAudio();
    if(ac.state==='suspended') await ac.resume();

    activeScore=score;
    activeStart=Math.max(0,Number(fromBeat)||0);
    activeMax=scoreMaxBeat(score);
    activeBpm=Math.max(20,Math.min(300,Number(score.bpm)||96));
    activeSpb=60/activeBpm;
    baseTime=ac.currentTime+.12;

    const isImport=(typeof uploadedScore!=='undefined' && score===uploadedScore);
    const status=document.getElementById('playerStatus');
    const tracks=(score.tr||[]).filter(t=>Array.isArray(t.nt)&&t.nt.length);
    let noteCount=0;
    for(const t of tracks) noteCount+=(t.nt||[]).length;
    if(status) status.textContent=`Wiedergabe wird vorbereitet (${noteCount} Noten) …`;

    // Für importierte MIDI-Dateien benutzen wir bewusst eine speicherschonende Vorschau.
    // Viele unterschiedliche SoundFonts gleichzeitig können Android-WebViews blockieren.
    const uniquePrograms=new Set();
    for(const t of tracks){
      const ch=Math.max(0,Math.min(15,Number(t.ch)||0));
      const pg=Math.max(0,Math.min(127,Number(t.pg)||0));
      if(ch!==9) uniquePrograms.add(pg);
    }
    const lowMemoryImport=isImport && (uniquePrograms.size>2 || noteCount>12000);

    instMap=new Map();
    const needed=new Map();
    for(const t of tracks){
      const ch=Math.max(0,Math.min(15,Number(t.ch)||0));
      const pg=Math.max(0,Math.min(127,Number(t.pg)||0));
      const usePg=(lowMemoryImport && ch!==9)?0:pg;
      const key=ch===9?'drums':String(usePg);
      if(!needed.has(key)) needed.set(key,[usePg,ch]);
    }

    if(status) status.textContent=lowMemoryImport?'Speicherschonende MIDI-Vorschau wird geladen …':'Instrumente werden geladen …';
    for(const [key,[pg,ch]] of needed){
      if(my!==playToken) return;
      try{instMap.set(key,await loadGMInstrument(pg,ch));}
      catch(err){
        if(ch!==9 && pg!==0){
          try{instMap.set(key,await loadGMInstrument(0,0));}catch(_){throw err;}
        }else throw err;
      }
      await new Promise(r=>setTimeout(r,0));
    }
    if(my!==playToken) return;

    cursors=tracks.map(t=>({t,i:0}));
    for(const c of cursors){
      while(c.i<c.t.nt.length){
        const n=c.t.nt[c.i];
        const st=Number(n?.[0])||0, d=Math.max(.02,Number(n?.[1])||.25), g=n&&n.length>5?Math.max(.05,Math.min(4,Number(n[5])||.95)):.95;
        if(st+d*g>activeStart) break;
        c.i++;
      }
    }

    playerPlaying=true; playerPaused=false;
    if(status) status.textContent=lowMemoryImport?'Wiedergabe läuft (speicherschonende Vorschau).':'Wiedergabe läuft.';

    const lookAheadSec=1.25;
    function schedule(){
      if(my!==playToken||!playerPlaying) return;
      const nowBeat=activeStart+Math.max(0,ac.currentTime-baseTime)*activeBpm/60;
      const horizon=nowBeat+lookAheadSec*activeBpm/60;
      let emitted=0;

      while(emitted<400){
        let best=null, bestCursor=null, bestStart=Infinity;
        for(const c of cursors){
          if(c.i>=c.t.nt.length) continue;
          const n=c.t.nt[c.i], st=Number(n?.[0])||0;
          if(st<bestStart){bestStart=st;best=n;bestCursor=c;}
        }
        if(!bestCursor || bestStart>horizon) break;
        bestCursor.i++;

        const t=bestCursor.t;
        const ch=Math.max(0,Math.min(15,Number(t.ch)||0));
        const pg=Math.max(0,Math.min(127,Number(t.pg)||0));
        const usePg=(lowMemoryImport && ch!==9)?0:pg;
        const key=ch===9?'drums':String(usePg);
        const inst=instMap.get(key);
        const st=Number(best[0])||0, d=Math.max(.02,Number(best[1])||.25), g=best.length>5?Math.max(.05,Math.min(4,Number(best[5])||.95)):.95, en=st+d*g;
        if(en<=activeStart) continue;
        const pitch=Math.max(0,Math.min(127,Math.round(Number(best[2])||60)));
        const vel=Math.max(1,Math.min(127,Number(best[3])||80));
        const when=baseTime+Math.max(0,st-activeStart)*activeSpb;
        try{if(inst) inst.play(pitch,Math.max(ac.currentTime+.005,when),{duration:Math.max(.03,(en-Math.max(st,activeStart))*activeSpb),gain:Math.max(.02,Math.min(1,vel/127))});}catch(_){}
        emitted++;
      }
      timer=setTimeout(schedule,emitted>=400?0:70);
    }

    function tick(){
      if(my!==playToken||!playerPlaying) return;
      const beat=Math.min(activeMax,activeStart+Math.max(0,ac.currentTime-baseTime)*activeBpm/60), frac=activeMax?beat/activeMax:0;
      const r=document.getElementById('playerSeek'), tt=document.getElementById('playerTime');
      if(r) r.value=String(Math.round(frac*1000));
      if(tt) tt.textContent=`${fmt(beat*activeSpb)} / ${fmt(activeMax*activeSpb)}`;
      if(beat>=activeMax){
        if(playerLoopEnabled){playGMScore(score,0).catch(()=>{});}else{playerPlaying=false;if(status)status.textContent='Wiedergabe beendet.';}
        return;
      }
      raf=requestAnimationFrame(tick);
    }

    schedule();
    tick();
  };
})();
</script>
'''
    s=s.replace('</body>',script+'\n</body>',1)

s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=12")','navigator.serviceWorker.register("./service-worker.js?v=13")')
p.write_text(s,encoding='utf-8')
