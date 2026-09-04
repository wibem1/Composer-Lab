from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'comparison-progress-fix-v14' not in s:
    script=r'''
<script id="comparison-progress-fix-v14">
(()=>{
  const $=id=>document.getElementById(id);
  let active=null, raf=0, startMs=0, startBeat=0, pausedBeat=0;

  const getScore=w=>window.compositionLabGetComparisonSource?.(w)||null;
  const maxBeat=sc=>{ try{return Math.max(0,Number(scoreMaxBeat(sc))||0);}catch(_){return 0;} };
  const fmt=sec=>{
    sec=Math.max(0,Math.floor(Number(sec)||0));
    return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
  };
  const bpmOf=sc=>Math.max(20,Math.min(300,Number(sc?.bpm)||96));

  function paint(w,beat){
    const sc=getScore(w); if(!sc) return;
    const end=maxBeat(sc), bpm=bpmOf(sc), total=end*60/bpm;
    beat=Math.max(0,Math.min(end,Number(beat)||0));
    const seek=$("seekSource"+w), time=$("timeSource"+w);
    if(seek) seek.value=end>0?String(Math.round(1000*beat/end)):'0';
    if(time) time.textContent=fmt(beat*60/bpm)+' / '+fmt(total);
  }
  function stopClock(reset=false){
    if(raf){cancelAnimationFrame(raf);raf=0;}
    if(reset && active) paint(active,0);
  }
  function tick(){
    if(!active) return;
    const sc=getScore(active); if(!sc) return;
    if(playerPaused){ paint(active,pausedBeat); raf=requestAnimationFrame(tick); return; }
    const bpm=bpmOf(sc), end=maxBeat(sc);
    let beat=startBeat+(performance.now()-startMs)/1000*bpm/60;
    if(end>0 && beat>=end){
      if(playerLoopEnabled){ beat=beat%end; startBeat=beat; startMs=performance.now(); }
      else { beat=end; paint(active,beat); raf=0; return; }
    }
    pausedBeat=beat; paint(active,beat); raf=requestAnimationFrame(tick);
  }
  function beginClock(w,beat=0){
    stopClock(false); active=w; startBeat=Math.max(0,Number(beat)||0); pausedBeat=startBeat; startMs=performance.now(); paint(w,startBeat); raf=requestAnimationFrame(tick);
  }

  ['A','B'].forEach(w=>{
    const playBtn=$("playSource"+w), pauseBtn=$("pauseSource"+w), stopBtn=$("stopSource"+w), seek=$("seekSource"+w);
    if(playBtn){
      const old=playBtn.onclick;
      playBtn.onclick=async ev=>{
        if(old) await old.call(playBtn,ev);
        if(getScore(w)) beginClock(w,0);
      };
    }
    if(pauseBtn){
      const old=pauseBtn.onclick;
      pauseBtn.onclick=async ev=>{
        const wasPaused=!!playerPaused;
        if(old) await old.call(pauseBtn,ev);
        if(active!==w) active=w;
        if(!wasPaused && playerPaused){
          pausedBeat=startBeat+(performance.now()-startMs)/1000*bpmOf(getScore(w));
          pausedBeat=startBeat+(performance.now()-startMs)/1000*bpmOf(getScore(w))/60;
          paint(w,pausedBeat);
        } else if(wasPaused && !playerPaused){
          startBeat=pausedBeat; startMs=performance.now();
          if(!raf) raf=requestAnimationFrame(tick);
        }
      };
    }
    if(stopBtn){
      const old=stopBtn.onclick;
      stopBtn.onclick=ev=>{ if(old) old.call(stopBtn,ev); active=w; stopClock(true); };
    }
    if(seek){
      seek.oninput=()=>{
        const sc=getScore(w); if(!sc) return;
        const beat=maxBeat(sc)*(Number(seek.value)||0)/1000;
        paint(w,beat);
      };
      seek.onchange=async()=>{
        const sc=getScore(w); if(!sc) return;
        const beat=maxBeat(sc)*(Number(seek.value)||0)/1000;
        active=w; startBeat=beat; pausedBeat=beat; startMs=performance.now();
        try{ await playGMScore(sc,beat); beginClock(w,beat); }catch(_){}
      };
    }
  });

  const oldStop=window.stopGMPlayback;
  if(typeof oldStop==='function'){
    window.stopGMPlayback=function(update=true){ stopClock(false); return oldStop(update); };
  }
})();
</script>
'''
    s=s.replace('</body>',script+'</body>',1)
p.write_text(s,encoding='utf-8')
